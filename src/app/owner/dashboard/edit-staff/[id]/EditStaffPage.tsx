"use client";
import React, { useState, useEffect } from 'react';
import { useApp } from '../../AppContext';
import { Button } from '../../Button';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { useParams } from 'next/navigation';
import styles from '../../add-staff/AddStaffPage.module.css';

export default function EditStaffPage() {
  const { navigateTo, showToast } = useApp();
  const params = useParams();
  const staffId = params.id as string;
  const db = useFirestore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    const fetchStaffMember = async () => {
      const docRef = doc(db, 'staff', staffId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const staffData = docSnap.data();
        setName(staffData.name);
        setEmail(staffData.email);
        setRole(staffData.role);
      }
    };
    fetchStaffMember();
  }, [staffId, db]);

  const handleUpdateStaff = async () => {
    if (!name || !email || !role) {
      showToast('Please fill out all fields.');
      return;
    }

    try {
      const docRef = doc(db, 'staff', staffId);
      await updateDoc(docRef, {
        name,
        email,
        role,
      });
      showToast('Staff member updated successfully!');
      navigateTo('staff');
    } catch (error) {
      console.error('Error updating staff member: ', error);
      showToast('Failed to update staff member.');
    }
  };

  return (
    <div className={styles.addStaffPage}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Edit Staff</h2>
          <p className={styles.pageDesc}>Edit the details of your team member.</p>
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
        <Button variant="primary" onClick={handleUpdateStaff}>Update Staff Member</Button>
      </div>
    </div>
  );
}
