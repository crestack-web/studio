"use client";
import React, { useState, useEffect } from 'react';
import { useApp } from '../../AppContext';
import { Button } from '../../Button';
import { doc, getDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { useParams } from 'next/navigation';
import { initializeFirebase } from '@/firebase';
import styles from '../../add-staff/AddStaffPage.module.css';

export default function RemoveStaffPage() {
  const { navigateTo, showToast } = useApp();
  const params = useParams();
  const staffId = params.id as string;
  const db = useFirestore();

  const [staffName, setStaffName] = useState('');
  const [businessId, setBusinessId] = useState('');

  useEffect(() => {
    const fetchStaffMember = async () => {
      try {
        const { auth, firestore } = initializeFirebase();
        const currentUserId = auth.currentUser?.uid || '';
        const ownerDoc = await getDoc(doc(firestore, 'users', currentUserId));
        const bid = ownerDoc.data()?.businessId || 'default';
        setBusinessId(bid);

        const docRef = doc(db, 'businesses', bid, 'staff', staffId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const staffData = docSnap.data();
          setStaffName(staffData.name);
        }
      } catch (error) {
        console.error('Error fetching staff member:', error);
      }
    };
    fetchStaffMember();
  }, [staffId, db]);

  const handleRemoveStaff = async () => {
    try {
      const staffDocRef = doc(db, 'businesses', businessId, 'staff', staffId);
      await deleteDoc(staffDocRef);

      const { firestore } = initializeFirebase();
      await setDoc(doc(firestore, 'users', staffId), {
        role: 'Removed',
        businessId: null,
      }, { merge: true });

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
