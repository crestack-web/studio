'use client';

import React, { useState } from 'react';
import { Avatar, Badge, Banner, Card, Field, PageHeader, Switch, TableWrap, Td, Th, useToast } from '../primitives';
import { Icon } from '../icons';
import { classes, school, teachers } from './mock';

/* ── School settings ───────────────────────────────────────────────── */

export function EducationSchoolSettings() {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: school.name,
    legal: school.legalName,
    principal: school.principal,
    location: school.location,
    address: school.address,
    phone: school.phone,
    email: school.email,
    website: school.website,
    motto: school.motto,
    session: school.session,
  });
  const [settings, setSettings] = useState({
    smsGuardians: true,
    lateFeePolicy: true,
    autoReceipts: true,
    termReminders: true,
  });

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const feeRows = Object.entries(
    classes.reduce<Record<string, { count: number; amount: number }>>((acc, c) => {
      const level = c.level;
      if (!acc[level]) acc[level] = { count: 0, amount: 0 };
      acc[level].count += 1;
      acc[level].amount += c.fee_amount;
      return acc;
    }, {}),
  );

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <Icon name="settings" size={13} /> Workspace
          </>
        }
        title="School settings"
        subtitle="Institution profile, fee schedule and the automations that keep operations smooth."
        actions={
          <button type="button" className="sol-btn sol-btn-primary" onClick={() => toast('School settings saved.')}>
            Save changes
          </button>
        }
      />

      <div className="sol-grid sol-grid-2">
        <Card title="Institution profile" subtitle="Shown on reports, communications and the parent portal">
          <div className="sol-form-grid">
            <Field label="School name" className="full">
              <input className="sol-input" value={form.name} onChange={set('name')} />
            </Field>
            <Field label="Legal name" className="full">
              <input className="sol-input" value={form.legal} onChange={set('legal')} />
            </Field>
            <Field label="Principal / owner">
              <input className="sol-input" value={form.principal} onChange={set('principal')} />
            </Field>
            <Field label="Session">
              <input className="sol-input" value={form.session} onChange={set('session')} />
            </Field>
            <Field label="Location" className="full">
              <input className="sol-input" value={form.location} onChange={set('location')} />
            </Field>
            <Field label="Address" className="full">
              <textarea className="sol-textarea" rows={2} value={form.address} onChange={set('address')} />
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
            <Field label="Motto" className="full">
              <input className="sol-input" value={form.motto} onChange={set('motto')} />
            </Field>
          </div>
        </Card>

        <div className="sol-aside-stack">
          <Card title="Fee schedule" subtitle="Per-level annual tuition">
            <div className="sol-stack-2">
              {feeRows.map(([level, row]) => (
                <div key={level} className="sol-list-row" style={{ border: 'none', padding: 0 }}>
                  <div className="sol-list-main">
                    <div className="sol-list-title" style={{ fontSize: 13 }}>{level}</div>
                  </div>
                  <div className="sol-list-side">
                    <small className="sol-muted">{row.count} classes</small>
                    <strong className="sol-num">₦{(row.amount / 1_000_000).toFixed(1)}M/yr</strong>
                  </div>
                </div>
              ))}
            </div>
            <div className="sol-divider sol-mt-3" />
            <div className="sol-small sol-muted">
              Fee policy: termly billing with instalment plans. Outstanding balances escalate after 14 days.
            </div>
          </Card>

          <Card title="Automation" subtitle="Defaults for guardians, receipts and term reminders">
            <div className="sol-settings-row">
              <div className="sol-settings-row-text">
                <strong>SMS guardians</strong>
                <small>Notify guardians of absences and fee reminders.</small>
              </div>
              <Switch
                checked={settings.smsGuardians}
                onChange={(v) => setSettings((s) => ({ ...s, smsGuardians: v }))}
                label="SMS guardians"
              />
            </div>
            <div className="sol-settings-row">
              <div className="sol-settings-row-text">
                <strong>Late fee policy</strong>
                <small>Charge a small late fee after the due date.</small>
              </div>
              <Switch
                checked={settings.lateFeePolicy}
                onChange={(v) => setSettings((s) => ({ ...s, lateFeePolicy: v }))}
                label="Late fee policy"
              />
            </div>
            <div className="sol-settings-row">
              <div className="sol-settings-row-text">
                <strong>Auto receipts</strong>
                <small>Issue receipts automatically after settlement.</small>
              </div>
              <Switch
                checked={settings.autoReceipts}
                onChange={(v) => setSettings((s) => ({ ...s, autoReceipts: v }))}
                label="Auto receipts"
              />
            </div>
            <div className="sol-settings-row">
              <div className="sol-settings-row-text">
                <strong>Term reminders</strong>
                <small>Heads-up before resumption and mid-term break.</small>
              </div>
              <Switch
                checked={settings.termReminders}
                onChange={(v) => setSettings((s) => ({ ...s, termReminders: v }))}
                label="Term reminders"
              />
            </div>
          </Card>
        </div>
      </div>

      <Banner tone="amber" icon="help" title="Term close">
        The current term closes in 34 days. Fee statements are generated automatically and outstanding balances are
        escalated to the bursar on the due date.
      </Banner>
    </>
  );
}

