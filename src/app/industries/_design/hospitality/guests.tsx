'use client';

import React, { useMemo, useState } from 'react';
import { Download, Plus, Sparkles } from 'lucide-react';
import {
  Avatar,
  Badge,
  Card,
  Chips,
  EmptyState,
  Field,
  Kpi,
  Menu,
  MenuItem,
  PageHeader,
  SearchInput,
  Sheet,
  Tabs,
  Td,
  Th,
  TableWrap,
  useToast,
} from '../primitives';
import { Icon } from '../icons';
import { compactMoney, fmtDate, money } from '../format';
import { bookings, guests } from './mock';
import type { Guest } from '../types';

type TabId = 'all' | 'vip' | 'in_house' | 'repeat';

export function HospitalityGuests({ hrefFor }: { hrefFor: (s: string) => string }) {
  const { toast } = useToast();
  const [tab, setTab] = useState<TabId>('all');
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('all');
  const [selected, setSelected] = useState<Guest | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const inHouseNames = useMemo(
    () => new Set(bookings.filter((b) => b.status === 'checked_in').map((b) => b.guest_name)),
    []
  );

  const counts = useMemo(
    () => ({
      all: guests.length,
      vip: guests.filter((g) => g.vip).length,
      in_house: guests.filter((g) => inHouseNames.has(g.full_name)).length,
      repeat: guests.filter((g) => g.stays > 3).length,
    }),
    [inHouseNames]
  );

  const countries = useMemo(
    () => Array.from(new Set(guests.map((g) => g.country))).sort(),
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return guests.filter((g) => {
      if (tab === 'vip' && !g.vip) return false;
      if (tab === 'in_house' && !inHouseNames.has(g.full_name)) return false;
      if (tab === 'repeat' && g.stays <= 3) return false;
      if (country !== 'all' && g.country !== country) return false;
      if (!q) return true;
      return `${g.full_name} ${g.email} ${g.phone}`.toLowerCase().includes(q);
    });
  }, [tab, country, query, inHouseNames]);

  const guestBookings = selected
    ? bookings.filter((b) => b.guest_name === selected.full_name)
    : [];

  const topSpend = guests.reduce((a, b) => Math.max(a, b.total_spend), 0);
  const avgStays = guests.length ? (guests.reduce((a, b) => a + b.stays, 0) / guests.length).toFixed(1) : '0';

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <Icon name="users" size={13} /> Guests
          </>
        }
        title="Guest directory"
        subtitle="Every guest, their stays and spend — with preferences the whole team can see."
        actions={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => toast('Guest list exported as CSV.')}>
              <Download size={15} aria-hidden /> Export
            </button>
            <button type="button" className="sol-btn sol-btn-primary" onClick={() => setAddOpen(true)}>
              <Plus size={15} aria-hidden /> Add guest
            </button>
          </>
        }
        meta={
          <>
            <span className="sol-stat-line"><span className="sol-dot violet" /> {counts.vip} VIP guests</span>
            <span className="sol-stat-line"><span className="sol-dot blue" /> {counts.in_house} in-house</span>
            <span className="sol-stat-line"><span className="sol-dot green" /> {counts.repeat} repeat guests</span>
          </>
        }
      />

      <div className="sol-kpis">
        <Kpi label="Total guests" value={guests.length} icon="users" foot="in your directory" accent />
        <Kpi label="Repeat guests" value={counts.repeat} icon="refresh" delta="+3" deltaDir="up" foot="this month" />
        <Kpi label="Average stays" value={avgStays} icon="calendar" foot="per guest" />
        <Kpi label="Top lifetime value" value={compactMoney(topSpend)} icon="wallet" foot="single guest" />
      </div>

      <Card>
        <div className="sol-toolbar">
          <Tabs<TabId>
            value={tab}
            onChange={setTab}
            ariaLabel="Filter guests"
            items={[
              { id: 'all', label: 'All guests', count: counts.all },
              { id: 'vip', label: 'VIP', count: counts.vip },
              { id: 'in_house', label: 'In-house', count: counts.in_house },
              { id: 'repeat', label: 'Repeat', count: counts.repeat },
            ]}
          />
          <div className="sol-toolbar-spacer" />
          <SearchInput value={query} onChange={setQuery} placeholder="Search name, email or phone…" />
        </div>

        <div className="sol-mt-3">
          <Chips
            value={country}
            onChange={setCountry}
            items={[{ id: 'all', label: 'All countries' }, ...countries.map((c) => ({ id: c, label: c }))]}
          />
        </div>

        <div className="sol-mt-3">
          {filtered.length ? (
            <div className="sol-card" style={{ boxShadow: 'none' }}>
              <TableWrap>
                <table className="sol-table">
                  <thead>
                    <tr>
                      <Th>Guest</Th>
                      <Th>Contact</Th>
                      <Th align="right">Stays</Th>
                      <Th align="right">Lifetime spend</Th>
                      <Th>Last stay</Th>
                      <Th align="right" width={44} />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((g) => (
                      <tr key={g.id} data-clickable="true" onClick={() => setSelected(g)}>
                        <Td>
                          <div className="sol-person">
                            <Avatar name={g.full_name} />
                            <div className="sol-person-text">
                              <div className="sol-person-name">
                                {g.full_name}
                                {g.vip ? <span className="sol-tag" style={{ marginLeft: 6 }}>VIP</span> : null}
                              </div>
                              <div className="sol-person-sub">{g.country}</div>
                            </div>
                          </div>
                        </Td>
                        <Td>
                          <div className="sol-person-name">{g.phone}</div>
                          <div className="sol-person-sub">{g.email}</div>
                        </Td>
                        <Td align="right" className="num">{g.stays}</Td>
                        <Td align="right" className="num strong">{compactMoney(g.total_spend)}</Td>
                        <Td className="muted">{fmtDate(g.last_stay)}</Td>
                        <Td align="right">
                          <div onClick={(e) => e.stopPropagation()}>
                            <Menu label={`${g.full_name} actions`}>
                              {(close) => (
                                <>
                                  <MenuItem onClick={() => { close(); setSelected(g); }}>View guest</MenuItem>
                                  <MenuItem onClick={() => { close(); toast(`Reservation started for ${g.full_name}.`); }}>
                                    New reservation
                                  </MenuItem>
                                  <MenuItem onClick={() => { close(); toast(`Message sent to ${g.full_name}.`); }}>
                                    Send message
                                  </MenuItem>
                                </>
                              )}
                            </Menu>
                          </div>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            </div>
          ) : (
            <EmptyState
              icon="users"
              title="No guests match"
              message="Try a different tab, country or search term."
              action={
                <button
                  type="button"
                  className="sol-btn sol-btn-subtle sol-btn-sm"
                  onClick={() => { setTab('all'); setCountry('all'); setQuery(''); }}
                >
                  Reset filters
                </button>
              }
            />
          )}
        </div>
      </Card>

      <Sheet
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        width={500}
        title={selected?.full_name || ''}
        subtitle={selected ? `${selected.country} · ${selected.stays} stays` : ''}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-ghost" onClick={() => setSelected(null)}>Close</button>
            <button
              type="button"
              className="sol-btn sol-btn-primary"
              onClick={() => { toast(`Reservation started for ${selected?.full_name}.`); setSelected(null); }}
            >
              <Icon name="calendar" size={15} /> New reservation
            </button>
          </>
        }
      >
        {selected ? (
          <>
            <div className="sol-row sol-between">
              <div className="sol-person">
                <Avatar name={selected.full_name} size="lg" />
                <div className="sol-person-text">
                  <div className="sol-person-name">
                    {selected.full_name}
                    {selected.vip ? <span className="sol-tag" style={{ marginLeft: 6 }}>VIP</span> : null}
                  </div>
                  <div className="sol-person-sub">{selected.email}</div>
                </div>
              </div>
              <StatusPill />
            </div>

            <div className="sol-kv">
              <div className="sol-kv-row"><span>Phone</span><strong>{selected.phone}</strong></div>
              <div className="sol-kv-row"><span>ID number</span><strong>{selected.id_number || '—'}</strong></div>
              <div className="sol-kv-row"><span>Country</span><strong>{selected.country}</strong></div>
              <div className="sol-kv-row"><span>Lifetime spend</span><strong>{money(selected.total_spend)}</strong></div>
              <div className="sol-kv-row"><span>Last stay</span><strong>{fmtDate(selected.last_stay)}</strong></div>
            </div>

            {selected.notes ? (
              <div className="sol-banner amber">
                <span className="sol-banner-icon"><Sparkles size={16} /></span>
                <div className="sol-banner-body">
                  <strong>Preferences</strong>
                  <div>{selected.notes}</div>
                </div>
              </div>
            ) : null}

            <div>
              <div className="sol-section-title">
                <h2>Stay history</h2>
                <Badge tone="gray">{guestBookings.length} bookings</Badge>
              </div>
              {guestBookings.length ? (
                <div className="sol-kv">
                  {guestBookings.map((b) => (
                    <div key={b.id} className="sol-kv-row">
                      <span>Room {b.room_number} · {fmtDate(b.check_in_date)}</span>
                      <strong>{money(b.amount)}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="sol-help">No bookings on record yet.</div>
              )}
            </div>

            <div className="sol-row sol-gap-2 sol-wrap">
              <button type="button" className="sol-btn sol-btn-subtle sol-btn-sm" onClick={() => toast(`Message sent to ${selected.full_name}.`)}>
                Send message
              </button>
              <button type="button" className="sol-btn sol-btn-subtle sol-btn-sm" onClick={() => toast('Guest profile marked VIP.')}>
                Mark as VIP
              </button>
            </div>
          </>
        ) : null}
      </Sheet>

      <AddGuestSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}

function StatusPill() {
  return <Badge tone="green" dot>Returning guest</Badge>;
}

function AddGuestSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', phone: '', email: '', country: 'Nigeria', notes: '' });
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <Sheet
      open={open}
      onClose={onClose}
      width={460}
      title="Add a guest"
      subtitle="Create a profile now, attach a booking later"
      footer={
        <>
          <button type="button" className="sol-btn sol-btn-ghost" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="sol-btn sol-btn-primary"
            disabled={!form.name.trim()}
            onClick={() => { toast(`Guest ${form.name.trim()} added.`); onClose(); }}
          >
            Add guest
          </button>
        </>
      }
    >
      <div className="sol-form-grid">
        <Field label="Full name" className="full">
          <input className="sol-input" value={form.name} onChange={set('name')} placeholder="e.g. Ada Nwosu" />
        </Field>
        <Field label="Phone">
          <input className="sol-input" value={form.phone} onChange={set('phone')} placeholder="+234 …" />
        </Field>
        <Field label="Email">
          <input className="sol-input" value={form.email} onChange={set('email')} placeholder="guest@email.com" />
        </Field>
        <Field label="Country" className="full">
          <input className="sol-input" value={form.country} onChange={set('country')} />
        </Field>
        <Field label="Notes" className="full" hint="Allergies, preferences and anything the team should remember.">
          <textarea className="sol-textarea" value={form.notes} onChange={set('notes')} placeholder="Optional" />
        </Field>
      </div>
    </Sheet>
  );
}
