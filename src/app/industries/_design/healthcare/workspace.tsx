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
import { clinic, clinicians, orgSettings, patients } from './mock';
import { useSolutionsLive } from '../live';
import { toastInviteResult } from '../invite-feedback';

/* ── Clinic settings ──────────────────────────────────────────────── */

const SERVICES = [
  { name: 'General consultation', department: 'General medicine', price: 22000, duration: 20 },
  { name: 'Paediatric consultation', department: 'Paediatrics', price: 18000, duration: 20 },
  { name: 'Cardiology consultation', department: 'Cardiology', price: 35000, duration: 30 },
  { name: 'Antenatal package', department: 'Obstetrics', price: 120000, duration: 30 },
  { name: 'Dermatology consultation', department: 'Dermatology', price: 24000, duration: 20 },
  { name: 'Full blood count', department: 'Laboratory', price: 23000, duration: 15 },
];

const PAYERS = [
  { name: 'Hygeia HMO', plan: 'Gold', patients: 42, status: 'active' },
  { name: 'Reliance HMO', plan: 'Standard', patients: 28, status: 'active' },
  { name: 'AXA Mansard', plan: 'Corporate', patients: 16, status: 'active' },
  { name: 'Leadway Health', plan: 'Platinum', patients: 11, status: 'active' },
  { name: 'Avon HMO', plan: 'Standard', patients: 9, status: 'pending' },
];

