'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Avatar, Banner, Card, Field, PageHeader, Switch, useToast } from '../primitives';
import { Icon } from '../icons';
import { farm, orgSettings, team } from './mock';
import { useSolutionsLive } from '../live';

/* ── Farm settings ─────────────────────────────────────────────────── */

export function AgricultureFarmSettings() {
  const { toast } = useToast();
  const { mutate } = useSolutionsLive();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: String(orgSettings.name ?? farm.name),
    legal: String(orgSettings.legal ?? farm.legalName),
    location: String(orgSettings.location ?? farm.location),
    address: String(orgSettings.address ?? farm.address),
    phone: String(orgSettings.phone ?? farm.phone),
    email: String(orgSettings.email ?? farm.email),
    website: String(orgSettings.website ?? farm.website),
    currency: String(orgSettings.currency ?? farm.currency),
    season: String(orgSettings.season ?? farm.season),
    ownerName: String(orgSettings.ownerName ?? farm.ownerName),
    ownerEmail: String(orgSettings.ownerEmail ?? farm.ownerEmail),
  });
  const [settings, setSettings] = useState({
    lowStockAlerts: orgSettings.lowStockAlerts ?? true,
    harvestReminders: orgSettings.harvestReminders ?? true,
    exportDocumentReminders: orgSettings.exportDocumentReminders ?? true,
    autoPackagingLabels: orgSettings.autoPackagingLabels ?? false,
  });

  const save = async () => {
    setSaving(true);
    const res = await mutate({ action: 'settings_save', settings: { ...form, ...settings } });
    setSaving(false);
    if (!res.ok) {
      toast(res.error || 'Could not save farm settings.');
      return;
    }
    toast('Farm settings saved.');
  };

  const set =
    (key: keyof typeof form) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((previous) => ({ ...previous, [key]: event.target.value }));

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <Icon name="settings" size={13} /> Workspace
          </>
        }
        title="Farm settings"
        subtitle="Farm profile, season details and the alerts that keep the operation running."
        actions={
          <button type="button" className="sol-btn sol-btn-primary" onClick={() => void save()} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        }
      />

      <div className="sol-grid sol-grid-2">
        <Card title="Farm profile" subtitle="Shown on reports, delivery notes and export documents">
          <div className="sol-form-grid">
            <Field label="Farm name" className="full">
              <input className="sol-input" value={form.name} onChange={set('name')} />
            </Field>
            <Field label="Legal name" className="full">
              <input className="sol-input" value={form.legal} onChange={set('legal')} />
            </Field>
            <Field label="Location">
              <input className="sol-input" value={form.location} onChange={set('location')} />
            </Field>
            <Field label="Season">
              <input className="sol-input" value={form.season} onChange={set('season')} />
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
            <Field label="Website">
              <input className="sol-input" value={form.website} onChange={set('website')} />
            </Field>
            <Field label="Currency">
              <input className="sol-input" value={form.currency} onChange={set('currency')} />
            </Field>
            <Field label="Owner name">
              <input className="sol-input" value={form.ownerName} onChange={set('ownerName')} />
            </Field>
            <Field label="Owner email">
              <input className="sol-input" value={form.ownerEmail} onChange={set('ownerEmail')} />
            </Field>
          </div>
        </Card>

        <div className="sol-aside-stack">
          <Card title="Operation at a glance" subtitle="Current network snapshot">
            <div className="sol-stack-2">
              <div className="sol-list-row" style={{ border: 'none', padding: 0 }}>
                <div className="sol-list-main">
                  <div className="sol-list-title" style={{ fontSize: 13 }}>Total farmland</div>
                </div>
                <div className="sol-list-side">
                  <strong className="sol-num">{farm.totalHectares} ha</strong>
                </div>
              </div>
              <div className="sol-list-row" style={{ border: 'none', padding: 0 }}>
                <div className="sol-list-main">
                  <div className="sol-list-title" style={{ fontSize: 13 }}>Main enterprises</div>
                </div>
                <div className="sol-list-side">
                  <small className="sol-muted">{farm.primaryEnterprises}</small>
                </div>
              </div>
              <div className="sol-list-row" style={{ border: 'none', padding: 0 }}>
                <div className="sol-list-main">
                  <div className="sol-list-title" style={{ fontSize: 13 }}>Certification</div>
                </div>
                <div className="sol-list-side">
                  <small className="sol-muted">{farm.certification}</small>
                </div>
              </div>
            </div>
            <div className="sol-divider sol-mt-3" />
            <div className="sol-small sol-muted">
              Based in {farm.location} · {farm.region}. Season runs under the {farm.season} plan.
            </div>
          </Card>

          <Card title="Alerts & automation" subtitle="What the workspace reminds you about">
            <div className="sol-settings-row">
              <div className="sol-settings-row-text">
                <strong>Low stock alerts</strong>
                <small>Flag inputs and inventory at or below reorder level.</small>
              </div>
              <Switch
                checked={settings.lowStockAlerts}
                onChange={(value) => setSettings((previous) => ({ ...previous, lowStockAlerts: value }))}
                label="Low stock alerts"
              />
            </div>
            <div className="sol-settings-row">
              <div className="sol-settings-row-text">
                <strong>Harvest reminders</strong>
                <small>Nudge field teams when a batch is ready for lifting.</small>
              </div>
              <Switch
                checked={settings.harvestReminders}
                onChange={(value) => setSettings((previous) => ({ ...previous, harvestReminders: value }))}
                label="Harvest reminders"
              />
            </div>
            <div className="sol-settings-row">
              <div className="sol-settings-row-text">
                <strong>Export document reminders</strong>
                <small>Chase phytosanitary and NAFDAC papers before ship dates.</small>
              </div>
              <Switch
                checked={settings.exportDocumentReminders}
                onChange={(value) =>
                  setSettings((previous) => ({ ...previous, exportDocumentReminders: value }))
                }
                label="Export document reminders"
              />
            </div>
            <div className="sol-settings-row">
              <div className="sol-settings-row-text">
                <strong>Auto packaging labels</strong>
                <small>Generate bag and pack labels when a batch is graded.</small>
              </div>
              <Switch
                checked={settings.autoPackagingLabels}
                onChange={(value) => setSettings((previous) => ({ ...previous, autoPackagingLabels: value }))}
                label="Auto packaging labels"
              />
            </div>
          </Card>
        </div>
      </div>

      <Banner tone="amber" icon="help" title="Season planning">
        Settings are shared with every member of the workspace. Changes to currency or season labels also update the
        dashboards and reports generated for {farm.season}.
      </Banner>
    </>
  );
}

