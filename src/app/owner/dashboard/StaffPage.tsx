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
        {STAFF_MEMBERS.length === 0 ? (
          <div className={styles.emptyState}>
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
              <circle cx="60" cy="60" r="58" />
              <circle cx="60" cy="60" r="56" fill="none" stroke="rgba(42,191,191,.12)" strokeWidth="1.5" strokeDasharray="6,4" />
              <rect x="24" y="68" width="24" height="4" rx="2" fill="rgba(255,255,255,.08)" />
              <rect x="28" y="72" width="4" height="12" rx="2" fill="rgba(255,255,255,.07)" />
              <rect x="40" y="72" width="4" height="12" rx="2" fill="rgba(255,255,255,.07)" />
              <rect x="24" y="58" width="24" height="10" rx="4" fill="none" stroke="rgba(42,191,191,.15)" strokeWidth="1.5" strokeDasharray="3,3" />
              <rect x="72" y="68" width="24" height="4" rx="2" fill="rgba(255,255,255,.08)" />
              <rect x="76" y="72" width="4" height="12" rx="2" fill="rgba(255,255,255,.07)" />
              <rect x="88" y="72" width="4" height="12" rx="2" fill="rgba(255,255,255,.07)" />
              <rect x="72" y="58" width="24" height="10" rx="4" fill="none" stroke="rgba(42,191,191,.15)" strokeWidth="1.5" strokeDasharray="3,3" />
              <circle cx="36" cy="52" r="8" fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.06)" strokeWidth="1.5" strokeDasharray="2,2" />
              <circle cx="84" cy="52" r="8" fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.06)" strokeWidth="1.5" strokeDasharray="2,2" />
              <circle cx="60" cy="44" r="13" fill="#F5C9A0" />
              <path d="M47 40 C47 31 73 31 73 40 L73 36 C73 28 47 28 47 36 Z" fill="#2C1A0E" />
              <circle cx="54" cy="43" r="2.8" fill="#1A2B3C" />
              <circle cx="66" cy="43" r="2.8" fill="#1A2B3C" />
              <circle cx="55" cy="41.8" r="1" fill="white" />
              <circle cx="67" cy="41.8" r="1" fill="white" />
              <path d="M54 49 Q60 53 66 49" stroke="#CC7A3A" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              <circle cx="74" cy="32" r="10" fill="#162334" stroke="#2ABFBF" strokeWidth="1.5" />
              <line x1="74" y1="27" x2="74" y2="37" stroke="#2ABFBF" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="69" y1="32" x2="79" y2="32" stroke="#2ABFBF" strokeWidth="2.5" strokeLinecap="round" />
              <rect x="50" y="57" width="20" height="13" rx="5" fill="#F5C9A0" />
              <ellipse cx="60" cy="74" rx="15" ry="6" fill="#1A8F8F" opacity=".8" />
            </svg>
            <div className={styles.emptyText}>No staff members yet</div>
          </div>
        ) : (
          <>
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
          </>
        )}
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
