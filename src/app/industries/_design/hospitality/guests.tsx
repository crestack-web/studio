'use client';

import React, { useMemo, useState } from 'react';
import { Download, Plus } from 'lucide-react';
import {
  Avatar,
  Badge,
  Card,
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
import { useSolutionsLive } from '../live';
import type { Guest } from '../types';

type TabId = 'all' | 'vip' | 'in_house' | 'repeat';

export function HospitalityGuests({ hrefFor }: { hrefFor: (s: string) => string }) {
  const { toast } = useToast();
  const { mutate, version } = useSolutionsLive();
  const [tab, setTab] = useState<TabId>('all');
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('all');
  const [selected, setSelected] = useState<Guest | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [chargeOpen, setChargeOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const guestList = useMemo(() => [...guests], [version]);
  const bookingList = useMemo(() => [...bookings], [version]);

  const inHouseNames = useMemo(
    () => new Set(bookingList.filter((b) => b.status === 'checked_in').map((b) => b.guest_name)),
    [bookingList],
  );

  const counts = useMemo(
    () => ({
      all: guestList.length,
      vip: guestList.filter((g) => g.vip).length,
      in_house: guestList.filter((g) => inHouseNames.has(g.full_name)).length,
      repeat: guestList.filter((g) => g.stays > 1).length,
    }),
    [guestList, inHouseNames],
  );

  const countries = useMemo(
    () => Array.from(new Set(guestList.map((g) => g.country).filter(Boolean))).sort(),
    [guestList],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return guestList.filter((g) => {
      if (tab === 'vip' && !g.vip) return false;
      if (tab === 'in_house' && !inHouseNames.has(g.full_name)) return false;
      if (tab === 'repeat' && g.stays <= 1) return false;
      if (country !== 'all' && g.country !== country) return false;
      if (!q) return true;
      return `${g.full_name} ${g.email} ${g.phone}`.toLowerCase().includes(q);
    });
  }, [tab, country, query, inHouseNames, guestList]);

  const guestBookings = selected
    ? bookingList.filter(
        (b) =>
          (selected.id && b.guest_id === selected.id) ||
          b.guest_name === selected.full_name ||
          (selected.email && b.guest_email === selected.email),
      )
    : [];

  const openStay = guestBookings.find((b) => ['checked_in', 'confirmed', 'pending'].includes(b.status));
  const topSpend = guestList.reduce((a, b) => Math.max(a, b.total_spend), 0);
  const avgStays = guestList.length
    ? (guestList.reduce((a, b) => a + b.stays, 0) / guestList.length).toFixed(1)
    : '0';

  async function markVip(g: Guest, next: boolean) {
    setBusy(true);
    const res = await mutate({
      action: 'guest_update',
      id: g.id,
      vip: next,
      fullName: g.full_name,
    });
    setBusy(false);
    if (!res.ok) {
      toast(res.error || 'Could not update guest');
      return;
    }
    toast(next ? `${g.full_name} marked VIP` : `${g.full_name} VIP removed`);
    setSelected((s) => (s && s.id === g.id ? { ...s, vip: next } : s));
  }

  return (
    <>
      <PageHeader
        eyebrow={<><Icon name="users" size={13} /> Guests</>}
        title="Guest directory"
        subtitle="Every guest, their stays and spend — with live profiles from your property."
        actions={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => toast('Export is coming soon.')}>
              <Download size={15} aria-hidden /> Export
            </button>
            <button type="button" className="sol-btn sol-btn-primary" onClick={() => setAddOpen(true)}>
              <Plus size={15} aria-hidden /> Add guest
            </button>
          </>
        }
        meta={
          <>
            <span className="sol-stat-line"><span className="sol-dot green" /> {counts.in_house} in house</span>
            <span className="sol-stat-line"><span className="sol-dot amber" /> {counts.vip} VIP</span>
          </>
        }
      />

      <div className="sol-kpis">
        <Kpi label="Guests" value={guestList.length} icon="users" foot="on file" accent />
        <Kpi label="Avg stays" value={avgStays} icon="calendar" foot="per guest" />
        <Kpi label="Top spend" value={compactMoney(topSpend)} icon="wallet" foot="single guest" />
        <Kpi label="In house" value={counts.in_house} icon="bed" foot="checked in" />
      </div>

      <Card
        title="Directory"
        subtitle="Search by name, phone or email"
        action={<SearchInput value={query} onChange={setQuery} placeholder="Search guests…" />}
      >
        <div className="sol-mt-3 sol-flex sol-gap-2 sol-wrap">
          <Tabs<TabId>
            value={tab}
            onChange={setTab}
            items={[
              { id: 'all', label: 'All', count: counts.all },
              { id: 'in_house', label: 'In house', count: counts.in_house },
              { id: 'vip', label: 'VIP', count: counts.vip },
              { id: 'repeat', label: 'Repeat', count: counts.repeat },
            ]}
          />
          {countries.length > 0 ? (
            <select className="sol-input" style={{ maxWidth: 160 }} value={country} onChange={(e) => setCountry(e.target.value)}>
              <option value="all">All countries</option>
              {countries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          ) : null}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title={guestList.length === 0 ? 'No guests yet' : 'No matches'}
            description={
              guestList.length === 0
                ? 'Add a guest profile, or create a booking — guests are created automatically from reservations.'
                : 'Try another search or filter.'
            }
            action={
              guestList.length === 0 ? (
                <button type="button" className="sol-btn sol-btn-primary" onClick={() => setAddOpen(true)}>Add guest</button>
              ) : (
                <button type="button" className="sol-btn sol-btn-subtle" onClick={() => { setTab('all'); setCountry('all'); setQuery(''); }}>Clear filters</button>
              )
            }
          />
        ) : (
          <TableWrap>
            <table className="sol-table">
              <thead>
                <tr>
                  <Th>Guest</Th>
                  <Th>Contact</Th>
                  <Th>Stays</Th>
                  <Th>Spend</Th>
                  <Th>Last stay</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((g) => (
                  <tr key={g.id} data-clickable="true" onClick={() => setSelected(g)}>
                    <Td>
                      <div className="sol-row-main">
                        <Avatar name={g.full_name} />
                        <div>
                          <div className="sol-row-title">
                            {g.full_name}{' '}
                            {g.vip ? <Badge tone="amber" dot>VIP</Badge> : null}{' '}
                            {inHouseNames.has(g.full_name) ? <Badge tone="green" dot>In house</Badge> : null}
                          </div>
                          <div className="sol-row-sub">{g.country || '—'}</div>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <div className="sol-row-sub">{g.phone || '—'}</div>
                      <div className="sol-row-sub">{g.email || ''}</div>
                    </Td>
                    <Td>{g.stays}</Td>
                    <Td>{compactMoney(g.total_spend)}</Td>
                    <Td>{g.last_stay ? fmtDate(g.last_stay) : '—'}</Td>
                    <Td>
                      <div onClick={(e) => e.stopPropagation()}>
                        <Menu>
                          {({ close }) => (
                            <>
                              <MenuItem onClick={() => { close(); setSelected(g); }}>View guest</MenuItem>
                              <MenuItem onClick={() => { close(); setSelected(g); setChargeOpen(true); }}>Add charge</MenuItem>
                              <MenuItem onClick={() => { close(); setSelected(g); setPayOpen(true); }}>Record payment</MenuItem>
                              <MenuItem onClick={() => { close(); void markVip(g, !g.vip); }}>{g.vip ? 'Remove VIP' : 'Mark VIP'}</MenuItem>
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
        )}
      </Card>

      <Sheet
        open={!!selected && !chargeOpen && !payOpen}
        onClose={() => setSelected(null)}
        width={520}
        title={selected?.full_name || 'Guest'}
        subtitle={selected?.email || selected?.phone || 'Guest profile'}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-ghost" onClick={() => setSelected(null)}>Close</button>
            <button type="button" className="sol-btn sol-btn-subtle" disabled={!openStay} onClick={() => setChargeOpen(true)}>Add charge</button>
            <button type="button" className="sol-btn sol-btn-primary" onClick={() => setPayOpen(true)}>Record payment</button>
          </>
        }
      >
        {selected ? (
          <>
            <div className="sol-kpis sol-kpis-compact">
              <Kpi label="Stays" value={selected.stays} icon="calendar" />
              <Kpi label="Spend" value={compactMoney(selected.total_spend)} icon="wallet" />
              <Kpi label="Balance" value={compactMoney(guestBookings.reduce((s, b) => s + Number(b.balance_amount || 0), 0))} icon="receipt" />
            </div>
            <div className="sol-mt-3 sol-flex sol-gap-2 sol-wrap">
              <button type="button" className="sol-btn sol-btn-subtle sol-btn-sm" disabled={busy} onClick={() => void markVip(selected, !selected.vip)}>
                {selected.vip ? 'Remove VIP' : 'Mark as VIP'}
              </button>
              {!openStay ? (
                <span className="sol-row-sub">No open stay — charges need a booking.</span>
              ) : (
                <span className="sol-row-sub">Open stay: {openStay.room_number || 'room'} · balance {money(openStay.balance_amount || 0)}</span>
              )}
            </div>
            <h4 className="sol-section-title sol-mt-4">Stay history</h4>
            {guestBookings.length === 0 ? (
              <p className="sol-row-sub">No bookings linked yet.</p>
            ) : (
              <ul className="sol-simple-list">
                {guestBookings.map((b) => (
                  <li key={b.id}>
                    <strong>{b.room_number || 'Room'}</strong> · {b.status} · {fmtDate(b.check_in_date)} → {fmtDate(b.check_out_date)} · {money(b.amount)}
                    {b.balance_amount ? ` · bal ${money(b.balance_amount)}` : ''}
                  </li>
                ))}
              </ul>
            )}
            {selected.notes ? <p className="sol-row-sub sol-mt-3"><strong>Notes:</strong> {selected.notes}</p> : null}
          </>
        ) : null}
      </Sheet>

      <AddGuestSheet open={addOpen} onClose={() => setAddOpen(false)} />
      <MoneySheet kind="charge" open={chargeOpen && !!selected} guest={selected} bookingId={openStay?.id} roomNumber={openStay?.room_number || ''} onClose={() => setChargeOpen(false)} />
      <MoneySheet kind="payment" open={payOpen && !!selected} guest={selected} bookingId={openStay?.id} roomNumber={openStay?.room_number || ''} onClose={() => setPayOpen(false)} />
    </>
  );
}

function AddGuestSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const { mutate } = useSolutionsLive();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', country: 'Nigeria', notes: '' });
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function save() {
    const fullName = form.name.trim();
    if (!fullName) { toast('Full name is required.'); return; }
    setSaving(true);
    const res = await mutate({
      action: 'guest_create',
      fullName,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      country: form.country.trim() || 'Nigeria',
      notes: form.notes.trim() || null,
    });
    setSaving(false);
    if (!res.ok) { toast(res.error || 'Could not save guest'); return; }
    toast(`${fullName} added to directory`);
    setForm({ name: '', phone: '', email: '', country: 'Nigeria', notes: '' });
    onClose();
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      width={460}
      title="Add a guest"
      subtitle="Create a profile now — bookings can attach later"
      footer={
        <>
          <button type="button" className="sol-btn sol-btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="button" className="sol-btn sol-btn-primary" disabled={saving || !form.name.trim()} onClick={() => void save()}>
            {saving ? 'Saving…' : 'Add guest'}
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

function MoneySheet({
  kind, open, onClose, guest, bookingId, roomNumber,
}: {
  kind: 'charge' | 'payment';
  open: boolean;
  onClose: () => void;
  guest: Guest | null;
  bookingId?: string;
  roomNumber: string;
}) {
  const { toast } = useToast();
  const { mutate } = useSolutionsLive();
  const [saving, setSaving] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState(kind === 'charge' ? 'Extra service' : 'Payment received');
  const [method, setMethod] = useState<'card' | 'transfer' | 'cash' | 'pos'>('transfer');

  async function save() {
    const amt = Number(amount);
    if (!guest) return;
    if (!amt || amt <= 0) { toast('Enter a valid amount.'); return; }
    if (kind === 'charge' && !bookingId) {
      toast('This guest has no open stay to charge. Create a booking first.');
      return;
    }
    setSaving(true);
    if (kind === 'charge' && bookingId) {
      const res = await mutate({
        action: 'folio_add',
        bookingId,
        lineType: 'charge',
        description: description.trim() || 'Charge',
        amount: amt,
      });
      setSaving(false);
      if (!res.ok) { toast(res.error || 'Could not add charge'); return; }
      toast(`Charge of ${amt.toLocaleString()} posted for ${guest.full_name}`);
    } else {
      const res = await mutate({
        action: 'record_create',
        module: 'payments',
        title: guest.full_name,
        amount: amt,
        status: 'settled',
        notes: description.trim() || null,
        meta: {
          guest_name: guest.full_name,
          guest_id: guest.id,
          room_number: roomNumber,
          method,
          reference: `PAY-${Date.now().toString(36).toUpperCase()}`,
          date: new Date().toISOString().slice(0, 10),
        },
      });
      if (res.ok && bookingId) {
        await mutate({
          action: 'folio_add',
          bookingId,
          lineType: 'payment',
          description: description.trim() || `Payment (${method})`,
          amount: amt,
        });
      }
      setSaving(false);
      if (!res.ok) { toast(res.error || 'Could not record payment'); return; }
      toast(`Payment of ${amt.toLocaleString()} recorded for ${guest.full_name}`);
    }
    setAmount('');
    onClose();
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      width={420}
      title={kind === 'charge' ? 'Add charge' : 'Record payment'}
      subtitle={guest ? guest.full_name : ''}
      footer={
        <>
          <button type="button" className="sol-btn sol-btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="button" className="sol-btn sol-btn-primary" disabled={saving} onClick={() => void save()}>
            {saving ? 'Saving…' : kind === 'charge' ? 'Post charge' : 'Save payment'}
          </button>
        </>
      }
    >
      <div className="sol-form-grid">
        <Field label="Amount (NGN)" className="full">
          <input className="sol-input" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 15000" />
        </Field>
        <Field label="Description" className="full">
          <input className="sol-input" value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        {kind === 'payment' ? (
          <Field label="Method" className="full">
            <select className="sol-input" value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
              <option value="transfer">Transfer</option>
              <option value="card">Card</option>
              <option value="cash">Cash</option>
              <option value="pos">POS</option>
            </select>
          </Field>
        ) : null}
        {!bookingId && kind === 'charge' ? (
          <p className="sol-row-sub full">No open booking for this guest — open a reservation first to post folio charges.</p>
        ) : null}
      </div>
    </Sheet>
  );
}
