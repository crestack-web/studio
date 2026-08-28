"use client";
import React, { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { Button } from '../Button';
import { doc, setDoc, getDoc, getFirestore } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { getAuthCurrentUser } from '@/lib/supabase-auth';
import { getSupabase } from '@/lib/supabase';
import styles from './AddStaffPage.module.css';
import { 
  ROLES, 
  getRecommendedPermissions, 
  getRecommendedRoles,
  createPermissionsObject
} from '@/lib/staffPermissions';

export default function AddStaffPage() {
  const generateStaffId = () => {
    return 'STF-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const generateStaffPassword = () => {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnopqrstuvwxyz';
    const digits = '23456789';
    const special = '!@#$%&*';
    const all = upper + lower + digits + special;
    const pick = (s: string) => s.charAt(Math.floor(Math.random() * s.length));
    let password = pick(upper) + pick(lower) + pick(digits) + pick(special);
    for (let i = 0; i < 8; i++) password += pick(all);
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
  };
  const { navigateTo, showToast } = useApp();
  const db = useFirestore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, boolean>>({});
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [staffCredentials, setStaffCredentials] = useState<{ staffId: string; password: string; name: string; email: string } | null>(null);

  // Fetch business type from current user's business
  useEffect(() => {
    async function fetchBusinessType() {
      try {
        const { firestore } = initializeFirebase();
        const currentUserId = getAuthCurrentUser()?.uid || '';
        
        if (currentUserId) {
          const ownerDoc = await getDoc(doc(firestore, 'users', currentUserId));
          const businessId = ownerDoc.data()?.businessId;
      if (!businessId) {
        showToast('No business linked to your account.');
        return;
      }
          
          const businessDoc = await getDoc(doc(firestore, 'businesses', businessId));
          if (businessDoc.exists()) {
            const category = businessDoc.data()?.category || 'other';
            setBusinessType(category);
            
            // Get recommended roles for this business type
            const recommendedRoles = getRecommendedRoles(category);
            if (recommendedRoles.length > 0 && !role) {
              setRole(recommendedRoles[0]);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching business type:', error);
      }
    }
    
    fetchBusinessType();
  }, []);

  // Use fixed staff dashboard permissions (not feature registry)
  // Staff dashboard only has: sale, inv, hist, atd, msg
  const STAFF_PERMISSIONS = [
    { key: 'sale', label: '🛒 Sales Recording', icon: 'ShoppingCart' },
    { key: 'inv', label: '📦 Inventory View', icon: 'Package' },
    { key: 'hist', label: '📊 History & Reports', icon: 'BarChart3' },
    { key: 'atd', label: '⏰ Attendance', icon: 'Clock' },
    { key: 'msg', label: '💬 Messages', icon: 'MessageSquare' },
  ];

  // Update permissions when role changes
  useEffect(() => {
    if (role) {
      const recommendedPermissions = getRecommendedPermissions(role, businessType);
      setSelectedPermissions(createPermissionsObject(recommendedPermissions));
    }
  }, [role]);

  const handleAddStaff = async () => {
    if (!name || !email || !role) {
      showToast('Please fill out all fields.');
      return;
    }

    try {
      const { firestore } = initializeFirebase();
      let currentUserId = getAuthCurrentUser()?.uid || '';
      if (!currentUserId) {
        const { data } = await getSupabase().auth.getSession();
        currentUserId = data.session?.user?.id || '';
      }
      if (!currentUserId) {
        showToast('Not signed in. Please refresh and log in again.');
        return;
      }

      // Get owner's business ID
      const ownerDoc = await getDoc(doc(firestore, 'users', currentUserId));
      const businessId = ownerDoc.data()?.businessId;
      if (!businessId) {
        showToast('No business linked to your account.');
        return;
      }
      const businessName = ownerDoc.data()?.businessName || ownerDoc.data()?.displayName || 'Your Business';

      const staffId = generateStaffId();
      const generatedPassword = generateStaffPassword();
      const avatarBg = ['#D1FAE5', '#EDE8FC', '#EFF6FF', '#FEF3C7', '#FEE2E2', '#CCFBF1'][Math.floor(Math.random() * 6)];
      const avatarColor = ['#14A05A', '#7C3AED', '#2563EB', '#D97706', '#DC2626', '#0D9488'][Math.floor(Math.random() * 6)];

      let firebaseUser: any;
      let isNewUser = true;

      try {
        // Call API route to create staff user using admin SDK
        // This prevents the owner from being signed out
        const response = await fetch('/api/staff/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            password: generatedPassword,
            name: name.trim(),
            role: role.trim(),
            staffId: staffId,
            businessId: businessId,
            permissions: selectedPermissions,
            businessName,
            sendInvite: true,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create staff user');
        }

        firebaseUser = { uid: data.uid };
        isNewUser = data.isNewUser;
      } catch (authError: any) {
        console.error('Error creating staff:', authError);
        const errorMessage = authError.message || 'Failed to create staff member. Please try again.';
        showToast(errorMessage);
        return;
      }

        showToast('Staff member added successfully!');
        
        // Show credentials modal instead of redirecting
        setStaffCredentials({ staffId, password: generatedPassword, name: name.trim(), email: email.trim() });
        setShowCredentialsModal(true);
      
      // Clear form
      setName('');
      setEmail('');
      setRole('');
    } catch (error) {
      console.error('Error adding staff member: ', error);
      showToast('Failed to add staff member.');
    }
  };

  const handleCloseModal = () => {
    setShowCredentialsModal(false);
    setStaffCredentials(null);
    navigateTo('staff');
  };

  const recommendedRoles = getRecommendedRoles(businessType);
  const allRoles = Object.entries(ROLES).map(([id, config]) => ({ id, ...config }));
  const filteredRoles = allRoles.filter(role => recommendedRoles.includes(role.id));

  return (
    <div className={styles.addStaffPage}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Add Staff</h2>
          <p className={styles.pageDesc}>Add a new member to your team.</p>
          {businessType && (
            <p className={styles.pageDesc} style={{ fontSize: '0.85rem', color: 'var(--brand)' }}>
              Business Type: {businessType.charAt(0).toUpperCase() + businessType.slice(1)}
            </p>
          )}
        </div>
        <Button variant="subtle" onClick={() => navigateTo('staff')}>← Back</Button>
      </div>

      <div className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="name">Name</label>
          <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Enter staff member's name" />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="email">Email</label>
          <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter email address" />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="role">Role</label>
          <select 
            id="role" 
            value={role} 
            onChange={e => setRole(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1.5px solid #E8E8F0',
              fontSize: '14px',
              fontFamily: 'inherit',
              outline: 'none',
            }}
          >
            <option value="">Select a role</option>
            {filteredRoles.map(r => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
          {role && ROLES[role] && (
            <p style={{ fontSize: '0.8rem', color: 'var(--t3)', marginTop: '4px' }}>
              {ROLES[role].description}
            </p>
          )}
        </div>


        <Button variant="primary" onClick={handleAddStaff}>Add Staff Member</Button>
      </div>

      {/* Credentials Modal */}
      {showCredentialsModal && staffCredentials && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Staff Credentials</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '20px' }}>
                <p style={{ marginBottom: '8px', fontWeight: 600 }}>Staff Name:</p>
                <p style={{ padding: '12px', background: 'var(--bg)', borderRadius: '8px' }}>{staffCredentials.name}</p>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <p style={{ marginBottom: '8px', fontWeight: 600 }}>Staff ID:</p>
                <p style={{ padding: '12px', background: 'var(--bg)', borderRadius: '8px' }}>{staffCredentials.staffId}</p>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <p style={{ marginBottom: '8px', fontWeight: 600 }}>Email:</p>
                <p style={{ padding: '12px', background: 'var(--bg)', borderRadius: '8px' }}>{staffCredentials.email}</p>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <p style={{ marginBottom: '8px', fontWeight: 600 }}>Password:</p>
                <p style={{ padding: '12px', background: 'var(--bg)', borderRadius: '8px', fontFamily: 'monospace', fontSize: '1.1rem' }}>{staffCredentials.password}</p>
              </div>
              <div style={{ padding: '12px', background: 'rgba(255, 193, 7, 0.1)', border: '1px solid rgba(255, 193, 7, 0.3)', borderRadius: '8px', marginBottom: '20px' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>⚠️ Please save these credentials securely. The password will not be shown again.</p>
              </div>
              <Button variant="primary" onClick={handleCloseModal}>Done</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

