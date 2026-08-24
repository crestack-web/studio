'use client';

/**
 * WarehousePage — inventory locations, transfers, invoice release, adjustments.
 * Redesigned UI with clearer flows; data stays on businesses/{id}/…
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  runTransaction,
  Timestamp,
} from 'firebase/firestore';
import {
  Package,
  MapPin,
  ArrowLeftRight,
  ClipboardList,
  RotateCcw,
  Plus,
  RefreshCw,
  Search,
  Warehouse,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { useBranch } from '@/context/BranchContext';
import { initializeFirebase } from '@/firebase';
import { ensureFirebaseAuth } from '@/lib/ensure-firebase-auth';
import { getAuthCurrentUser } from '@/lib/supabase-auth';
import styles from './WarehousePage.module.css';
