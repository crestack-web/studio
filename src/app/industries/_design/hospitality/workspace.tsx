'use client';

import React, { useState } from 'react';
import { Copy, ExternalLink, Plus } from 'lucide-react';
import {
  Avatar,
  Badge,
  Banner,
  Card,
  Field,
  Kpi,
  PageHeader,
  Progress,
  StatusBadge,
  Switch,
  Td,
  Th,
  TableWrap,
  useToast,
} from '../primitives';
import { Icon } from '../icons';
import { fmtDate, money } from '../format';
import {
  guests,
  hotel,
  orgSettings,
  reviews,
  websiteInquiries,
  websiteSections,
  websiteStats,
} from './mock';
import { useSolutionsLive } from '../live';

/* ── Website ──────────────────────────────────────────────────────── */

export function HospitalityWebsite({ hrefFor }: { hrefFor: (s: string) => string }) {
  const { toast } = useToast();
  const [sections, setSections] = useState(websiteSections);
  const [published, setPublished] = useState(websiteStats.published);

  const toggle = (id: string, enabled: boolean) => {
    setSections((list) => list.map((s) => (s.id === id ? { ...s, enabled } : s)));
    toast(`${sections.find((s) => s.id === id)?.name} ${enabled ? 'enabled' : 'hidden'} on the website.`);
  };

  return (
    <>
      <PageHeader
        eyebrow={<><Icon name="globe" size={13} /> Website</>}
        title="Your booking website"
        subtitle="A direct-booking site that stays in sync with rooms, rates and availability."
        actions={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => toast('Website link copied.')}>
              <Copy size={15} aria-hidden /> Copy link
            </button>
            <button type="button" className="sol-btn sol-btn-primary" onClick={() => toast('Opening site preview…')}>
              <ExternalLink size={15} aria-hidden /> Visit site
            </button>
          </>
        }
        meta={
          <>
            <span className="sol-stat-line">
              <span className={`sol-dot ${published ? 'green' : 'amber'}`} /> {published ? 'Published' : 'Draft'}
            </span>
            <span className="sol-stat-line">{hotel.website}</span>
          </>
        }
      />

      <div className="sol-kpis">
        <Kpi label="Visits · 30 days" value={websiteStats.visits30d.toLocaleString()} icon="globe" delta="+18%" deltaDir="up" foot="vs previous" accent />
        <Kpi label="Direct bookings" value={websiteStats.directBookings30d} icon="calendar" foot="last 30 days" />
        <Kpi label="Inquiries" value={websiteStats.inquiries30d} icon="mail" foot="last 30 days" />
        <Kpi label="Conversion" value={`${websiteStats.conversion}%`} icon="trend" delta="+0.4pt" deltaDir="up" foot="visit to booking" />
      </div>

      <div className="sol-split">
        <Card title="Live preview" subtitle="What guests see when they land on your site">
          <div className="sol-site-preview">
            <div className="sol-site-frame">
              <span className="sol-site-dots"><span /><span /><span /></span>
              <span className="sol-site-url">{hotel.website}</span>
              <Badge tone={published ? 'green' : 'amber'}>{published ? 'Live' : 'Draft'}</Badge>
            </div>
            <div className="sol-site-hero">
              <small>{hotel.location}</small>
              <strong>{hotel.name}</strong>
              <p>Boutique comfort on the Lekki coast — rooms, suites and ocean views.</p>
              <span className="sol-site-cta">Check availability →</span>
            </div>
            <div className="sol-site-body">
              <div className="sol-site-tile">
                <small>From</small>
                <strong>{money(65000)}</strong>
                <span>per night</span>
              </div>
              <div className="sol-site-tile">
                <small>Rating</small>
                <strong>{hotel.rating} ★</strong>
                <span>guest reviews</span>
              </div>
              <div className="sol-site-tile">
                <small>Check-in</small>
                <strong>{hotel.checkIn}</strong>
                <span>check-out {hotel.checkOut}</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="sol-aside-stack">
          <Card title="Publishing" subtitle="Control what is live">
            <div className="sol-settings-row">
              <div className="sol-settings-row-text">
                <strong>Website status</strong>
                <small>{published ? 'Your site is live and taking bookings.' : 'Your site is hidden from guests.'}</small>
              </div>
              <Switch checked={published} onChange={(v) => { setPublished(v); toast(v ? 'Website published.' : 'Website moved to draft.'); }} label="Website status" />
            </div>
            <div className="sol-settings-row">
              <div className="sol-settings-row-text">
                <strong>Direct booking engine</strong>
                <small>Guests book rooms without leaving the site.</small>
              </div>
              <Switch checked onChange={() => toast('Booking engine is always on in Suite plan.')} label="Booking engine" />
            </div>
            <div className="sol-settings-row">
              <div className="sol-settings-row-text">
                <strong>Show live availability</strong>
                <small>Display real-time room availability.</small>
              </div>
              <Switch checked onChange={() => toast('Live availability is on.')} label="Live availability" />
            </div>
          </Card>

          <Card title="Site health" subtitle="Quick checks">
            <div className="sol-stack-3">
              <div>
                <div className="sol-between" style={{ marginBottom: 5 }}>
                  <span className="sol-small">SEO completeness</span>
                  <span className="sol-small sol-muted">86%</span>
                </div>
                <Progress value={86} tone="green" label="SEO completeness" />
              </div>
              <div>
                <div className="sol-between" style={{ marginBottom: 5 }}>
                  <span className="sol-small">Page speed</span>
                  <span className="sol-small sol-muted">92%</span>
                </div>
                <Progress value={92} tone="green" label="Page speed" />
              </div>
              <div>
                <div className="sol-between" style={{ marginBottom: 5 }}>
                  <span className="sol-small">Mobile readiness</span>
                  <span className="sol-small sol-muted">100%</span>
                </div>
                <Progress value={100} tone="green" label="Mobile readiness" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="sol-grid sol-grid-2">
        <Card title="Page sections" subtitle="Choose what appears on your site" flush>
          <div style={{ padding: '0 18px' }}>
            {sections.map((s) => (
              <div key={s.id} className="sol-settings-row">
                <div className="sol-settings-row-text">
                  <strong>{s.name}</strong>
                  <small>{s.description}</small>
                </div>
                <Switch checked={s.enabled} onChange={(v) => toggle(s.id, v)} label={s.name} />
              </div>
            ))}
          </div>
        </Card>

        <Card title="Guest reviews" subtitle={`${hotel.rating} average from recent stays`} flush>
          <div style={{ padding: '4px 18px' }}>
            {reviews.map((r) => (
              <div key={r.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--sol-border)' }}>
                <div className="sol-between" style={{ marginBottom: 4 }}>
                  <div className="sol-person">
                    <Avatar name={r.guest} size="sm" />
                    <div className="sol-person-text">
                      <span className="sol-person-name">{r.guest}</span>
                      <span className="sol-person-sub">{fmtDate(r.date)}</span>
                    </div>
                  </div>
                  <span className="sol-small" style={{ color: 'var(--sol-amber)' }}>{'★'.repeat(r.rating)}</span>
                </div>
                <p className="sol-small sol-muted" style={{ margin: 0, lineHeight: 1.5 }}>{r.text}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Website inquiries" subtitle="Messages from the contact form" flush>
        <TableWrap>
          <table className="sol-table">
            <thead>
              <tr>
                <Th>Guest</Th>
                <Th>Dates</Th>
                <Th align="right">Guests</Th>
                <Th>Status</Th>
                <Th>Received</Th>
                <Th align="right" width={90} />
              </tr>
            </thead>
            <tbody>
              {websiteInquiries.map((q) => (
                <tr key={q.id}>
                  <Td>
                    <div className="sol-person-name">{q.name}</div>
                    <div className="sol-person-sub">{q.email}</div>
                  </Td>
                  <Td>{q.dates}</Td>
                  <Td align="right" className="num">{q.guests}</Td>
                  <Td><StatusBadge status={q.status} /></Td>
                  <Td className="muted">{q.received_at}</Td>
                  <Td align="right">
                    <button type="button" className="sol-btn sol-btn-ghost sol-btn-sm" onClick={() => toast(`Reply started for ${q.name}.`)}>
                      Reply
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Card>
    </>
  );
}

/* ── Hotel settings ───────────────────────────────────────────────── */

export function HospitalityHotelSettings({ hrefFor }: { hrefFor: (s: string) => string }) {
  const { toast } = useToast();
  const { mutate } = useSolutionsLive();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: hotel.name,
    legal: hotel.legalName,
    phone: hotel.phone,
    email: hotel.email,
    address: hotel.address,
    checkIn: hotel.checkIn,
    checkOut: hotel.checkOut,
    tax: String(hotel.taxRate),
  });
  const [settings, setSettings] = useState({
    autoConfirm: orgSettings.autoConfirm ?? true,
    overbooking: orgSettings.overbooking ?? false,
    deposit: orgSettings.deposit ?? true,
    nightAudit: orgSettings.nightAudit ?? true,
  });
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async () => {
    setSaving(true);
    const res = await mutate({
      action: 'settings_save',
      settings: { ...form, ...settings, currency: hotel.currency },
    });
    setSaving(false);
    if (!res.ok) {
      toast(res.error || 'Could not save hotel settings.');
      return;
    }
    toast('Hotel settings saved.');
  };

  return (
    <>
      <PageHeader
        eyebrow={<><Icon name="settings" size={13} /> Workspace</>}
        title="Hotel settings"
        subtitle="Property details, policies and the defaults that power reservations, folios and the website."
        actions={
          <button type="button" className="sol-btn sol-btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        }
      />

      <div className="sol-grid sol-grid-2">
        <Card title="Property details" subtitle="Shown on confirmations and your website">
          <div className="sol-form-section">
            <div className="sol-form-grid">
              <Field label="Hotel name" className="full"><input className="sol-input" value={form.name} onChange={set('name')} /></Field>
              <Field label="Legal name" className="full"><input className="sol-input" value={form.legal} onChange={set('legal')} /></Field>
              <Field label="Phone"><input className="sol-input" value={form.phone} onChange={set('phone')} /></Field>
              <Field label="Email"><input className="sol-input" value={form.email} onChange={set('email')} /></Field>
              <Field label="Address" className="full"><textarea className="sol-textarea" value={form.address} onChange={set('address')} /></Field>
            </div>
          </div>
        </Card>

        <div className="sol-aside-stack">
          <Card title="Check-in & tax" subtitle="Applied to every reservation">
            <div className="sol-form-grid">
              <Field label="Check-in time"><input className="sol-input" value={form.checkIn} onChange={set('checkIn')} placeholder="14:00" /></Field>
              <Field label="Check-out time"><input className="sol-input" value={form.checkOut} onChange={set('checkOut')} placeholder="11:00" /></Field>
              <Field label="VAT / tax rate" className="full" hint="Percent applied to folio charges.">
                <input className="sol-input" value={form.tax} onChange={set('tax')} inputMode="decimal" />
              </Field>
            </div>
          </Card>

          <Card title="Automation" subtitle="Defaults for the front desk">
            <div className="sol-settings-row">
              <div className="sol-settings-row-text"><strong>Auto-confirm online bookings</strong><small>Website reservations are confirmed instantly.</small></div>
              <Switch checked={settings.autoConfirm} onChange={(v) => setSettings((s) => ({ ...s, autoConfirm: v }))} label="Auto confirm" />
            </div>
            <div className="sol-settings-row">
              <div className="sol-settings-row-text"><strong>Allow overbooking</strong><small>Not recommended — rooms can be sold twice.</small></div>
              <Switch checked={settings.overbooking} onChange={(v) => setSettings((s) => ({ ...s, overbooking: v }))} label="Overbooking" />
            </div>
            <div className="sol-settings-row">
              <div className="sol-settings-row-text"><strong>Collect deposit at booking</strong><small>Take one night upfront on direct bookings.</small></div>
              <Switch checked={settings.deposit} onChange={(v) => setSettings((s) => ({ ...s, deposit: v }))} label="Deposit" />
            </div>
            <div className="sol-settings-row">
              <div className="sol-settings-row-text"><strong>Run night audit automatically</strong><small>Reconcile folios and payments at midnight.</small></div>
              <Switch checked={settings.nightAudit} onChange={(v) => setSettings((s) => ({ ...s, nightAudit: v }))} label="Night audit" />
            </div>
          </Card>
        </div>
      </div>

      <Card title="Room types & rates" subtitle="Base rates used by reservations and the website" flush>
        <TableWrap>
          <table className="sol-table">
            <thead>
              <tr>
                <Th>Room type</Th>
                <Th align="right">Capacity</Th>
                <Th align="right">Base rate</Th>
                <Th align="right">Rooms</Th>
                <Th align="right" width={100} />
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Standard Queen', capacity: 2, rate: 65000, rooms: 20 },
                { name: 'Deluxe King', capacity: 2, rate: 95000, rooms: 16 },
                { name: 'Executive Suite', capacity: 3, rate: 150000, rooms: 8 },
                { name: 'Presidential Suite', capacity: 4, rate: 280000, rooms: 4 },
              ].map((t) => (
                <tr key={t.name}>
                  <Td><span className="strong">{t.name}</span></Td>
                  <Td align="right" className="num">{t.capacity}</Td>
                  <Td align="right" className="num">{money(t.rate)}</Td>
                  <Td align="right" className="num">{t.rooms}</Td>
                  <Td align="right">
                    <button type="button" className="sol-btn sol-btn-ghost sol-btn-sm" onClick={() => toast(`${t.name} rate editor opened.`)}>Edit</button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Card>

      <Banner tone="amber" icon="help" title="Danger zone" action={
        <button type="button" className="sol-btn sol-btn-danger sol-btn-sm" onClick={() => toast('This action needs owner confirmation.')}>
          Close property
        </button>
      }>
        Closing the property hides it from guests and stops new bookings. Existing reservations are kept.
      </Banner>
    </>
  );
}

/* ── Account ──────────────────────────────────────────────────────── */

export function HospitalityAccount({ hrefFor }: { hrefFor: (s: string) => string }) {
  const { toast } = useToast();
  const [name, setName] = useState(hotel.ownerName);
  const [email, setEmail] = useState(hotel.ownerEmail);
  const [twoFactor, setTwoFactor] = useState(true);
  const [emails, setEmails] = useState(true);

  return (
    <>
      <PageHeader
        eyebrow={<><Icon name="user" size={13} /> Workspace</>}
        title="Account"
        subtitle="Your profile, security and notification preferences."
        actions={
          <button type="button" className="sol-btn sol-btn-primary" onClick={() => toast('Account updated.')}>
            Save changes
          </button>
        }
      />

      <div className="sol-grid sol-grid-2">
        <Card title="Your profile" subtitle="How you appear to the team">
          <div className="sol-row sol-gap-2" style={{ marginBottom: 14 }}>
            <Avatar name={name} size="lg" />
            <div>
              <div className="sol-person-name">{name}</div>
              <div className="sol-person-sub">Owner · {hotel.name}</div>
            </div>
          </div>
          <div className="sol-form-grid">
            <Field label="Full name" className="full"><input className="sol-input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label="Email" className="full"><input className="sol-input" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            <Field label="Role" className="full"><input className="sol-input" value="General manager & owner" readOnly /></Field>
          </div>
        </Card>

        <div className="sol-aside-stack">
          <Card title="Security" subtitle="Keep your workspace safe">
            <div className="sol-settings-row">
              <div className="sol-settings-row-text"><strong>Two-factor authentication</strong><small>Require a code from your phone at sign-in.</small></div>
              <Switch checked={twoFactor} onChange={setTwoFactor} label="Two factor authentication" />
            </div>
            <div className="sol-settings-row">
              <div className="sol-settings-row-text"><strong>Password</strong><small>Last changed 3 months ago.</small></div>
              <button type="button" className="sol-btn sol-btn-subtle sol-btn-sm" onClick={() => toast('Password reset email sent.')}>Change</button>
            </div>
            <div className="sol-settings-row">
              <div className="sol-settings-row-text"><strong>Active sessions</strong><small>2 devices signed in.</small></div>
              <button type="button" className="sol-btn sol-btn-ghost sol-btn-sm" onClick={() => toast('Other sessions signed out.')}>Sign out</button>
            </div>
          </Card>

          <Card title="Notifications" subtitle="What lands in your inbox">
            <div className="sol-settings-row">
              <div className="sol-settings-row-text"><strong>Daily summary email</strong><small>Occupancy, arrivals and revenue each morning.</small></div>
              <Switch checked={emails} onChange={setEmails} label="Daily summary email" />
            </div>
            <div className="sol-settings-row">
              <div className="sol-settings-row-text"><strong>Payment alerts</strong><small>Get notified for failed or overdue payments.</small></div>
              <Switch checked onChange={() => toast('Payment alerts are on.')} label="Payment alerts" />
            </div>
            <div className="sol-settings-row">
              <div className="sol-settings-row-text"><strong>Housekeeping alerts</strong><small>Rooms blocked or overdue for cleaning.</small></div>
              <Switch checked onChange={() => toast('Housekeeping alerts are on.')} label="Housekeeping alerts" />
            </div>
          </Card>
        </div>
      </div>

      <Card title="Your team" subtitle="People with access to this workspace" action={
        <button type="button" className="sol-btn sol-btn-subtle sol-btn-sm" onClick={() => toast('Invite flow opened.')}>
          <Plus size={14} /> Invite
        </button>
      } flush>
        <TableWrap>
          <table className="sol-table">
            <thead>
              <tr><Th>Name</Th><Th>Role</Th><Th>Email</Th><Th>Status</Th></tr>
            </thead>
            <tbody>
              {guests.slice(0, 4).map((g, i) => (
                <tr key={g.id}>
                  <Td>
                    <div className="sol-person">
                      <Avatar name={g.full_name} />
                      <span className="sol-person-name">{g.full_name}</span>
                    </div>
                  </Td>
                  <Td className="muted">{i === 0 ? 'Owner' : i === 1 ? 'Front desk' : 'Staff'}</Td>
                  <Td className="muted">{g.email}</Td>
                  <Td><StatusBadge status="active" /></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Card>
    </>
  );
}

/* ── Placeholder for suites still in rebuild ──────────────────────── */

export function SuitePreviewPlaceholder({ suiteName, suiteId }: { suiteName: string; suiteId: string }) {
  return (
    <div className="sol-empty" style={{ minHeight: 420 }}>
      <span className="sol-empty-icon">
        <Icon name="sparkles" size={20} />
      </span>
      <h4>{suiteName} is being rebuilt</h4>
      <p>
        We&apos;re bringing the same craft from Hospitality to {suiteName}. The shell, dark mode and design
        system are already shared — the screens land next.
      </p>
      <div className="sol-row sol-gap-2 sol-wrap" style={{ justifyContent: 'center' }}>
        <Badge tone="green" dot>Design system ready</Badge>
        <Badge tone="blue" dot>Shell ready</Badge>
        <Badge tone="amber" dot>Screens queued</Badge>
      </div>
      <span className="sol-help">Suite id: {suiteId}</span>
    </div>
  );
}
