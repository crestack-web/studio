'use client';

import React, { useState } from 'react';
import {
  Avatar,
  Badge,
  Banner,
  Card,
  Field,
  PageHeader,
  Sheet,
  StatusBadge,
  Switch,
  TableWrap,
  Td,
  Th,
  useToast,
} from '../primitives';
import { Icon } from '../icons';
import { money } from '../format';
import { firm, orgSettings, team } from './mock';
import { useSolutionsLive } from '../live';
import { toastInviteResult } from '../invite-feedback';

/* ── Business settings ────────────────────────────────────────────── */

const RATE_CARD = [
  { discipline: 'Strategy', rate: 75000, members: 1 },
  { discipline: 'Design', rate: 65000, members: 4 },
  { discipline: 'Engineering', rate: 50000, members: 1 },
  { discipline: 'Content', rate: 40000, members: 1 },
  { discipline: 'Operations', rate: 38000, members: 1 },
];

export function ProfessionalBusinessSettings() {
  const { toast } = useToast();
  const { mutate } = useSolutionsLive();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: firm.name,
    legal: firm.legalName,
    phone: firm.phone,
    email: firm.email,
    website: firm.website,
    address: firm.address,
    rate: String(firm.standardRate),
    tax: String(firm.taxRate),
    terms: String(firm.paymentTerms),
    target: String(firm.monthlyTarget),
  });
  const [settings, setSettings] = useState({
    autoDraft: orgSettings.autoDraft ?? true,
    overdueChase: orgSettings.overdueChase ?? true,
    timesheet: orgSettings.timesheet ?? true,
    digest: orgSettings.digest ?? true,
  });
  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async () => {
    setSaving(true);
    const res = await mutate({
      action: 'settings_save',
      settings: { ...form, ...settings, currency: firm.currency },
    });
    setSaving(false);
    if (!res.ok) {
      toast(res.error || 'Could not save business settings.');
      return;
    }
    toast('Business settings saved.');
  };

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <Icon name="settings" size={13} /> Workspace
          </>
        }
        title="Business settings"
        subtitle="Firm details, rates, billing defaults and the automation that keeps the studio moving."
        actions={
          <button
            type="button"
            className="sol-btn sol-btn-primary"
            onClick={save}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        }
      />

      <div className="sol-grid sol-grid-2">
        <Card title="Firm details" subtitle="Shown on invoices, proposals and client emails">
          <div className="sol-form-grid">
            <Field label="Trading name" className="full">
              <input className="sol-input" value={form.name} onChange={set('name')} />
            </Field>
            <Field label="Legal name" className="full">
              <input className="sol-input" value={form.legal} onChange={set('legal')} />
            </Field>
            <Field label="Phone">
              <input className="sol-input" value={form.phone} onChange={set('phone')} />
            </Field>
            <Field label="Email">
              <input className="sol-input" value={form.email} onChange={set('email')} />
            </Field>
            <Field label="Website" className="full">
              <input className="sol-input" value={form.website} onChange={set('website')} />
            </Field>
            <Field label="Address" className="full">
              <textarea className="sol-textarea" rows={2} value={form.address} onChange={set('address')} />
            </Field>
            <Field label="Registration" className="full">
              <input className="sol-input" value="RC 1482092 · VAT NG-4482019" readOnly />
            </Field>
          </div>
        </Card>

        <div className="sol-aside-stack">
          <Card title="Rates & billing" subtitle="Applied to invoices and project costing">
            <div className="sol-form-grid">
              <Field label="Standard hourly rate" className="full">
                <input
                  className="sol-input"
                  value={form.rate}
                  onChange={set('rate')}
                  inputMode="numeric"
                />
              </Field>
              <Field label="VAT / tax rate" hint="Percent added to invoices.">
                <input className="sol-input" value={form.tax} onChange={set('tax')} inputMode="decimal" />
              </Field>
              <Field label="Payment terms" hint="Days until an invoice is due.">
                <input className="sol-input" value={form.terms} onChange={set('terms')} inputMode="numeric" />
              </Field>
              <Field label="Monthly revenue target" className="full">
                <input
                  className="sol-input"
                  value={form.target}
                  onChange={set('target')}
                  inputMode="numeric"
                />
              </Field>
              <div className="full sol-small sol-muted">
                At the current rate, the studio needs roughly{' '}
                <strong>{Math.round(Number(form.target || 0) / Math.max(1, Number(form.rate || 1)))}</strong>{' '}
                billable hours a month to hit target.
              </div>
            </div>
          </Card>

          <Card title="Automation" subtitle="Defaults that keep delivery and billing in sync">
            <div className="sol-settings-row">
              <div className="sol-settings-row-text">
                <strong>Draft invoices from billable time</strong>
                <small>Create month-end drafts automatically from unbilled hours.</small>
              </div>
              <Switch
                checked={settings.autoDraft}
                onChange={(v) => setSettings((s) => ({ ...s, autoDraft: v }))}
                label="Draft invoices automatically"
              />
            </div>
            <div className="sol-settings-row">
              <div className="sol-settings-row-text">
                <strong>Overdue payment reminders</strong>
                <small>Email clients 3 and 14 days after an invoice falls due.</small>
              </div>
              <Switch
                checked={settings.overdueChase}
                onChange={(v) => setSettings((s) => ({ ...s, overdueChase: v }))}
                label="Overdue reminders"
              />
            </div>
            <div className="sol-settings-row">
              <div className="sol-settings-row-text">
                <strong>Timesheet reminders</strong>
                <small>Nudge the team every Friday at 16:00.</small>
              </div>
              <Switch
                checked={settings.timesheet}
                onChange={(v) => setSettings((s) => ({ ...s, timesheet: v }))}
                label="Timesheet reminders"
              />
            </div>
            <div className="sol-settings-row">
              <div className="sol-settings-row-text">
                <strong>Monday studio digest</strong>
                <small>Delivery, cash and utilisation in one email.</small>
              </div>
              <Switch
                checked={settings.digest}
                onChange={(v) => setSettings((s) => ({ ...s, digest: v }))}
                label="Monday digest"
              />
            </div>
          </Card>
        </div>
      </div>

      <Card title="Rate card" subtitle="Standard hourly rates by discipline" flush className="sol-mt-3">
        <TableWrap>
          <table className="sol-table">
            <thead>
              <tr>
                <Th>Discipline</Th>
                <Th align="right">People</Th>
                <Th align="right">Standard rate</Th>
                <Th align="right" width={90} />
              </tr>
            </thead>
            <tbody>
              {RATE_CARD.map((r) => (
                <tr key={r.discipline}>
                  <Td>
                    <span className="strong">{r.discipline}</span>
                  </Td>
                  <Td align="right" className="num">
                    {r.members}
                  </Td>
                  <Td align="right" className="num">
                    {money(r.rate)}/hr
                  </Td>
                  <Td align="right">
                    <button
                      type="button"
                      className="sol-btn sol-btn-ghost sol-btn-sm"
                      onClick={() => toast(`${r.discipline} rate editor opened.`)}
                    >
                      Edit
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Card>

      <Banner
        tone="amber"
        icon="help"
        title="Danger zone"
        action={
          <button
            type="button"
            className="sol-btn sol-btn-danger sol-btn-sm"
            onClick={() => toast('This action needs owner confirmation.')}
          >
            Close workspace
          </button>
        }
      >
        Closing the studio workspace hides it from clients and stops new invoices. Existing records are
        kept for seven years.
      </Banner>
    </>
  );
}

/* ── Account ──────────────────────────────────────────────────────── */

export function ProfessionalAccount() {
  const { toast } = useToast();
  const { mutate } = useSolutionsLive();
  const [name, setName] = useState(firm.ownerName);
  const [email, setEmail] = useState(firm.ownerEmail);
  const [twoFactor, setTwoFactor] = useState(true);
  const [emails, setEmails] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteSaving, setInviteSaving] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', discipline: 'Design' });

  const inviteStaff = async () => {
    const staffName = inviteForm.name.trim();
    const staffEmail = inviteForm.email.trim().toLowerCase();
    if (!staffName || !staffEmail || !staffEmail.includes('@')) {
      toast('Add a name and valid email to send the invite.');
      return;
    }
    setInviteSaving(true);
    const res = await mutate({
      action: 'record_create',
      module: 'team',
      title: staffName,
      status: 'active',
      meta: { email: staffEmail, discipline: inviteForm.discipline },
    });
    setInviteSaving(false);
    if (!res.ok) {
      toast(res.error || 'Could not add the team member.');
      return;
    }
    toastInviteResult(toast, { staffName, email: staffEmail, result: res });
    setInviteForm({ name: '', email: '', discipline: 'Design' });
    setInviteOpen(false);
  };

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <Icon name="user" size={13} /> Workspace
          </>
        }
        title="Account"
        subtitle="Your profile, security and notification preferences."
        actions={
          <button type="button" className="sol-btn sol-btn-primary" onClick={() => toast('Account updated.')}>
            Save changes
          </button>
        }
      />

      <div className="sol-grid sol-grid-2">
        <Card title="Your profile" subtitle="How you appear to the team and clients">
          <div className="sol-row sol-gap-2" style={{ marginBottom: 14 }}>
            <Avatar name={name} size="lg" />
            <div>
              <div className="sol-person-name">{name}</div>
              <div className="sol-person-sub">Owner · {firm.name}</div>
            </div>
          </div>
          <div className="sol-form-grid">
            <Field label="Full name" className="full">
              <input className="sol-input" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Email" className="full">
              <input className="sol-input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Role" className="full">
              <input className="sol-input" value="Founder & strategy lead" readOnly />
            </Field>
            <Field label="Signature" className="full" hint="Added to invoices and client emails.">
              <textarea
                className="sol-textarea"
                rows={2}
                defaultValue={`${firm.ownerName} · ${firm.name} · ${firm.phone}`}
              />
            </Field>
          </div>
        </Card>

        <div className="sol-aside-stack">
          <Card title="Security" subtitle="Keep the studio workspace safe">
            <div className="sol-settings-row">
              <div className="sol-settings-row-text">
                <strong>Two-factor authentication</strong>
                <small>Require a code from your phone at sign-in.</small>
              </div>
              <Switch checked={twoFactor} onChange={setTwoFactor} label="Two factor authentication" />
            </div>
            <div className="sol-settings-row">
              <div className="sol-settings-row-text">
                <strong>Password</strong>
                <small>Last changed 3 months ago.</small>
              </div>
              <button
                type="button"
                className="sol-btn sol-btn-subtle sol-btn-sm"
                onClick={() => toast('Password reset email sent.')}
              >
                Change
              </button>
            </div>
            <div className="sol-settings-row">
              <div className="sol-settings-row-text">
                <strong>Active sessions</strong>
                <small>3 devices signed in.</small>
              </div>
              <button
                type="button"
                className="sol-btn sol-btn-ghost sol-btn-sm"
                onClick={() => toast('Other sessions signed out.')}
              >
                Sign out
              </button>
            </div>
          </Card>

          <Card title="Notifications" subtitle="What lands in your inbox">
            <div className="sol-settings-row">
              <div className="sol-settings-row-text">
                <strong>Daily summary email</strong>
                <small>Tasks, deadlines and cash each morning.</small>
              </div>
              <Switch checked={emails} onChange={setEmails} label="Daily summary email" />
            </div>
            <div className="sol-settings-row">
              <div className="sol-settings-row-text">
                <strong>Project alerts</strong>
                <small>Budget overruns, blocked tasks and at-risk delivery.</small>
              </div>
              <Switch checked onChange={() => toast('Project alerts are on.')} label="Project alerts" />
            </div>
            <div className="sol-settings-row">
              <div className="sol-settings-row-text">
                <strong>Invoice activity</strong>
                <small>Payments received and reminders sent.</small>
              </div>
              <Switch checked onChange={() => toast('Invoice alerts are on.')} label="Invoice activity" />
            </div>
          </Card>
        </div>
      </div>

      <Card
        title="Workspace access"
        subtitle={`${team.length} people have a seat in ${firm.name}`}
        action={
          <button
            type="button"
            className="sol-btn sol-btn-subtle sol-btn-sm"
            onClick={() => setInviteOpen(true)}
          >
            <Icon name="plus" size={14} /> Invite
          </button>
        }
        flush
        className="sol-mt-3"
      >
        <TableWrap>
          <table className="sol-table">
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Role</Th>
                <Th>Email</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {team.slice(0, 6).map((m) => (
                <tr key={m.id}>
                  <Td>
                    <div className="sol-person">
                      <Avatar name={m.full_name} />
                      <span className="sol-person-name">{m.full_name}</span>
                    </div>
                  </Td>
                  <Td className="muted">{m.role}</Td>
                  <Td className="muted">{m.email}</Td>
                  <Td>
                    <StatusBadge status={m.status} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Card>

      <div className="sol-mt-3">
        <Badge tone="green" dot>
          Workspace healthy · {team.filter((m) => m.status === 'active').length} active seats
        </Badge>
      </div>

      <Sheet
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite a team member"
        subtitle="They will get an email to join the workspace."
        width={440}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => setInviteOpen(false)}>
              Cancel
            </button>
            <button type="button" className="sol-btn sol-btn-primary" onClick={inviteStaff} disabled={inviteSaving}>
              {inviteSaving ? 'Sending…' : 'Send invite'}
            </button>
          </>
        }
      >
        <div className="sol-form-grid">
          <Field label="Full name" className="full">
            <input
              className="sol-input"
              value={inviteForm.name}
              onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
              placeholder="e.g. Ada Okafor"
            />
          </Field>
          <Field label="Work email" className="full">
            <input
              type="email"
              className="sol-input"
              value={inviteForm.email}
              onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              placeholder="name@firm.com"
            />
          </Field>
          <Field label="Discipline" className="full">
            <select
              className="sol-select"
              value={inviteForm.discipline}
              onChange={(e) => setInviteForm({ ...inviteForm, discipline: e.target.value })}
            >
              {['Design', 'Engineering', 'Strategy', 'Content', 'Operations'].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </Field>
        </div>
      </Sheet>
    </>
  );
}
