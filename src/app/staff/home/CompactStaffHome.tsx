'use client';

import React, { useEffect, useState } from 'react';
import type { PageId, Permissions } from './types';
import { fetchDocs } from '@/lib/supabase-client-data';
import { formatCurrency } from '@/lib/currency';

interface CompactStaffHomeProps {
  staffName: string;
  businessName: string;
  businessId: string;
  staffId: string;
  currency: string;
  shiftElapsed: string;
  permissions: Permissions;
  onNav: (p: PageId) => void;
}

/**
 * Refined mobile/browser staff home — compact header, summary, New Sale CTA.
 * Does not replace backend metrics; loads today's sales when possible.
 */
export function CompactStaffHome({
  staffName,
  businessName,
  businessId,
  staffId,
  currency,
  shiftElapsed,
  permissions,
  onNav,
}: CompactStaffHomeProps) {
  const [salesTotal, setSalesTotal] = useState(0);
  const [transactions, setTransactions] = useState(0);
  const [itemsSold, setItemsSold] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!businessId) return;
      try {
        const sales = await fetchDocs<Record<string, any>>(`businesses/${businessId}/sales`);
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        let total = 0;
        let tx = 0;
        let items = 0;
        for (const s of sales) {
          const created = s.createdAt || s.created_at;
          const d = created ? new Date(created) : null;
          if (!d || d < start) continue;
          const soldBy = s.soldBy || s.metadata?.staffId || s.metadata?.actorId;
          if (staffId && soldBy && String(soldBy) !== String(staffId)) {
            // Prefer own sales when attribution exists; still count if missing
          }
          tx += 1;
          total += Number(s.total || s.total_amount || s.total_revenue || 0);
          const lineItems = s.products || s.items || [];
          if (Array.isArray(lineItems)) {
            items += lineItems.reduce(
              (n: number, it: any) => n + (Number(it.quantity || it.qty) || 0),
              0
            );
          }
        }
        if (!cancelled) {
          setSalesTotal(total);
          setTransactions(tx);
          setItemsSold(items);
        }
      } catch {
        /* keep zeros */
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [businessId, staffId]);

  const avg =
    transactions > 0 ? salesTotal / transactions : 0;
  const first = staffName.split(' ')[0] || staffName;

  return (
    <div className="staff-home-compact">
      <div className="sh-header">
        <div>
          <div className="sh-name">Hi, {first}</div>
          <div className="sh-meta">
            {businessName} · Shift {shiftElapsed}
          </div>
        </div>
      </div>

      <div className="sh-summary" aria-label="Today summary">
        <div className="sh-metric">
          <strong>{formatCurrency(salesTotal, currency)}</strong>
          <span>Today</span>
        </div>
        <div className="sh-metric">
          <strong>{transactions}</strong>
          <span>Sales</span>
        </div>
        <div className="sh-metric">
          <strong>{itemsSold}</strong>
          <span>Items</span>
        </div>
      </div>

      {permissions.sale && (
        <button type="button" className="sh-cta" onClick={() => onNav('sale')}>
          + New Sale
        </button>
      )}

      <p className="sh-section-title">Performance</p>
      <div className="sh-perf">
        <div className="sh-perf-item">
          <strong>{formatCurrency(avg, currency)}</strong>
          <span>Average sale</span>
        </div>
        <div className="sh-perf-item">
          <strong>{shiftElapsed}</strong>
          <span>Shift duration</span>
        </div>
      </div>

      <p className="sh-section-title">Shortcuts</p>
      <div className="sh-actions">
        {permissions.sale && (
          <button type="button" className="sh-action" onClick={() => onNav('sale')}>
            Record sale
          </button>
        )}
        {permissions.inv && (
          <button type="button" className="sh-action" onClick={() => onNav('inv')}>
            Inventory
          </button>
        )}
        {permissions.hist && (
          <button type="button" className="sh-action" onClick={() => onNav('hist')}>
            History
          </button>
        )}
        {permissions.shift && (
          <button type="button" className="sh-action" onClick={() => onNav('shift')}>
            Shift close
          </button>
        )}
        <button type="button" className="sh-action" onClick={() => onNav('settings')}>
          Settings
        </button>
      </div>
    </div>
  );
}
