'use client';

import { useEffect, useRef } from 'react';
import { collection, onSnapshot, orderBy, query, limit, Timestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { useApp } from './AppContext';
import {
  ensureServiceWorker,
  getNotificationPermission,
  notifySale,
  requestDeviceNotificationPermission,
} from '@/lib/deviceNotifications';

/**
 * Registers SW, optionally prompts for permission once, and listens for
 * new sales on the business so the owner gets a device notification
 * when staff (or another session) records a sale.
 */
export function DeviceNotificationsBridge() {
  const { user, pushNotification } = useApp();
  const sessionStartRef = useRef(Date.now());
  const seenIdsRef = useRef<Set<string>>(new Set());
  const primedRef = useRef(false);

  // Ensure SW + soft permission once if default
  useEffect(() => {
    ensureServiceWorker().catch(() => {});

    try {
      const asked = localStorage.getItem('busmo-notif-permission-asked');
      if (!asked && getNotificationPermission() === 'default') {
        // Soft delay so we don't block first paint
        const t = setTimeout(() => {
          requestDeviceNotificationPermission().finally(() => {
            try {
              localStorage.setItem('busmo-notif-permission-asked', '1');
            } catch { /* ignore */ }
          });
        }, 4000);
        return () => clearTimeout(t);
      }
    } catch { /* ignore */ }
  }, []);

  // Live sales listener → device + in-app inbox
  useEffect(() => {
    const businessId = user?.businessId;
    if (!businessId) return;

    let unsub: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      try {
        const { firestore } = initializeFirebase();
        if (!firestore) return;

        const q = query(
          collection(firestore, 'businesses', businessId, 'sales'),
          orderBy('createdAt', 'desc'),
          limit(15)
        );

        unsub = onSnapshot(
          q,
          (snap) => {
            if (cancelled) return;

            // First snapshot only primes seen ids (avoid flood on load)
            if (!primedRef.current) {
              snap.docs.forEach((d) => seenIdsRef.current.add(d.id));
              primedRef.current = true;
              return;
            }

            snap.docChanges().forEach((change) => {
              if (change.type !== 'added') return;
              const id = change.doc.id;
              if (seenIdsRef.current.has(id)) return;
              seenIdsRef.current.add(id);

              const data = change.doc.data();
              const created = data.createdAt;
              let createdMs = 0;
              if (created instanceof Timestamp) createdMs = created.toMillis();
              else if (created?.toMillis) createdMs = created.toMillis();
              else if (typeof created === 'number') createdMs = created;

              // Ignore anything clearly older than this session
              if (createdMs && createdMs < sessionStartRef.current - 5_000) return;

              const amount =
                Number(data.totalRevenue ?? data.total ?? data.subtotal ?? 0) || 0;
              const amountLabel = amount
                ? new Intl.NumberFormat(undefined, {
                    style: 'currency',
                    currency: 'NGN',
                    maximumFractionDigits: 0,
                  }).format(amount)
                : 'New sale';

              const staffName =
                data.recordedBy?.displayName ||
                data.recordedByName ||
                data.recordedBy?.email ||
                '';
              const byStaff =
                data.recordedBy?.role === 'Staff' ||
                (data.recordedBy?.uid && data.recordedBy.uid !== user.id);

              notifySale({
                amountLabel,
                saleId: id,
                byStaff: !!byStaff,
                staffName: staffName || undefined,
              }).catch(() => {});

              pushNotification({
                type: 'success',
                title: byStaff ? 'New sale from staff' : 'Sale recorded',
                body: staffName ? `${amountLabel} · ${staffName}` : amountLabel,
                href: 'statement',
                category: 'sales',
              });
            });
          },
          (err) => {
            console.warn('[DeviceNotificationsBridge] sales listener', err);
          }
        );
      } catch (err) {
        console.warn('[DeviceNotificationsBridge] init', err);
      }
    })();

    return () => {
      cancelled = true;
      unsub?.();
      primedRef.current = false;
      seenIdsRef.current = new Set();
    };
  }, [user?.businessId, user?.id, pushNotification]);

  return null;
}