/* ── Account ───────────────────────────────────────────────────────── */

export function EducationAccount() {
  const { toast } = useToast();
  const [name, setName] = useState(school.ownerName);
  const [email, setEmail] = useState(school.ownerEmail);
  const [twoFactor, setTwoFactor] = useState(true);
  const [digest, setDigest] = useState(true);

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
        <Card title="Your profile" subtitle="How you appear to staff and guardians">
          <div className="sol-row sol-gap-2" style={{ marginBottom: 14 }}>
            <Avatar name={name} size="lg" />
            <div>
              <div className="sol-person-name">{name}</div>
              <div className="sol-person-sub">Owner · {school.name}</div>
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
              <input className="sol-input" value="School owner & principal" readOnly />
            </Field>
            <Field label="Signature" className="full" hint="Added to reports and communications.">
              <textarea className="sol-textarea" rows={2} defaultValue={`${school.ownerName} · ${school.name} · ${school.motto}`} />
            </Field>
          </div>
        </Card>

        <div className="sol-aside-stack">
          <Card title="Security" subtitle="Keep the school workspace safe">
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
              <button type="button" className="sol-btn sol-btn-subtle sol-btn-sm" onClick={() => toast('Password reset email sent.')}>
                Change
              </button>
            </div>
            <div className="sol-settings-row">
              <div className="sol-settings-row-text">
                <strong>Staff sessions</strong>
                <small>{teachers.filter((t) => t.status === 'active').length} teachers signed in this week.</small>
              </div>
              <button type="button" className="sol-btn sol-btn-ghost sol-btn-sm" onClick={() => toast('Other sessions signed out.')}>
                Sign out
              </button>
            </div>
          </Card>

          <Card title="Notifications" subtitle="What lands in your inbox">
            <div className="sol-settings-row">
              <div className="sol-settings-row-text">
                <strong>Daily digest</strong>
                <small>Attendance, fees and admissions in one email.</small>
              </div>
              <Switch checked={digest} onChange={setDigest} label="Daily digest" />
            </div>
            <div className="sol-settings-row">
              <div className="sol-settings-row-text">
                <strong>Overdue alerts</strong>
                <small>Fee accounts past due and attendance dips.</small>
              </div>
              <Switch checked onChange={() => toast('Overdue alerts are on.')} label="Overdue alerts" />
            </div>
            <div className="sol-settings-row">
              <div className="sol-settings-row-text">
                <strong>Admissions updates</strong>
                <small>New applications and offers for enrolment.</small>
              </div>
              <Switch checked onChange={() => toast('Admissions alerts are on.')} label="Admissions alerts" />
            </div>
          </Card>
        </div>
      </div>

      <Card
        title="Staff directory"
        subtitle={`${teachers.length} teachers on the roster`}
        className="sol-mt-3"
        action={
          <button type="button" className="sol-btn sol-btn-subtle sol-btn-sm" onClick={() => toast('Invite flow opened.')}>
            <Icon name="plus" size={14} aria-hidden /> Invite
          </button>
        }
        flush
      >
        <TableWrap>
          <table className="sol-table">
            <thead>
              <tr>
                <Th>Teacher</Th>
                <Th>Subject</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {teachers.slice(0, 6).map((t) => (
                <tr key={t.id}>
                  <Td>
                    <div className="sol-person">
                      <Avatar name={t.full_name} />
                      <span className="sol-person-name">{t.full_name}</span>
                    </div>
                  </Td>
                  <Td className="muted">{t.subject}</Td>
                  <Td>
                    <Badge tone={t.status === 'active' ? 'green' : 'amber'}>{t.status.replace(/_/g, ' ')}</Badge>
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