export function HealthcareClinicSettings() {
  const { toast } = useToast();
  const { mutate } = useSolutionsLive();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: clinic.name,
    legal: clinic.legalName,
    phone: clinic.phone,
    email: clinic.email,
    address: clinic.address,
    opening: clinic.opening,
    closing: clinic.closing,
    tax: String(clinic.taxRate),
    beds: String(clinic.totalBeds),
  });
  const [settings, setSettings] = useState({
    autoConfirm: orgSettings.autoConfirm ?? true,
    reminders: orgSettings.reminders ?? true,
    teleconsult: orgSettings.teleconsult ?? true,
    walkIns: orgSettings.walkIns ?? true,
  });

  const save = async () => {
    setSaving(true);
    const res = await mutate({
      action: 'settings_save',
      settings: { ...form, ...settings, currency: clinic.currency },
    });
    setSaving(false);
    if (!res.ok) {
      toast(res.error || 'Could not save clinic settings.');
      return;
    }
    toast('Clinic settings saved.');
  };
  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <Icon name="settings" size={13} /> Workspace
          </>
        }
        title="Clinic settings"
        subtitle="Clinic details, opening hours, services and the defaults that power appointments, visits and billing."
        actions={
          <button type="button" className="sol-btn sol-btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        }
      />

      <div className="sol-grid sol-grid-2">
        <Card title="Clinic details" subtitle="Shown on invoices, reminders and patient records">
          <div className="sol-form-grid">
            <Field label="Clinic name" className="full">
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
            <Field label="Address" className="full">
              <textarea className="sol-textarea" value={form.address} onChange={set('address')} />
            </Field>
            <Field label="Registration / license" className="full">
              <input className="sol-input" value="RC 1842092 · PCN 0481" readOnly />
            </Field>
          </div>
        </Card>

        <div className="sol-aside-stack">
          <Card title="Opening hours & tax" subtitle="Applied to every appointment and invoice">
            <div className="sol-form-grid">
              <Field label="Opens">
                <input className="sol-input" value={form.opening} onChange={set('opening')} placeholder="08:00" />
              </Field>
              <Field label="Closes">
                <input className="sol-input" value={form.closing} onChange={set('closing')} placeholder="18:00" />
              </Field>
              <Field label="VAT / tax rate" className="full" hint="Percent applied to invoices.">
                <input className="sol-input" value={form.tax} onChange={set('tax')} inputMode="decimal" />
              </Field>
              <Field label="Inpatient beds" className="full">
                <input className="sol-input" value={form.beds} onChange={set('beds')} inputMode="numeric" />
              </Field>
            </div>
          </Card>

          <Card title="Automation" subtitle="Defaults for the front desk">
            <div className="sol-settings-row">
              <div className="sol-settings-row-text">
                <strong>Auto-confirm online bookings</strong>
                <small>Bookings from the patient portal are confirmed instantly.</small>
              </div>
              <Switch
                checked={settings.autoConfirm}
                onChange={(v) => setSettings((s) => ({ ...s, autoConfirm: v }))}
                label="Auto confirm bookings"
              />
            </div>
            <div className="sol-settings-row">
              <div className="sol-settings-row-text">
                <strong>Appointment reminders</strong>
                <small>Send SMS and email reminders 24 hours before a visit.</small>
              </div>
              <Switch
                checked={settings.reminders}
                onChange={(v) => setSettings((s) => ({ ...s, reminders: v }))}
                label="Appointment reminders"
              />
            </div>
            <div className="sol-settings-row">
              <div className="sol-settings-row-text">
                <strong>Offer teleconsults</strong>
                <small>Let clinicians see patients over video.</small>
              </div>
              <Switch
                checked={settings.teleconsult}
                onChange={(v) => setSettings((s) => ({ ...s, teleconsult: v }))}
                label="Teleconsults"
              />
            </div>
            <div className="sol-settings-row">
              <div className="sol-settings-row-text">
                <strong>Accept walk-ins</strong>
                <small>Allow front desk to add same-day patients.</small>
              </div>
              <Switch
                checked={settings.walkIns}
                onChange={(v) => setSettings((s) => ({ ...s, walkIns: v }))}
                label="Walk-ins"
              />
            </div>
          </Card>
        </div>
      </div>

      <Card title="Services & fees" subtitle="Standard prices used when raising invoices" flush>
        <TableWrap>
          <table className="sol-table">
            <thead>
              <tr>
                <Th>Service</Th>
                <Th>Department</Th>
                <Th align="right">Duration</Th>
                <Th align="right">Fee</Th>
                <Th align="right" width={90} />
              </tr>
            </thead>
            <tbody>
              {SERVICES.map((s) => (
                <tr key={s.name}>
                  <Td>
                    <span className="strong">{s.name}</span>
                  </Td>
                  <Td className="muted">{s.department}</Td>
                  <Td align="right" className="num">
                    {s.duration}m
                  </Td>
                  <Td align="right" className="num">
                    {money(s.price)}
                  </Td>
                  <Td align="right">
                    <button
                      type="button"
                      className="sol-btn sol-btn-ghost sol-btn-sm"
                      onClick={() => toast(`${s.name} fee editor opened.`)}
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

      <Card title="HMO & insurance partners" subtitle="Payers linked to the clinic" flush>
        <TableWrap>
          <table className="sol-table">
            <thead>
              <tr>
                <Th>Payer</Th>
                <Th>Plan</Th>
                <Th align="right">Patients</Th>
                <Th>Status</Th>
                <Th align="right" width={90} />
              </tr>
            </thead>
            <tbody>
              {PAYERS.map((p) => (
                <tr key={p.name}>
                  <Td>
                    <span className="strong">{p.name}</span>
                  </Td>
                  <Td className="muted">{p.plan}</Td>
                  <Td align="right" className="num">
                    {p.patients}
                  </Td>
                  <Td>
                    <StatusBadge status={p.status} />
                  </Td>
                  <Td align="right">
                    <button
                      type="button"
                      className="sol-btn sol-btn-ghost sol-btn-sm"
                      onClick={() => toast(`${p.name} agreement opened.`)}
                    >
                      Manage
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
            Close clinic
          </button>
        }
      >
        Closing the clinic hides it from patients and stops new appointments. Existing records are kept.
      </Banner>
    </>
  );
}

/* ── Account ──────────────────────────────────────────────────────── */

export function HealthcareAccount() {
  const { toast } = useToast();
  const { mutate } = useSolutionsLive();
  const [name, setName] = useState(clinic.ownerName);
  const [email, setEmail] = useState(clinic.ownerEmail);
  const [twoFactor, setTwoFactor] = useState(true);
  const [emails, setEmails] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteSaving, setInviteSaving] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'Staff nurse' });

  const inviteStaff = async () => {
    const staffName = inviteForm.name.trim();
    const staffEmail = inviteForm.email.trim().toLowerCase();
    if (!staffName || !staffEmail || !staffEmail.includes('@')) {
      toast('Add a name and valid email to send the invite.');
      return;
    }
    setInviteSaving(true);
    const res = await mutate({
      action: 'staff_create',
      fullName: staffName,
      email: staffEmail,
      role: inviteForm.role.trim() || 'Staff nurse',
      department: 'Nursing',
      status: 'off_duty',
    });
    setInviteSaving(false);
    if (!res.ok) {
      toast(res.error || 'Could not add the staff member.');
      return;
    }
    toastInviteResult(toast, { staffName, email: staffEmail, result: res });
    setInviteForm({ name: '', email: '', role: 'Staff nurse' });
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
        <Card title="Your profile" subtitle="How you appear to the team">
          <div className="sol-row sol-gap-2" style={{ marginBottom: 14 }}>
            <Avatar name={name} size="lg" />
            <div>
              <div className="sol-person-name">{name}</div>
              <div className="sol-person-sub">Owner · {clinic.name}</div>
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
              <input className="sol-input" value="Medical director & owner" readOnly />
            </Field>
          </div>
        </Card>

        <div className="sol-aside-stack">
          <Card title="Security" subtitle="Keep the workspace safe">
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
                <small>Last changed 2 months ago.</small>
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
                <small>2 devices signed in.</small>
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
                <small>Appointments, queue and revenue each morning.</small>
              </div>
              <Switch checked={emails} onChange={setEmails} label="Daily summary email" />
            </div>
            <div className="sol-settings-row">
              <div className="sol-settings-row-text">
                <strong>Clinical alerts</strong>
                <small>Abnormal vitals, critical labs and admissions.</small>
              </div>
              <Switch checked onChange={() => toast('Clinical alerts are on.')} label="Clinical alerts" />
            </div>
            <div className="sol-settings-row">
              <div className="sol-settings-row-text">
                <strong>Billing alerts</strong>
                <small>Overdue invoices and failed payments.</small>
              </div>
              <Switch checked onChange={() => toast('Billing alerts are on.')} label="Billing alerts" />
            </div>
          </Card>
        </div>
      </div>

      <Card
        title="Your team"
        subtitle={`${patients.length} patients · ${clinicians.length} staff with workspace access`}
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
              {clinicians.slice(0, 5).map((c) => (
                <tr key={c.id}>
                  <Td>
                    <div className="sol-person">
                      <Avatar name={c.full_name} />
                      <span className="sol-person-name">{c.full_name}</span>
                    </div>
                  </Td>
                  <Td className="muted">{c.role}</Td>
                  <Td className="muted">{c.email}</Td>
                  <Td>
                    <StatusBadge status={c.status} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Card>

      <div className="sol-mt-3">
        <Badge tone="green" dot>
          Workspace healthy
        </Badge>
      </div>

      <Sheet
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite a staff member"
        subtitle="They will get an email to join the clinic workspace."
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
              placeholder="e.g. Dr. Amina Sule"
            />
          </Field>
          <Field label="Work email" className="full">
            <input
              type="email"
              className="sol-input"
              value={inviteForm.email}
              onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              placeholder="name@clinic.com"
            />
          </Field>
          <Field label="Role" className="full">
            <input
              className="sol-input"
              value={inviteForm.role}
              onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
            />
          </Field>
        </div>
      </Sheet>
    </>
  );
}
