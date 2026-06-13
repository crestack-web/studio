'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { Button } from './Button';
import { initializeFirebase } from '@/firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, addDoc, updateDoc, deleteDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { MOLoadingSpinner } from '@/components/MOLoadingSpinner';
import styles from './BranchesPage.module.css';

interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  manager: string;
  staffCount: number;
  status: 'active' | 'inactive';
  createdAt: Timestamp;
}

interface StaffMember {
  id: string;
  fullName: string;
  email: string;
  role: 'Manager' | 'Staff';
  branchId?: string;
}

export function BranchesPage() {
  const { navigateTo, showToast, user } = useApp();
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isProPlan, setIsProPlan] = useState(false);

  // Check if user is on Pro plan
  useEffect(() => {
    if (user.plan === 'pro') {
      setIsProPlan(true);
    } else {
      showToast('⚠️ Branch management is only available on Pro plan');
      navigateTo('home');
    }
  }, [user.plan, navigateTo, showToast]);

  // Load branches and staff
  useEffect(() => {
    async function loadData() {
      try {
        const { auth, firestore } = initializeFirebase();
        const currentUser = auth.currentUser;

        if (!currentUser) {
          showToast('❌ Please log in');
          return;
        }

        // Get user's business ID
        const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
        if (!userDoc.exists()) {
          showToast('❌ User profile not found');
          return;
        }

        const businessId = userDoc.data().businessId || currentUser.uid;

        // Load branches
        const branchesQuery = query(collection(firestore, 'businesses', businessId, 'branches'));
        const branchesSnapshot = await getDocs(branchesQuery);
        const branchesData: Branch[] = [];

        for (const branchDoc of branchesSnapshot.docs) {
          const data = branchDoc.data();
          
          // Count staff for this branch
          const staffQuery = query(
            collection(firestore, 'businesses', businessId, 'staff'),
            where('branchId', '==', branchDoc.id)
          );
          const staffSnapshot = await getDocs(staffQuery);

          branchesData.push({
            id: branchDoc.id,
            name: data.name || 'Unnamed Branch',
            address: data.address || '',
            phone: data.phone || '',
            manager: data.manager || 'Not assigned',
            staffCount: staffSnapshot.size,
            status: data.status || 'active',
            createdAt: data.createdAt,
          });
        }

        setBranches(branchesData);

        // Load all staff members
        const staffQuery = query(collection(firestore, 'businesses', businessId, 'staff'));
        const staffSnapshot = await getDocs(staffQuery);
        const staffData: StaffMember[] = [];

        staffSnapshot.forEach(doc => {
          const data = doc.data();
          staffData.push({
            id: doc.id,
            fullName: data.fullName || 'Unknown',
            email: data.email || '',
            role: data.role || 'Staff',
            branchId: data.branchId,
          });
        });

        setStaffMembers(staffData);

      } catch (error) {
        console.error('Error loading branches:', error);
        showToast('❌ Failed to load branches');
      } finally {
        setLoading(false);
      }
    }

    if (isProPlan) {
      loadData();
    }
  }, [isProPlan, showToast]);

  const handleCreateBranch = async (branchData: any) => {
    try {
      const { auth, firestore } = initializeFirebase();
      const currentUser = auth.currentUser;

      if (!currentUser) return;

      const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
      const businessId = userDoc.data().businessId || currentUser.uid;

      await addDoc(collection(firestore, 'businesses', businessId, 'branches'), {
        name: branchData.name,
        address: branchData.address,
        phone: branchData.phone,
        manager: branchData.manager || '',
        status: 'active',
        ownerId: currentUser.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      showToast('✅ Branch created successfully');
      setShowCreateModal(false);
      // Reload branches
      window.location.reload();

    } catch (error) {
      console.error('Error creating branch:', error);
      showToast('❌ Failed to create branch');
    }
  };

  const handleAssignStaff = async (staffId: string, branchId: string) => {
    try {
      const { firestore } = initializeFirebase();
      const currentUser = getAuth().currentUser;

      if (!currentUser) return;

      const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
      const businessId = userDoc.data().businessId || currentUser.uid;

      await updateDoc(doc(firestore, 'businesses', businessId, 'staff', staffId), {
        branchId,
        updatedAt: Timestamp.now(),
      });

      showToast('✅ Staff assigned to branch');
      setShowAssignModal(false);
      window.location.reload();

    } catch (error) {
      console.error('Error assigning staff:', error);
      showToast('❌ Failed to assign staff');
    }
  };

  const handleDeleteBranch = async (branchId: string) => {
    if (!confirm('Are you sure you want to delete this branch? This cannot be undone.')) {
      return;
    }

    try {
      const { firestore } = initializeFirebase();
      const currentUser = getAuth().currentUser;

      if (!currentUser) return;

      const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
      const businessId = userDoc.data().businessId || currentUser.uid;

      await deleteDoc(doc(firestore, 'businesses', businessId, 'branches', branchId));

      showToast('✅ Branch deleted successfully');
      window.location.reload();

    } catch (error) {
      console.error('Error deleting branch:', error);
      showToast('❌ Failed to delete branch');
    }
  };

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.pageHeader}>
          <h2 className={styles.pageTitle}>Branches</h2>
          <p className={styles.pageDesc}>Loading branches...</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 20px' }}>
          <MOLoadingSpinner size={120} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Branches</h2>
          <p className={styles.pageDesc}>Manage your business locations and assign staff</p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => setShowCreateModal(true)}
          disabled={!isProPlan}
        >
          + Add Branch
        </Button>
      </div>

      {!isProPlan ? (
        <div className={styles.upgradeCard}>
          <div className={styles.upgradeIcon}>🔒</div>
          <h3>Pro Plan Required</h3>
          <p>Branch management is only available on the Pro plan. Upgrade to unlock unlimited branches.</p>
          <Button variant="primary" onClick={() => navigateTo('subscribe')}>
            Upgrade to Pro
          </Button>
        </div>
      ) : branches.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🏢</div>
          <h3>No Branches Yet</h3>
          <p>Create your first branch to start managing multiple locations</p>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            Create Your First Branch
          </Button>
        </div>
      ) : (
        <div className={styles.branchesGrid}>
          {/* Main Branch Card */}
          <div className={styles.branchCard}>
            <div className={styles.cardHeader}>
              <div className={styles.branchIcon}>🏠</div>
              <div>
                <h3 className={styles.branchName}>Main Branch</h3>
                <p className={styles.branchAddress}>Headquarters</p>
              </div>
            </div>
            <div className={styles.cardStats}>
              <div className={styles.stat}>
                <span className={styles.statValue}>{staffMembers.filter(s => !s.branchId).length}</span>
                <span className={styles.statLabel}>Staff</span>
              </div>
              <div className={styles.stat}>
                <span className={`${styles.statBadge} ${styles.badgeGreen}`}>Active</span>
              </div>
            </div>
            <div className={styles.cardActions}>
              <Button 
                variant="subtle" 
                size="sm"
                onClick={() => setShowAssignModal(true)}
              >
                Assign Staff
              </Button>
            </div>
          </div>

          {/* Other Branches */}
          {branches.map(branch => (
            <div key={branch.id} className={styles.branchCard}>
              <div className={styles.cardHeader}>
                <div className={styles.branchIcon}>🏢</div>
                <div>
                  <h3 className={styles.branchName}>{branch.name}</h3>
                  <p className={styles.branchAddress}>{branch.address || 'No address'}</p>
                </div>
              </div>
              <div className={styles.cardStats}>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{branch.staffCount}</span>
                  <span className={styles.statLabel}>Staff</span>
                </div>
                <div className={styles.stat}>
                  <span className={`${styles.statBadge} ${branch.status === 'active' ? styles.badgeGreen : styles.badgeRed}`}>
                    {branch.status}
                  </span>
                </div>
              </div>
              <div className={styles.cardInfo}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Manager:</span>
                  <span className={styles.infoValue}>{branch.manager || 'Not assigned'}</span>
                </div>
                {branch.phone && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Phone:</span>
                    <span className={styles.infoValue}>{branch.phone}</span>
                  </div>
                )}
              </div>
              <div className={styles.cardActions}>
                <Button 
                  variant="subtle" 
                  size="sm"
                  onClick={() => {
                    setSelectedBranch(branch);
                    setShowAssignModal(true);
                  }}
                >
                  Assign Staff
                </Button>
                <Button 
                  variant="danger" 
                  size="sm"
                  onClick={() => handleDeleteBranch(branch.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Branch Modal */}
      {showCreateModal && (
        <CreateBranchModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateBranch}
        />
      )}

      {/* Assign Staff Modal */}
      {showAssignModal && (
        <AssignStaffModal
          onClose={() => setShowAssignModal(false)}
          onAssign={handleAssignStaff}
          staffMembers={staffMembers}
          branches={branches}
          selectedBranch={selectedBranch}
        />
      )}
    </div>
  );
}

// Create Branch Modal Component
function CreateBranchModal({ onClose, onCreate }: { onClose: () => void; onCreate: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    manager: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Create New Branch</h3>
          <button onClick={onClose} className={styles.closeBtn}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Branch Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Victoria Island Branch"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              placeholder="Full address"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Phone Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+234 801 234 5678"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Manager Name</label>
            <input
              type="text"
              value={formData.manager}
              onChange={e => setFormData({ ...formData, manager: e.target.value })}
              placeholder="Branch manager name"
            />
          </div>
          <div className={styles.modalActions}>
            <Button type="button" variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Branch
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Assign Staff Modal Component
function AssignStaffModal({ 
  onClose, 
  onAssign, 
  staffMembers, 
  branches,
  selectedBranch 
}: { 
  onClose: () => void; 
  onAssign: (staffId: string, branchId: string) => void;
  staffMembers: StaffMember[];
  branches: Branch[];
  selectedBranch: Branch | null;
}) {
  const [selectedStaff, setSelectedStaff] = useState('');
  const [targetBranch, setTargetBranch] = useState(selectedBranch?.id || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStaff && targetBranch) {
      onAssign(selectedStaff, targetBranch);
    }
  };

  const unassignedStaff = staffMembers.filter(s => !s.branchId);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Assign Staff to Branch</h3>
          <button onClick={onClose} className={styles.closeBtn}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Staff Member</label>
            <select
              value={selectedStaff}
              onChange={e => setSelectedStaff(e.target.value)}
              required
            >
              <option value="">Select staff member</option>
              {unassignedStaff.map(staff => (
                <option key={staff.id} value={staff.id}>
                  {staff.fullName} ({staff.role})
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Branch</label>
            <select
              value={targetBranch}
              onChange={e => setTargetBranch(e.target.value)}
              required
            >
              <option value="">Select branch</option>
              <option value="">Main Branch</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.modalActions}>
            <Button type="button" variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Assign Staff
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
