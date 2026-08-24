'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { Button } from './Button';
import { Pill } from './Badge';
import styles from './StaffPage.module.css';
import { ChatPanel } from './ChatPanel';
import { initializeFirebase } from '@/firebase';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import AttendanceTab from './AttendanceTab';

interface StaffMember {
  id: string;
  staffId: string;
  name: string;
  role: string;
  email?: string;
  password?: string;
  avatarBg: string;
  avatarColor: string;
  initials: string;
  revenue: number;
  transactions: number;
  online: boolean;
  permissions: Record<string, boolean>;
  status?: string;
  salary?: number;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'owner' | 'staff';
  text: string;
  timestamp: number;
}

const AVATAR_PALETTE = [
  { bg: '#D1FAE5', color: '#14A05A' },
  { bg: '#EDE8FC', color: '#7C3AED' },
  { bg: '#EFF6FF', color: '#2563EB' },
  { bg: '#FEF3C7', color: '#D97706' },
  { bg: '#FEE2E2', color: '#DC2626' },
  { bg: '#CCFBF1', color: '#0D9488' },
];

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

function getAvatarColors(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function generateStaffId() {
  return 'STF-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateStaffPassword() {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$';
  let password = '';
  for (let i = 0; i < 12; i++) password += charset.charAt(Math.floor(Math.random() * charset.length));
  return password;
}

export default function StaffPage() {
  const { showToast, user } = useApp();
  const { t } = useTranslation();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'staff' | 'attendance' | 'chat'>('staff');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPermissions, setNewStaffPermissions] = useState<Record<string, boolean>>({
    sale: true,
    inv: false,
    hist: false,
    atd: false,
    msg: false,
  });

  const [conversations, setConversations] = useState<{
    [key: string]: { id: string; messages: ChatMessage[] };
  }>({});
  const [selectedChat, setSelectedChat] = useState('team');

  const loadStaff = useCallback(async () => {
    try {
      const { auth, firestore } = initializeFirebase();
      const currentUserId = auth.currentUser?.uid || user?.id || '';
      if (!currentUserId) {
        setIsLoading(false);
        return;
      }
      const ownerDoc = await getDoc(doc(firestore, 'users', currentUserId));
      const businessId = ownerDoc.data()?.businessId || user?.businessId || '';
      if (!businessId) {
        setIsLoading(false);
        return;
      }
      const staffSnapshot = await getDocs(collection(firestore, 'businesses', businessId, 'staff'));
      const staffList: StaffMember[] = [];
      staffSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.status === 'removed') return;
        const seed = data.staffId || docSnap.id || data.name || '';
        const { bg, color } = getAvatarColors(seed);
        staffList.push({
          id: docSnap.id,
          staffId: data.staffId || '',
          name: data.name || '',
          role: data.role || 'Staff',
          email: data.email || '',
          avatarBg: bg,
          avatarColor: color,
          initials: getInitials(data.name || 'S'),
          revenue: Number(data.revenue) || 0,
          transactions: Number(data.transactions) || 0,
          online: !!data.online,
          permissions: data.permissions || {},
          status: data.status,
          salary: Number(data.salary || data.baseSalary) || 0,
        });
      });
      setStaffMembers(staffList);
      try {
        localStorage.setItem('staff-members', JSON.stringify(staffList));
      } catch {
        /* ignore */
      }
    } catch (error) {
      console.error('Error loading staff:', error);
      try {
        const saved = localStorage.getItem('staff-members');
        if (saved) setStaffMembers(JSON.parse(saved));
      } catch {
        /* ignore */
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.businessId]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setActiveMenu(null);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleAddStaff = async () => {
    if (!newStaffName.trim() || !newStaffRole.trim() || !newStaffEmail.trim()) {
      showToast(t('toast.fillRequiredFields') || 'Fill all required fields');
      return;
    }
    setIsAdding(true);
    const staffId = generateStaffId();
    const password = generateStaffPassword();
    try {
      const { auth, firestore } = initializeFirebase();
      const currentUserId = auth.currentUser?.uid || user?.id || '';
      const ownerDoc = await getDoc(doc(firestore, 'users', currentUserId));
      const businessId = ownerDoc.data()?.businessId || user?.businessId || '';

      const response = await fetch('/api/staff/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newStaffEmail.trim(),
          password,
          name: newStaffName.trim(),
          role: newStaffRole.trim(),
          staffId,
          businessId,
          permissions: newStaffPermissions,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create staff');

      const { bg, color } = getAvatarColors(staffId);
      const member: StaffMember = {
        id: data.uid,
        staffId,
        name: newStaffName.trim(),
        role: newStaffRole.trim(),
        email: newStaffEmail.trim(),
        password,
        avatarBg: bg,
        avatarColor: color,
        initials: getInitials(newStaffName.trim()),
        revenue: 0,
        transactions: 0,
        online: false,
        permissions: newStaffPermissions,
      };
      setStaffMembers((prev) => [...prev, member]);
      setShowAddModal(false);
      setNewStaffName('');
      setNewStaffRole('');
      setNewStaffEmail('');
      showToast(
        t('toast.staffAddedSuccess') ||
          `Staff added. ID: ${staffId} / Password: ${password}`
      );
    } catch (err: any) {
      console.error(err);
      showToast(err?.message || 'Failed to add staff');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveStaff = async (member: StaffMember) => {
    if (!confirm(`Remove ${member.name}? They will lose access.`)) return;
    try {
      const { auth, firestore } = initializeFirebase();
      const currentUserId = auth.currentUser?.uid || user?.id || '';
      const ownerDoc = await getDoc(doc(firestore, 'users', currentUserId));
      const businessId = ownerDoc.data()?.businessId || user?.businessId || '';
      await setDoc(
        doc(firestore, 'businesses', businessId, 'staff', member.id),
        { status: 'removed', removedAt: new Date() },
        { merge: true }
      );
      await setDoc(
        doc(firestore, 'users', member.id),
        { role: 'Removed', businessId: null },
        { merge: true }
      );
      setStaffMembers((prev) => prev.filter((s) => s.id !== member.id));
      showToast(`${member.name} removed`);
    } catch (e) {
      console.error(e);
      showToast('Failed to remove staff');
    }
  };

  const handleBanStaff = async (member: StaffMember) => {
    if (!confirm(`Ban ${member.name}?`)) return;
    try {
      const { auth, firestore } = initializeFirebase();
      const currentUserId = auth.currentUser?.uid || user?.id || '';
      const ownerDoc = await getDoc(doc(firestore, 'users', currentUserId));
      const businessId = ownerDoc.data()?.businessId || user?.businessId || '';
      await setDoc(
        doc(firestore, 'businesses', businessId, 'staff', member.id),
        { status: 'banned', bannedAt: new Date() },
        { merge: true }
      );
      await setDoc(doc(firestore, 'users', member.id), { status: 'banned' }, { merge: true });
      setStaffMembers((prev) =>
        prev.map((s) => (s.id === member.id ? { ...s, status: 'banned' } : s))
      );
      showToast(`${member.name} banned`);
    } catch (e) {
      console.error(e);
      showToast('Failed to ban staff');
    }
  };

  const q = searchQuery.trim().toLowerCase();
  const filteredStaff = useMemo(
    () =>
      q
        ? staffMembers.filter(
            (m) =>
              m.name.toLowerCase().includes(q) ||
              (m.role || '').toLowerCase().includes(q) ||
              (m.staffId || '').toLowerCase().includes(q) ||
              (m.email || '').toLowerCase().includes(q)
          )
        : staffMembers,
    [staffMembers, q]
  );

  const teamStats = useMemo(
    () => ({
      total: staffMembers.length,
      online: staffMembers.filter((m) => m.online).length,
      revenue: staffMembers.reduce((s, m) => s + (Number(m.revenue) || 0), 0),
      transactions: staffMembers.reduce((s, m) => s + (Number(m.transactions) || 0), 0),
    }),
    [staffMembers]
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>{t('staff.title') || 'Staff'}</h2>
          <p className={styles.pageDesc}>
            {t('staff.subtitle') || 'Manage your team, attendance, and chat'}
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
            + {t('staff.addMember') || 'Add member'}
          </Button>
        </div>
      </div>

      <div className={styles.tabNav} role="tablist">
        <button
          type="button"
          role="tab"
          className={`${styles.tabBtn} ${activeTab === 'staff' ? styles.active : ''}`}
          onClick={() => setActiveTab('staff')}
        >
          <span>{t('nav.staff') || 'Staff'}</span>
          {staffMembers.length > 0 && <span className={styles.tabCount}>{staffMembers.length}</span>}
        </button>
        <button
          type="button"
          role="tab"
          className={`${styles.tabBtn} ${activeTab === 'attendance' ? styles.active : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          <span>Attendance</span>
        </button>
        <button
          type="button"
          role="tab"
          className={`${styles.tabBtn} ${activeTab === 'chat' ? styles.active : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <span>{t('nav.chat') || 'Chat'}</span>
        </button>
      </div>

      {activeTab === 'staff' &&
        (isLoading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} aria-hidden />
            <p>Loading team…</p>
          </div>
        ) : staffMembers.length === 0 ? (
          <div className={styles.emptyState}>
            <h3 className={styles.emptyTitle}>No staff members yet</h3>
            <p className={styles.emptyDesc}>
              Add your first team member to track sales, attendance, and performance.
            </p>
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              + Add Your First Staff
            </Button>
          </div>
        ) : (
          <>
            <div className={styles.summaryBar}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryValue}>{teamStats.total}</span>
                <span className={styles.summaryLabel}>Team</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryValue}>
                  <span className={styles.onlineDot} />
                  {teamStats.online}
                </span>
                <span className={styles.summaryLabel}>Online</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryValue}>
                  ₦{teamStats.revenue.toLocaleString()}
                </span>
                <span className={styles.summaryLabel}>Revenue</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryValue}>{teamStats.transactions}</span>
                <span className={styles.summaryLabel}>Sales</span>
              </div>
            </div>

            <div className={styles.toolbar}>
              <div className={styles.searchWrap}>
                <input
                  type="search"
                  className={styles.searchInput}
                  placeholder="Search by name, role, or ID…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search staff"
                />
              </div>
              <span className={styles.resultCount}>
                {filteredStaff.length === staffMembers.length
                  ? `${staffMembers.length} member${staffMembers.length === 1 ? '' : 's'}`
                  : `${filteredStaff.length} of ${staffMembers.length}`}
              </span>
            </div>

            {filteredStaff.length === 0 ? (
              <div className={styles.emptyStateCompact}>
                <p>No staff match “{searchQuery}”.</p>
                <button type="button" className={styles.linkBtn} onClick={() => setSearchQuery('')}>
                  Clear search
                </button>
              </div>
            ) : (
              <div className={styles.staffGrid}>
                {filteredStaff.map((member) => (
                  <div key={member.id} className={styles.staffCard}>
                    <div className={styles.avatarWrap}>
                      <div
                        className={styles.staffAvatar}
                        style={{ background: member.avatarBg, color: member.avatarColor }}
                      >
                        {member.initials}
                      </div>
                      <span
                        className={`${styles.statusDot} ${
                          member.online ? styles.statusOnline : styles.statusOffline
                        }`}
                        title={member.online ? 'Online' : 'Offline'}
                      />
                    </div>
                    <div className={styles.staffName}>{member.name}</div>
                    <div className={styles.staffRole}>
                      <Pill color="purple">{member.role || 'Staff'}</Pill>
                      {member.status === 'banned' && <Pill color="red">Banned</Pill>}
                    </div>
                    <div className={styles.staffId}>ID: {member.staffId || '—'}</div>
                    <div className={styles.staffStats}>
                      <div className={styles.statItem}>
                        <div className={styles.statValue}>
                          ₦{(Number(member.revenue) || 0).toLocaleString()}
                        </div>
                        <div className={styles.statLabel}>Revenue</div>
                      </div>
                      <div className={styles.statDivider} />
                      <div className={styles.statItem}>
                        <div className={styles.statValue}>{Number(member.transactions) || 0}</div>
                        <div className={styles.statLabel}>Sales</div>
                      </div>
                    </div>
                    <div className={styles.staffActions}>
                      <div className={styles.menuContainer} ref={activeMenu === member.id ? menuRef : undefined}>
                        <button
                          type="button"
                          className={styles.menuButton}
                          onClick={() =>
                            setActiveMenu(activeMenu === member.id ? null : member.id)
                          }
                          aria-label="Staff actions"
                        >
                          ⋮
                        </button>
                        {activeMenu === member.id && (
                          <div className={styles.menuDropdown}>
                            <button
                              type="button"
                              className={styles.menuItem}
                              onClick={() => {
                                setSelectedChat(member.id);
                                setActiveTab('chat');
                                setActiveMenu(null);
                              }}
                            >
                              Send Message
                            </button>
                            <div className={styles.menuDivider} />
                            <button
                              type="button"
                              className={styles.menuItem}
                              onClick={() => {
                                handleBanStaff(member);
                                setActiveMenu(null);
                              }}
                            >
                              Ban Staff
                            </button>
                            <button
                              type="button"
                              className={`${styles.menuItem} ${styles.dangerItem}`}
                              onClick={() => {
                                handleRemoveStaff(member);
                                setActiveMenu(null);
                              }}
                            >
                              Remove Staff
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" className={styles.addCard} onClick={() => setShowAddModal(true)}>
                  <div className={styles.addIcon}>+</div>
                  <div className={styles.addLabel}>Add Team Member</div>
                </button>
              </div>
            )}
          </>
        ))}

      {activeTab === 'attendance' && (
        <AttendanceTab staffMembers={staffMembers} showToast={showToast} />
      )}

      {activeTab === 'chat' && (
        <ChatPanel
          staffMembers={staffMembers}
          conversations={conversations}
          setConversations={setConversations}
          initialSelectedChat={selectedChat}
        />
      )}

      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Add Staff Member</h3>
            <label style={{ display: 'block', marginBottom: 12 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)' }}>Full name *</span>
              <input
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                placeholder="Full name"
                style={{
                  width: '100%',
                  marginTop: 6,
                  height: 40,
                  padding: '0 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-1)',
                }}
              />
            </label>
            <label style={{ display: 'block', marginBottom: 12 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)' }}>Role *</span>
              <input
                value={newStaffRole}
                onChange={(e) => setNewStaffRole(e.target.value)}
                placeholder="e.g. Cashier"
                style={{
                  width: '100%',
                  marginTop: 6,
                  height: 40,
                  padding: '0 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-1)',
                }}
              />
            </label>
            <label style={{ display: 'block', marginBottom: 16 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)' }}>Email *</span>
              <input
                type="email"
                value={newStaffEmail}
                onChange={(e) => setNewStaffEmail(e.target.value)}
                placeholder="staff@email.com"
                style={{
                  width: '100%',
                  marginTop: 6,
                  height: 40,
                  padding: '0 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-1)',
                }}
              />
            </label>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>
                Permissions
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { key: 'sale', label: 'Sales' },
                  { key: 'inv', label: 'Inventory' },
                  { key: 'hist', label: 'History' },
                  { key: 'atd', label: 'Attendance' },
                  { key: 'msg', label: 'Messages' },
                ].map((p) => (
                  <label key={p.key} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.85rem' }}>
                    <input
                      type="checkbox"
                      checked={!!newStaffPermissions[p.key]}
                      onChange={(e) =>
                        setNewStaffPermissions((prev) => ({ ...prev, [p.key]: e.target.checked }))
                      }
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="subtle" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleAddStaff} disabled={isAdding}>
                {isAdding ? 'Adding…' : 'Add Staff'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
