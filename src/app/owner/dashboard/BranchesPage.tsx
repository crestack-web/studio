'use client';

/**
 * BranchesPage — multi-location management for Pro plans.
 * Owner dashboard styling; data under businesses/{id}/branches + staff.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import {
  Building2,
  MapPin,
  Phone,
  User,
  Users,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserPlus,
  X,
  Home,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from './AppContext';
import { useBranch } from '@/context/BranchContext';
import { initializeFirebase } from '@/firebase';
import { ensureFirebaseAuth } from '@/lib/ensure-firebase-auth';
import { getAuthCurrentUser } from '@/lib/supabase-auth';
import { useTranslation } from './LangContext';
import styles from './BranchesPage.module.css';

interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  manager: string;
  staffCount: number;
  status: 'active' | 'inactive';
  createdAt?: Date | null;
}

interface StaffMember {
  id: string;
  fullName: string;
  email: string;
  role: string;
  branchId?: string;
}

export function BranchesPage() {
  const { t } = useTranslation();
  const { showToast, user, navigateTo } = useApp();
  const { businessId: branchBusinessId } = useBranch();

  const [businessId, setBusinessId] = useState<string | null>(
    branchBusinessId || user?.businessId || null
  );
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Create form
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formManager, setFormManager] = useState('');

  // Assign form
  const [assignStaffId, setAssignStaffId] = useState('');
  const [assignBranchId, setAssignBranchId] = useState('');

  const isProPlan = (user?.plan || '').toLowerCase() === 'pro';

  const db = () => initializeFirebase().firestore;

  const resolveBusinessId = useCallback(async (): Promise<string | null> => {
    if (branchBusinessId) return branchBusinessId;
    if (user?.businessId) return user.businessId;
    try {
      await ensureFirebaseAuth();
      const uid = user?.id || getAuthCurrentUser()?.uid;
      if (!uid) return null;
      const firestore = db();
      if (!firestore) return null;
      const snap = await getDoc(doc(firestore, 'users', uid));
      return snap.exists() ? snap.data()?.businessId || null : null;
    } catch {
      return null;
    }
  }, [branchBusinessId, user?.businessId, user?.id]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await ensureFirebaseAuth();
      const bid = await resolveBusinessId();
      if (!bid) {
        showToast(t('common.noBusinessLinked'));
        return;
      }
      setBusinessId(bid);
      const firestore = db();
      if (!firestore) return;

      const [branchesSnap, staffSnap] = await Promise.all([
        getDocs(collection(firestore, 'businesses', bid, 'branches')),
        getDocs(collection(firestore, 'businesses', bid, 'staff')),
      ]);

      const staffList: StaffMember[] = [];
      staffSnap.forEach((d) => {
        const data = d.data();
        staffList.push({
          id: d.id,
          fullName: data.fullName || data.name || data.displayName || 'Unknown',
          email: data.email || '',
          role: data.role || 'Staff',
          branchId: data.branchId || undefined,
        });
      });
      setStaffMembers(staffList);

      const staffByBranch = new Map<string, number>();
      staffList.forEach((s) => {
        if (s.branchId) {
          staffByBranch.set(s.branchId, (staffByBranch.get(s.branchId) || 0) + 1);
        }
      });

      const branchList: Branch[] = [];
      branchesSnap.forEach((d) => {
        const data = d.data();
        branchList.push({
          id: d.id,
          name: data.name || 'Unnamed Branch',
          address: data.address || '',
          phone: data.phone || '',
          manager: data.manager || '',
          staffCount: staffByBranch.get(d.id) || 0,
          status: data.status === 'inactive' ? 'inactive' : 'active',
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : data.createdAt
              ? new Date(data.createdAt)
              : null,
        });
      });
      branchList.sort((a, b) => a.name.localeCompare(b.name));
      setBranches(branchList);
    } catch (e) {
      console.error('[Branches] load failed', e);
      showToast(t('branch.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [resolveBusinessId, showToast]);

  useEffect(() => {
    if (!isProPlan) {
      setLoading(false);
      return;
    }
    loadData();
  }, [isProPlan, branchBusinessId, user?.businessId]);

  const mainStaffCount = useMemo(
    () => staffMembers.filter((s) => !s.branchId).length,
    [staffMembers]
  );

  const activeCount = useMemo(
    () => branches.filter((b) => b.status === 'active').length,
    [branches]
  );

  const filteredBranches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return branches;
    return branches.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.address || '').toLowerCase().includes(q) ||
        (b.manager || '').toLowerCase().includes(q) ||
        (b.phone || '').toLowerCase().includes(q)
    );
  }, [branches, searchQuery]);

  const unassignedStaff = useMemo(
    () => staffMembers.filter((s) => !s.branchId),
    [staffMembers]
  );

  const handleCreateBranch = async () => {
    const name = formName.trim();
    if (!name || !businessId) {
      showToast(t('branch.nameRequired'));
      return;
    }
    setIsCreating(true);
    try {
      const firestore = db();
      if (!firestore) throw new Error('Unavailable');
      await ensureFirebaseAuth();
      await addDoc(collection(firestore, 'businesses', businessId, 'branches'), {
        name,
        address: formAddress.trim(),
        phone: formPhone.trim(),
        manager: formManager.trim(),
        status: 'active',
        ownerId: user?.id || getAuthCurrentUser()?.uid || null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      showToast(t('branch.created'));
      setShowCreateModal(false);
      setFormName('');
      setFormAddress('');
      setFormPhone('');
      setFormManager('');
      await loadData();
    } catch (e: any) {
      showToast(e?.message || t('branch.createFailed'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleAssignStaff = async () => {
    if (!businessId || !assignStaffId) return;
    // empty assignBranchId = Main (clear branchId)
    setIsAssigning(true);
    try {
      const firestore = db();
      if (!firestore) throw new Error('Unavailable');
      await ensureFirebaseAuth();
      const payload: Record<string, unknown> = {
        updatedAt: Timestamp.now(),
      };
      if (assignBranchId) {
        payload.branchId = assignBranchId;
      } else {
        payload.branchId = null;
      }
      await updateDoc(
        doc(firestore, 'businesses', businessId, 'staff', assignStaffId),
        payload
      );
      showToast(t('branch.staffAssigned'));
      setShowAssignModal(false);
      setAssignStaffId('');
      setAssignBranchId('');
      setSelectedBranch(null);
      await loadData();
    } catch (e: any) {
      showToast(e?.message || t('branch.assignFailed'));
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDeleteBranch = async (branch: Branch) => {
    if (!businessId) return;
    if (
      !confirm(
        `Delete branch “${branch.name}”? Staff assigned here will become unassigned.`
      )
    ) {
      return;
    }
    setDeletingId(branch.id);
    try {
      const firestore = db();
      if (!firestore) return;
      await ensureFirebaseAuth();
      // Clear staff branchId pointing here
      const assigned = staffMembers.filter((s) => s.branchId === branch.id);
      await Promise.all(
        assigned.map((s) =>
          updateDoc(doc(firestore, 'businesses', businessId, 'staff', s.id), {
            branchId: null,
            updatedAt: Timestamp.now(),
          })
        )
      );
      await deleteDoc(
        doc(firestore, 'businesses', businessId, 'branches', branch.id)
      );
      showToast(t('branch.deleted'));
      await loadData();
    } catch (e: any) {
      showToast(e?.message || t('branch.deleteFailed'));
    } finally {
      setDeletingId(null);
    }
  };

  const toggleStatus = async (branch: Branch) => {
    if (!businessId) return;
    try {
      const firestore = db();
      if (!firestore) return;
      const next = branch.status === 'active' ? 'inactive' : 'active';
      await updateDoc(
        doc(firestore, 'businesses', businessId, 'branches', branch.id),
        { status: next, updatedAt: Timestamp.now() }
      );
      showToast(next === 'active' ? t('branch.activated') : t('branch.deactivated'));
      await loadData();
    } catch {
      showToast(t('branch.statusFailed'));
    }
  };

  const openAssign = (branch: Branch | null) => {
    setSelectedBranch(branch);
    setAssignBranchId(branch?.id || '');
    setAssignStaffId('');
    setShowAssignModal(true);
  };

  if (!isProPlan) {
    return (
      <div className={styles.page}>
        <div className={styles.upgradeCard}>
          <Building2 size={40} className={styles.upgradeIcon} />
          <h2>{t('branch.proTitle')}</h2>
          <p>
            {t('branch.proDesc')}
          </p>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/pricing';
              }
            }}
          >
            {t('branch.upgrade')}
          </button>
          <button
            type="button"
            className={styles.btnGhost}
            onClick={() => navigateTo('home' as any)}
          >
            {t('branch.backHome')}
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          {t('branch.loading')}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <h1 className={styles.heroTitle}>
            <Building2 size={22} />
            {t('branch.title')}
          </h1>
          <p className={styles.heroSub}>
            {t('branch.subtitle')}
          </p>
        </div>
        <div className={styles.heroActions}>
          <button
            type="button"
            className={styles.btnGhost}
            onClick={() => loadData()}
          >
            <RefreshCw size={16} />
            {t('branch.refresh')}
          </button>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => openAssign(null)}
          >
            <UserPlus size={16} />
            {t('branch.assignStaff')}
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={16} />
            {t('branch.newBranch')}
          </button>
        </div>
      </header>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>{t('branch.title')}</div>
          <div className={styles.statValue}>{branches.length}</div>
          <div className={styles.statHint}>{activeCount} {t('branch.activeCount')}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>{t('branch.statStaff')}</div>
          <div className={styles.statValue}>{staffMembers.length}</div>
          <div className={styles.statHint}>{mainStaffCount} {t('branch.atMain')}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>{t('branch.statUnassigned')}</div>
          <div
            className={`${styles.statValue} ${
              unassignedStaff.length ? styles.statValueWarn : ''
            }`}
          >
            {unassignedStaff.length}
          </div>
          <div className={styles.statHint}>{t('branch.needBranch')}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>{t('branch.statLocations')}</div>
          <div className={styles.statValue}>{branches.length + 1}</div>
          <div className={styles.statHint}>{t('branch.includingMain')}</div>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Search size={16} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('branch.search')}
          />
        </div>
      </div>

      <div className={styles.grid}>
        {/* Main branch */}
        <div className={`${styles.card} ${styles.cardMain}`}>
          <div className={styles.cardTop}>
            <div className={styles.cardIcon}>
              <Home size={20} />
            </div>
            <div className={styles.cardTitles}>
              <h3 className={styles.cardName}>{t('branch.mainBranch')}</h3>
              <p className={styles.cardSub}>{t('branch.mainSub')}</p>
            </div>
            <span className={`${styles.pill} ${styles.pillOk}`}>{t('common.active')}</span>
          </div>
          <div className={styles.cardMeta}>
            <div className={styles.metaItem}>
              <Users size={14} />
              <span>{mainStaffCount} {t('branch.staffCount')}</span>
            </div>
          </div>
          <div className={styles.cardActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => openAssign(null)}
            >
              <UserPlus size={14} />
              {t('branch.assignStaff')}
            </button>
          </div>
        </div>

        {filteredBranches.map((branch) => (
          <div key={branch.id} className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.cardIcon}>
                <Building2 size={20} />
              </div>
              <div className={styles.cardTitles}>
                <h3 className={styles.cardName}>{branch.name}</h3>
                <p className={styles.cardSub}>
                  {branch.address || t('branch.noAddress')}
                </p>
              </div>
              <button
                type="button"
                className={`${styles.pill} ${
                  branch.status === 'active' ? styles.pillOk : styles.pillMuted
                }`}
                onClick={() => toggleStatus(branch)}
                title={t('branch.toggleStatus')}
              >
                {branch.status}
              </button>
            </div>
            <div className={styles.cardMeta}>
              <div className={styles.metaItem}>
                <Users size={14} />
                <span>{branch.staffCount} {t('branch.staffCount')}</span>
              </div>
              {branch.manager ? (
                <div className={styles.metaItem}>
                  <User size={14} />
                  <span>{branch.manager}</span>
                </div>
              ) : null}
              {branch.phone ? (
                <div className={styles.metaItem}>
                  <Phone size={14} />
                  <span>{branch.phone}</span>
                </div>
              ) : null}
              {branch.address ? (
                <div className={styles.metaItem}>
                  <MapPin size={14} />
                  <span>{branch.address}</span>
                </div>
              ) : null}
            </div>
            <div className={styles.cardActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => openAssign(branch)}
              >
                <UserPlus size={14} />
                {t('branch.assign')}
              </button>
              <button
                type="button"
                className={styles.btnDanger}
                disabled={deletingId === branch.id}
                onClick={() => handleDeleteBranch(branch)}
              >
                <Trash2 size={14} />
                {deletingId === branch.id ? t('branch.deleting') : t('branch.delete')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {branches.length === 0 && (
        <div className={styles.empty}>
          <Building2 size={40} />
          <h3>{t('branch.noBranches')}</h3>
          <p>{t('branch.noBranchesHint')}</p>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={16} />
            {t('branch.createBranch')}
          </button>
        </div>
      )}

      {branches.length > 0 && filteredBranches.length === 0 && (
        <div className={styles.empty}>
          <Search size={32} />
          <h3>{t('branch.noMatches')}</h3>
          <p>{t('branch.noMatchesHint')}</p>
        </div>
      )}

      {/* Create modal */}
      {showCreateModal && (
        <div
          className={styles.overlay}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal
          >
            <div className={styles.modalHead}>
              <h2>{t('branch.newBranch')}</h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setShowCreateModal(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.field}>
                <label htmlFor="br-name">{t('branch.nameLabel')}</label>
                <input
                  id="br-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={t('branch.namePh')}
                  autoFocus
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="br-addr">{t('branch.addressLabel')}</label>
                <input
                  id="br-addr"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder={t('branch.addressPh')}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="br-phone">{t('branch.phoneLabel')}</label>
                <input
                  id="br-phone"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder={t('branch.phonePh')}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="br-mgr">{t('branch.managerLabel')}</label>
                <input
                  id="br-mgr"
                  value={formManager}
                  onChange={(e) => setFormManager(e.target.value)}
                  placeholder={t('branch.managerPh')}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnGhost}
                onClick={() => setShowCreateModal(false)}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                disabled={!formName.trim() || isCreating}
                onClick={handleCreateBranch}
              >
                {isCreating ? t('branch.creating') : t('branch.createBranch')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign modal */}
      {showAssignModal && (
        <div
          className={styles.overlay}
          onClick={() => setShowAssignModal(false)}
        >
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal
          >
            <div className={styles.modalHead}>
              <h2>{t('branch.assignStaff')}</h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setShowAssignModal(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              {unassignedStaff.length === 0 ? (
                <div className={styles.emptyInline}>
                  <CheckCircle2 size={28} />
                  <p>{t('branch.allAssigned')}</p>
                </div>
              ) : (
                <>
                  <div className={styles.field}>
                    <label>{t('branch.staffMember')}</label>
                    <select
                      value={assignStaffId}
                      onChange={(e) => setAssignStaffId(e.target.value)}
                    >
                      <option value="">{t('branch.selectStaff')}</option>
                      {unassignedStaff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.fullName} ({s.role})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label>{t('branch.branchLabel')}</label>
                    <select
                      value={assignBranchId}
                      onChange={(e) => setAssignBranchId(e.target.value)}
                    >
                      <option value="">{t('branch.mainBranch')}</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnGhost}
                onClick={() => setShowAssignModal(false)}
              >
                {t('common.cancel')}
              </button>
              {unassignedStaff.length > 0 && (
                <button
                  type="button"
                  className={styles.btnPrimary}
                  disabled={!assignStaffId || isAssigning}
                  onClick={handleAssignStaff}
                >
                  {isAssigning ? t('warehouse.saving') : t('branch.assign')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BranchesPage;
