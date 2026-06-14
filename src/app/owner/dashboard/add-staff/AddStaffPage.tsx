"use client";
import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { Button } from '../Button';
import { collection, addDoc, doc, setDoc, getDoc, getFirestore } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import styles from './AddStaffPage.module.css';

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

export default function AddStaffPage() {
  const { navigateTo, showToast } = useApp();
  const db = useFirestore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [staffCredentials, setStaffCredentials] = useState<{ staffId: string; password: string; name: string; email: string } | null>(null);

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
        // Try to create Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        firebaseUser = userCredential.user;
      } catch (authError: any) {
        isNewUser = false;
        if (authError.code === 'auth/email-already-in-use') {
          showToast('This email is already registered. Please use a different email.');
          return;
        } else if (authError.code === 'auth/invalid-email') {
          showToast('Invalid email address. Please check and try again.');
          return;
        } else if (authError.code === 'auth/weak-password') {
          showToast('Password is too weak. Please use a stronger password.');
          return;
        } else {
          throw authError;
        }
      }

      // Create user profile in Firestore
      if (firebaseUser.uid && isNewUser) {
        await setDoc(doc(firestore, 'users', firebaseUser.uid), {
          displayName: name.trim(),
          email: email.trim(),
          role: 'Staff',
          staffId: staffId,
          businessId: businessId,
          permissions: {
            sale: true,
            inv: false,
            hist: false,
            atd: false,
            msg: false,
            earn: false,
          },
          initials: getInitials(name.trim()),
          createdAt: new Date(),
        });
      }

      // Create staff member in businesses collection
      await setDoc(doc(firestore, 'businesses', businessId, 'staff', firebaseUser.uid), {
        name: name.trim(),
        email: email.trim(),
        role: role.trim(),
        staffId: staffId,
        permissions: {
          sale: true,
          inv: false,
          hist: false,
          atd: false,
          msg: false,
          earn: false,
        },
        status: 'active',
        createdAt: new Date(),
        revenue: 0,
        transactions: 0,
        online: false,
      });

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

  return (
    <div className={styles.addStaffPage}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Add Staff</h2>
          <p className={styles.pageDesc}>Add a new member to your team.</p>
        </div>
        <Button variant="subtle" onClick={() => navigateTo('staff')}>← Back</Button>
      </div>

      <div className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="name">Name</label>
          <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="email">Email</label>
          <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="role">Role</label>
          <input type="text" id="role" value={role} onChange={e => setRole(e.target.value)} />
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