/* ── Account ───────────────────────────────────────────────────────── */

export function AgricultureAccount({ hrefFor }: { hrefFor?: (sectionId: string) => string }) {
  const { toast } = useToast();
  const { mutate } = useSolutionsLive();
  const href = hrefFor ?? ((section: string) => `#${section}`);
  const [name, setName] = useState(farm.ownerName);
  const [email, setEmail] = useState(farm.ownerEmail);
  const [twoFactor, setTwoFactor] = useState(true);
  const [digest, setDigest] = useState(true);
  const [saving, setSaving] = useState(false);
  const activeStaff = team.filter((member) => member.status === 'active').length;

  const save = async () => {
    setSaving(true);
    const res = await mutate({ action: 'settings_save', ownerName: name.trim(), ownerEmail: email.trim(), dailyDigest: digest, twoFactor });
    setSaving(false);
    if (!res.ok) { toast(res.error || 'Could not save account settings.'); return; }
    toast('Account updated.');
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
          <button type="button" className="sol-btn sol-btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        }
      />

      <div className="sol-grid sol-grid-2">
        <Card title="Your profile" subtitle="How you appear to the farm team">
          <div className="sol-row sol-gap-2" style={{ marginBottom: 14 }}>
            <Avatar name={name} size="lg" />
            <div>
              <div className="sol-person-name">{name}</div>
              <div className="sol-person-sub">Owner · {farm.name}</div>
            </div>
          </div>
          <div className="sol-form-grid">
            <Field label="Full name" className="full">
              <input className="sol-input" value={name} onChange={(event) => setName(event.target.value)} />
            </Field>
            <Field label="Email" className="full">
              <input className="sol-input" value={email} onChange={(event) => setEmail(event.target.value)} />
            </Field>
            <Field label="Role" className="full">
              <input className="sol-input" value="Farm owner & managing director" readOnly />
            </Field>
          </div>
        </Card>

        <div className="sol-aside-stack">
          <Card title="Security" subtitle="Keep the farm workspace safe">
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
                onClick={() => { const { mailto } = require('../action-helpers'); mailto(email, 'Password reset request'); toast('Reset email draft opened.'); }}
              >
                Change
              </button>
            </div>
            <div className="sol-settings-row">
              <div className="sol-settings-row-text">
                <strong>Staff sessions</strong>
                <small>{activeStaff} team members signed in this week.</small>
              </div>
              <span className="sol-muted sol-small">Managed by your auth provider</span>
            </div>
          </Card>

          <Card title="Notifications" subtitle="What lands in your inbox">
            <div className="sol-settings-row">
              <div className="sol-settings-row-text">
                <strong>Daily farm digest</strong>
                <small>Harvest, activities and stock in one email.</small>
              </div>
              <Switch checked={digest} onChange={setDigest} label="Daily farm digest" />
            </div>
            <div className="sol-settings-row">
              <div className="sol-settings-row-text">
                <strong>Harvest alerts</strong>
                <small>Batch readiness and grading updates.</small>
              </div>
              <Switch checked onChange={() => toast('Harvest alerts are on.')} label="Harvest alerts" />
            </div>
          </Card>
        </div>
      </div>

      <Card title="Workspace links" subtitle="Where to go next" className="sol-mt-3">
        <div className="sol-row" style={{ flexWrap: 'wrap', gap: 8 }}>
          <Link href={href('settings')} className="sol-btn sol-btn-subtle">
            <Icon name="settings" size={15} /> Farm settings
          </Link>
          <Link href={href('reports')} className="sol-btn sol-btn-subtle">
            <Icon name="chart" size={15} /> Reports
          </Link>
          <span className="sol-muted sol-small">Use the main account menu to sign out.</span>
        </div>
      </Card>
    </>
  );
}
