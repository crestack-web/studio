"use client";
import React, { useState, useEffect } from 'react';
import { useApp } from '../../AppContext';
import { Button } from '../../Button';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { useParams } from 'next/navigation';
import styles from '../../add-staff/AddStaffPage.module.css';

export default function RemoveStaffPage() {
  const { navigateTo, showToast } = useApp();
  const params = useParams();
  const staffId = params.id as string;
  const db = useFirestore();

  const [staffName, setStaffName] = useState('');

  useEffect(() => {
    const fetchStaffMember = async () => {
      const docRef = doc(db, 'staff', staffId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const staffData = docSnap.data();
        setStaffName(staffData.name);
      }
    };
    fetchStaffMember();
  }, [staffId, db]);

  const handleRemoveStaff = async () => {
    try {
      const docRef = doc(db, 'staff', staffId);
      await deleteDoc(docRef);
      showToast('Staff member removed successfully!');
      navigateTo('staff');
    } catch (error) {
      console.error('Error removing staff member: ', error);
      showToast('Failed to remove staff member.');
    }
  };

  return (
    <div className={styles.addStaffPage}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Remove Staff</h2>
          <p className={styles.pageDesc}>Are you sure you want to remove {staffName}?</p>
        </div>
      </div>

      <div className={styles.form}>
        <Button variant="danger" onClick={handleRemoveStaff}>Remove</Button>
        <Button variant="subtle" onClick={() => navigateTo('staff')}>Cancel</Button>
      </div>
    </div>
  );
}
