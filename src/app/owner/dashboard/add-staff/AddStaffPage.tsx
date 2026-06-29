"use client";
import React, { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { Button } from '../Button';
import { doc, setDoc, getDoc, getFirestore } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import styles from './AddStaffPage.module.css';
import { 
  ROLES, 
  PERMISSIONS, 
  getRecommendedPermissions, 
  getRecommendedRoles,
  getPermissionsByCategory,
  createPermissionsObject 
} from '@/lib/staffPermissions';

export default function AddStaffPage() {
  const generateStaffId = () => {
    return 'STF-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const generateStaffPassword = () => {
    const length = 12;
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
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
        const { auth, firestore } = initializeFirebase();
        const currentUserId = auth.currentUser?.uid || '';
        
        if (currentUserId) {
          const ownerDoc = await getDoc(doc(firestore, 'users', currentUserId));
          const businessId = ownerDoc.data()?.businessId || 'default';
          
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

  // Update permissions when role changes
  useEffect(() => {
    if (role) {
      const recommendedPermissions = getRecommendedPermissions(role);
      setSelectedPermissions(createPermissionsObject(recommendedPermissions));
    }
  }, [role]);

  const handleAddStaff = async () => {
    if (!name || !email || !role) {
      showToast('Please fill out all fields.');
      return;
    }

    try {
      const { auth, firestore } = initializeFirebase();
      const currentUserId = auth.currentUser?.uid || '';
      
      // Get owner's business ID
      const ownerDoc = await getDoc(doc(firestore, 'users', currentUserId));
      const businessId = ownerDoc.data()?.businessId || 'default';

      const staffId = generateStaffId();
      const password = generateStaffPassword();
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
            password: password,
            name: name.trim(),
            role: role.trim(),
            staffId: staffId,
            businessId: businessId,
            permissions: selectedPermissions,
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
      setStaffCredentials({ staffId, password, name: name.trim(), email: email.trim() });
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

  const togglePermission = (key: string) => {
    setSelectedPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const permissionsByCategory = getPermissionsByCategory();
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

        {role && (
          <div className={styles.formGroup} style={{ marginTop: '24px' }}>
            <label>Permissions</label>
            <p style={{ fontSize: '0.8rem', color: 'var(--t3)', marginBottom: '12px' }}>
              Permissions are automatically recommended based on the selected role. You can customize them below.
            </p>
            {Object.entries(permissionsByCategory).map(([category, perms]) => (
              <div key={category} style={{ marginBottom: '16px' }}>
                <h4 style={{ 
                  fontSize: '0.85rem', 
                  fontWeight: '600', 
                  color: 'var(--t1)', 
                  marginBottom: '8px',
                  textTransform: 'capitalize',
                  letterSpacing: '0.05em'
                }}>
                  {category}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {perms.map(perm => (
                    <label key={perm.label} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: 'var(--bg)',
                      cursor: 'pointer',
                      border: selectedPermissions[perm.label] ? '1.5px solid var(--brand)' : '1px solid #E8E8F0',
                    }}>
                      <input 
                        type="checkbox" 
                        checked={selectedPermissions[perm.label] || false}
                        onChange={() => togglePermission(perm.label)}
                        style={{ accentColor: 'var(--brand)' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--t1)' }}>
                          {perm.label}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--t3)' }}>
                          {perm.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

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

