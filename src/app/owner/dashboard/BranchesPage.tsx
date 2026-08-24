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
        showToast('No business linked. Please refresh and try again.');
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
      showToast('Failed to load branches');
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
      showToast('Branch name is required');
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
      showToast(`Branch “${name}” created`);
      setShowCreateModal(false);
      setFormName('');
      setFormAddress('');
      setFormPhone('');
      setFormManager('');
      await loadData();
    } catch (e: any) {
      showToast(e?.message || 'Failed to create branch');
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
      showToast('Staff assigned');
      setShowAssignModal(false);
      setAssignStaffId('');
      setAssignBranchId('');
      setSelectedBranch(null);
      await loadData();
    } catch (e: any) {
      showToast(e?.message || 'Failed to assign staff');
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
      showToast('Branch deleted');
      await loadData();
    } catch (e: any) {
      showToast(e?.message || 'Delete failed');
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
      showToast(next === 'active' ? 'Branch activated' : 'Branch deactivated');
      await loadData();
    } catch {
      showToast('Could not update status');
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
          <h2>Branch management is a Pro feature</h2>
          <p>
            Manage multiple locations, assign staff per branch, and track each
            site separately. Upgrade to Pro to unlock branches.
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
            Upgrade to Pro
          </button>
          <button
            type="button"
            className={styles.btnGhost}
            onClick={() => navigateTo('home' as any)}
          >
            Back to home
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
          Loading branches…
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
            Branches
          </h1>
          <p className={styles.heroSub}>
            Run multiple locations under one business — assign staff and keep
            each branch organized.
          </p>
        </div>
        <div className={styles.heroActions}>
          <button
            type="button"
            className={styles.btnGhost}
            onClick={() => loadData()}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => openAssign(null)}
          >
            <UserPlus size={16} />
            Assign staff
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={16} />
            New branch
          </button>
        </div>
      </header>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Branches</div>
          <div className={styles.statValue}>{branches.length}</div>
          <div className={styles.statHint}>{activeCount} active</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total staff</div>
          <div className={styles.statValue}>{staffMembers.length}</div>
          <div className={styles.statHint}>{mainStaffCount} at main</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Unassigned</div>
          <div
            className={`${styles.statValue} ${
              unassignedStaff.length ? styles.statValueWarn : ''
            }`}
          >
            {unassignedStaff.length}
          </div>
          <div className={styles.statHint}>Need a branch</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Locations</div>
          <div className={styles.statValue}>{branches.length + 1}</div>
          <div className={styles.statHint}>Including main</div>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Search size={16} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search branches…"
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
              <h3 className={styles.cardName}>Main branch</h3>
              <p className={styles.cardSub}>Headquarters · always active</p>
            </div>
            <span className={`${styles.pill} ${styles.pillOk}`}>Active</span>
          </div>
          <div className={styles.cardMeta}>
            <div className={styles.metaItem}>
              <Users size={14} />
              <span>{mainStaffCount} staff</span>
            </div>
          </div>
          <div className={styles.cardActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => openAssign(null)}
            >
              <UserPlus size={14} />
              Assign staff
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
                  {branch.address || 'No address set'}
                </p>
              </div>
              <button
                type="button"
                className={`${styles.pill} ${
                  branch.status === 'active' ? styles.pillOk : styles.pillMuted
                }`}
                onClick={() => toggleStatus(branch)}
                title="Toggle status"
              >
                {branch.status}
              </button>
            </div>
            <div className={styles.cardMeta}>
              <div className={styles.metaItem}>
                <Users size={14} />
                <span>{branch.staffCount} staff</span>
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
                Assign
              </button>
              <button
                type="button"
                className={styles.btnDanger}
                disabled={deletingId === branch.id}
                onClick={() => handleDeleteBranch(branch)}
              >
                <Trash2 size={14} />
                {deletingId === branch.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {branches.length === 0 && (
        <div className={styles.empty}>
          <Building2 size={40} />
          <h3>No branches yet</h3>
          <p>Create your first branch to manage multiple locations.</p>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={16} />
            Create branch
          </button>
        </div>
      )}

      {branches.length > 0 && filteredBranches.length === 0 && (
        <div className={styles.empty}>
          <Search size={32} />
          <h3>No matches</h3>
          <p>Try a different search term.</p>
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
              <h2>New branch</h2>
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
                <label htmlFor="br-name">Name *</label>
                <input
                  id="br-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Ikeja store"
                  autoFocus
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="br-addr">Address</label>
                <input
                  id="br-addr"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Street, city"
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="br-phone">Phone</label>
                <input
                  id="br-phone"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="Contact number"
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="br-mgr">Manager name</label>
                <input
                  id="br-mgr"
                  value={formManager}
                  onChange={(e) => setFormManager(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnGhost}
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                disabled={!formName.trim() || isCreating}
                onClick={handleCreateBranch}
              >
                {isCreating ? 'Creating…' : 'Create branch'}
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
              <h2>Assign staff</h2>
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
                  <p>All staff are already assigned to a branch.</p>
                </div>
              ) : (
                <>
                  <div className={styles.field}>
                    <label>Staff member</label>
                    <select
                      value={assignStaffId}
                      onChange={(e) => setAssignStaffId(e.target.value)}
                    >
                      <option value="">Select staff…</option>
                      {unassignedStaff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.fullName} ({s.role})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label>Branch</label>
                    <select
                      value={assignBranchId}
                      onChange={(e) => setAssignBranchId(e.target.value)}
                    >
                      <option value="">Main branch</option>
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
                Cancel
              </button>
              {unassignedStaff.length > 0 && (
                <button
                  type="button"
                  className={styles.btnPrimary}
                  disabled={!assignStaffId || isAssigning}
                  onClick={handleAssignStaff}
                >
                  {isAssigning ? 'Saving…' : 'Assign'}
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
