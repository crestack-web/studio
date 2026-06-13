"use client";
import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { Button } from '../Button';
import { collection, addDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import styles from './AddStaffPage.module.css';

export default function AddStaffPage() {
  const { navigateTo, showToast } = useApp();
  const db = useFirestore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');

  const handleAddStaff = async () => {
    if (!name || !email || !role) {
      showToast('Please fill out all fields.');
      return;
    }

    try {
      await addDoc(collection(db, 'staff'), {
        name,
        email,
        role,
        revenue: '₦0',
        transactions: 0,
        initials: name.split(' ').map(n => n[0]).join(''),
        avatarBg: '#EDE8FC',
        avatarColor: '#6B3FE7',
      });
      showToast('Staff member added successfully!');
      navigateTo('staff');
    } catch (error) {
      console.error('Error adding staff member: ', error);
      showToast('Failed to add staff member.');
    }
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
    </div>
  );
}
