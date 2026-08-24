'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { Card, CardHeader, CardIcon } from './Card';
import { Button } from './Button';
import { Pill } from './Badge';
import { NavIcons } from './NavIcons';
import styles from './StaffPage.module.css';
import { ChatPanel } from './ChatPanel';
import { initializeFirebase } from '@/firebase';
import { doc, setDoc, getDoc, getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { BrevoService } from '@/services/email/brevo-service';
import { sendStaffRoleUpdatedEmail, sendStaffRemovedEmail } from '@/services/email/team-management-emails';
import { isRestaurantBusiness, getBusinessCategory } from './utils/restaurantHelpers';
import AttendanceTab from './AttendanceTab';

/** Temporary bootstrap while full StaffPage is restored */
export default function StaffPage() {
  const { showToast, navigateTo } = useApp();
  const { t } = useTranslation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>{t('staff.title') || 'Staff'}</h2>
          <p className={styles.pageDesc}>{t('staff.subtitle') || 'Manage your team'}</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="primary" size="sm" onClick={() => navigateTo('add-staff')}>+ {t('staff.addMember') || 'Add member'}</Button>
        </div>
      </div>
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon} aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={40} height={40}>
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87"/>
            <path d="M16 3.13a4 4 0 010 7.75"/>
          </svg>
        </div>
        <h3 className={styles.emptyTitle}>Staff page is updating</h3>
        <p className={styles.emptyDesc}>
          {ready
            ? 'A full restore is in progress. Please hard-refresh in a moment. Core staff data is safe in Firestore.'
            : 'Loading…'}
        </p>
        <Button variant="primary" onClick={() => window.location.reload()}>Refresh</Button>
      </div>
    </div>
  );
}
