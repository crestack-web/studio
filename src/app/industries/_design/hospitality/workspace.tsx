'use client';

import React, { useState } from 'react';
import { Copy, ExternalLink } from 'lucide-react';
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
  hotel,
  orgSettings,
  reviews,
  websiteInquiries,
  websiteSections,
  websiteStats,
} from './mock';
import { useSolutionsLive } from '../live';

export function HospitalityWebsite({ hrefFor }: { hrefFor: (s: string) => string }) {
  const { toast } = useToast();
  const { mutate } = useSolutionsLive();
  const [sections, setSections] = useState(websiteSections);
  const [published, setPublished] = useState(websiteStats.published);

  const toggle = async (id: string, enabled: boolean) => {
    const section = sections.find((s) => s.id === id);
    setSections((list) => list.map((s) => (s.id === id ? { ...s, enabled } : s)));
    const res = await mutate({
      action: 'record_update',
      id,
      meta: { enabled, name: section?.name, description: section?.description },
    });
    if (!res.ok) {
      setSections((list) => list.map((s) => (s.id === id ? { ...s, enabled: !enabled } : s)));
      toast(res.error || 'Could not update section.');
      return;
    }
    toast(`${section?.name || 'Section'} ${enabled ? 'enabled' : 'hidden'} on the website.`);
  };

  const setPublish = async (v: boolean) => {
    setPublished(v);
    const res = await mutate({
      action: 'settings_save',
      settings: { websitePublished: v, name: hotel.name },
    });
    if (!res.ok) {
      setPublished(!v);
      toast(res.error || 'Could not update website status.');
      return;
    }
    toast(v ? 'Website published.' : 'Website moved to draft.');
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
            <span className="sol-stat-line">{hotel.website || 'No public URL yet'}</span>
          </>
        }
      />

      <div className="sol-kpis">
        <Kpi label="Visits · 30 days" value={websiteStats.visits30d.toLocaleString()} icon="globe" foot="tracked visits" accent />
        <Kpi label="Direct bookings" value={websiteStats.directBookings30d} icon="calendar" foot="from live bookings" />
        <Kpi label="Inquiries" value={websiteStats.inquiries30d || websiteInquiries.length} icon="mail" foot="contact form" />
        <Kpi label="Conversion" value={`${websiteStats.conversion}%`} icon="trend" foot="visit to booking" />
      </div>

      <div className="sol-split">
        <Card title="Live preview" subtitle="What guests see when they land on your site">
          <div className="sol-site-preview">
            <div className="sol-site-frame">
              <span className="sol-site-dots"><span /><span /><span /></span>
              <span className="sol-site-url">{hotel.website || 'your-hotel.busmo.site'}</span>
              <Badge tone={published ? 'green' : 'amber'}>{published ? 'Live' : 'Draft'}</Badge>
            </div>
            <div className="sol-site-hero">
              <small>{hotel.location || 'Nigeria'}</small>
              <strong>{hotel.name || 'Your hotel'}</strong>
              <p>Rooms, rates and availability stay in sync with this workspace.</p>
              <span className="sol-site-cta">Check availability →</span>
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
              <Switch checked={published} onChange={(v) => { void setPublish(v); }} label="Website status" />
            </div>
          </Card>
        </div>
      </div>

      <div className="sol-grid sol-grid-2">
        <Card title="Page sections" subtitle="Choose what appears on your site" flush>
          <div style={{ padding: '0 18px' }}>
            {sections.length ? sections.map((s) => (
              <div key={s.id} className="sol-settings-row">
                <div className="sol-settings-row-text">
                  <strong>{s.name}</strong>
                  <small>{s.description}</small>
                </div>
                <Switch checked={s.enabled} onChange={(v) => { void toggle(s.id, v); }} label={s.name} />
              </div>
            )) : (
              <p className="sol-small sol-muted" style={{ padding: '16px 0' }}>No website sections yet. They appear after the website module is seeded for this property.</p>
            )}
          </div>
        </Card>

        <Card title="Guest reviews" subtitle="Recent stays" flush>
          <div style={{ padding: '4px 18px' }}>
            {reviews.length ? reviews.map((r: any) => (
              <div key={r.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--sol-border)' }}>
                <div className="sol-between" style={{ marginBottom: 4 }}>
                  <div className="sol-person">
                    <Avatar name={r.guest} size="sm" />
                    <div className="sol-person-text">
                      <span className="sol-person-name">{r.guest}</span>
                      <span className="sol-person-sub">{fmtDate(r.date)}</span>
                    </div>
                  </div>
                  <span className="sol-small" style={{ color: 'var(--sol-amber)' }}>{'★'.repeat(Math.max(0, Number(r.rating) || 0))}</span>
                </div>
                <p className="sol-small sol-muted" style={{ margin: 0, lineHeight: 1.5 }}>{r.text}</p>
              </div>
            )) : (
              <p className="sol-small sol-muted" style={{ padding: '16px 0' }}>No reviews yet.</p>
            )}
          </div>
        </Card>
      </div>

      <Card title="Website inquiries" subtitle="Messages from the contact form" flush>
        {websiteInquiries.length ? (
          <TableWrap>
            <table className="sol-table">
              <thead>
                <tr>
                  <Th>Guest</Th>
                  <Th>Dates</Th>
                  <Th align="right">Guests</Th>
                  <Th>Status</Th>
                  <Th>Received</Th>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        ) : (
          <p className="sol-small sol-muted" style={{ padding: '16px 18px' }}>No inquiries yet.</p>
        )}
      </Card>
    </>
  );
}

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

export function HospitalityAccount({ hrefFor }: { hrefFor: (s: string) => string }) {
  const { toast } = useToast();
  const [name, setName] = useState(hotel.ownerName || '');
  const [email, setEmail] = useState(hotel.ownerEmail || '');

  return (
    <>
      <PageHeader
        eyebrow={<><Icon name="user" size={13} /> Workspace</>}
        title="Account"
        subtitle="Your profile, security and notification preferences."
        actions={
          <button type="button" className="sol-btn sol-btn-primary" onClick={() => toast('Account preferences are managed from your Busmo profile.')}>
            Save changes
          </button>
        }
      />
      <Card title="Your profile" subtitle="How you appear to the team">
        <div className="sol-row sol-gap-2" style={{ marginBottom: 14 }}>
          <Avatar name={name || 'Owner'} size="lg" />
          <div>
            <div className="sol-person-name">{name || 'Owner'}</div>
            <div className="sol-person-sub">Owner · {hotel.name || 'Your hotel'}</div>
          </div>
        </div>
        <div className="sol-form-grid">
          <Field label="Full name" className="full"><input className="sol-input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Email" className="full"><input className="sol-input" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        </div>
      </Card>
    </>
  );
}

export function SuitePreviewPlaceholder({ suiteName, suiteId }: { suiteName: string; suiteId?: string }) {
  return (
    <Card title={`${suiteName} module`} subtitle="This section is available in the live suite workspace.">
      <p className="sol-small sol-muted">Open the corresponding nav item once data is connected for {suiteId || suiteName}.</p>
    </Card>
  );
}
