import React from 'react';
import { useApp } from './AppContext';
import { Card, CardHeader, CardIcon } from './Card';
import { Button } from './Button';
import { Pill } from './Badge';
import { STAFF_MEMBERS } from './mockData';
import styles from './StaffPage.module.css';

// ═══════════════════════════════════════════
//  StaffPage
// ═══════════════════════════════════════════

export function StaffPage() {
  const { navigateTo, showToast } = useApp();

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Staff</h2>
          <p className={styles.pageDesc}>Manage your team and track their performance.</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="subtle" onClick={() => navigateTo('home')}>← Back</Button>
          <Button variant="primary" size="sm" onClick={() => showToast('Add staff flow…')}>+ Add Staff</Button>
        </div>
      </div>

      {/* Staff cards */}
      <div className={styles.staffGrid}>
        {STAFF_MEMBERS.map(member => (
          <div key={member.id} className={styles.staffCard}>
            <div
              className={styles.staffAvatar}
              style={{ background: member.avatarBg, color: member.avatarColor }}
            >
              {member.initials}
            </div>
            <div className={styles.staffName}>{member.name}</div>
            <div className={styles.staffRole}>
              <Pill color="purple">{member.role}</Pill>
            </div>
            <div className={styles.staffStats}>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{member.revenue}</div>
                <div className={styles.statLabel}>Revenue</div>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <div className={styles.statValue}>{member.transactions}</div>
                <div className={styles.statLabel}>Transactions</div>
              </div>
            </div>
            <div className={styles.staffActions}>
              <Button variant="subtle" size="xs" onClick={() => showToast(`Edit ${member.name}…`)}>Edit</Button>
              <Button variant="danger" size="xs" onClick={() => showToast(`Remove ${member.name}?`)}>Remove</Button>
            </div>
          </div>
        ))}

        {/* Add new card */}
        <button
          className={styles.addCard}
          onClick={() => showToast('Add staff flow…')}
        >
          <div className={styles.addIcon}>+</div>
          <div className={styles.addLabel}>Add Team Member</div>
        </button>
      </div>

      {/* Performance table */}
      <Card style={{ marginTop: 16 }}>
        <CardHeader>
          <CardIcon bg="var(--blue-bg)">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth={2}>
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          </CardIcon>
          Performance Overview
          <span className={styles.period}>This Month</span>
        </CardHeader>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Role</th>
                <th>Revenue</th>
                <th>Transactions</th>
                <th>Avg. Sale</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {STAFF_MEMBERS.map(m => {
                const avgSale = parseInt(m.revenue.replace(/[₦,]/g, '')) / m.transactions;
                return (
                  <tr key={m.id}>
                    <td>
                      <div className={styles.tableUser}>
                        <div
                          className={styles.tableAvatar}
                          style={{ background: m.avatarBg, color: m.avatarColor }}
                        >
                          {m.initials}
                        </div>
                        <strong>{m.name}</strong>
                      </div>
                    </td>
                    <td>{m.role}</td>
                    <td><strong>{m.revenue}</strong></td>
                    <td>{m.transactions}</td>
                    <td>₦{Math.round(avgSale).toLocaleString()}</td>
                    <td><Pill color="green">Active</Pill></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
