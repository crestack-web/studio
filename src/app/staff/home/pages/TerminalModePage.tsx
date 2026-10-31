'use client';

/**
 * Busmo One — Terminal Mode
 * Fast barcode checkout for staff on Android POS / desktop wedge scanners.
 * Reuses /api/sales/record, fetchProducts, offlineManager, ReceiptGenerator path.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchProducts, type Product as DsProduct } from '../services/dataService';
import { fetchDoc } from '@/lib/supabase-client-data';
import { offlineManager } from '@/lib/offline/offline-manager';
import { getSupabase } from '@/lib/supabase';
import { createDefaultScanner, type BarcodeScanner } from '@/lib/terminal/barcode-scanner';
import {
  createDefaultPrinter,
  type ReceiptData as PrintReceipt,
} from '@/lib/terminal/receipt-printer';
import { isDemoMode } from '@/lib/terminal/terminal-session';

type TerminalProduct = DsProduct & { barcode?: string; sku?: string };

type CartLine = {
  productId: string;
  name: string;
  price: number;
  costPrice: number;
  quantity: number;
  barcode?: string;
};

type PayMethod = 'cash' | 'transfer' | 'pos';

interface TerminalModePageProps {
  businessId: string;
  staffId: string;
  staffName?: string;
  staffRole?: string;
  businessName?: string;
  branchName?: string;
  currency?: string;
  onExit?: () => void;
  canCreateProducts?: boolean;
}

function money(n: number, cur: string) {
  return `${cur}${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function TerminalModePage({
  businessId,
  staffId,
  staffName = 'Cashier',
  staffRole = 'Staff',
  businessName: businessNameProp,
  branchName,
  currency: currencyProp = '₦',
  onExit,
  canCreateProducts = false,
}: TerminalModePageProps) {
  const [products, setProducts] = useState<TerminalProduct[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [unknownBarcode, setUnknownBarcode] = useState<string | null>(null);
  const [payLines, setPayLines] = useState<{ method: PayMethod; amount: number }[]>([
    { method: 'cash', amount: 0 },
  ]);
  const [posConfirmed, setPosConfirmed] = useState(false);
  const [businessName, setBusinessName] = useState(businessNameProp || 'Business');
  const [currency, setCurrency] = useState(currencyProp);
  const [lastReceipt, setLastReceipt] = useState<PrintReceipt | null>(null);
  const [showBrowse, setShowBrowse] = useState(true);
  const scanInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<BarcodeScanner | null>(null);
  const submittingRef = useRef(false);
  const clientSaleIdRef = useRef<string | null>(null);

  const total = useMemo(
    () => cart.reduce((s, l) => s + l.price * l.quantity, 0),
    [cart]
  );

  // Keep single-method amount in sync with cart total
  useEffect(() => {
    setPayLines((prev) => {
      if (prev.length !== 1) return prev;
      if (Math.abs((prev[0].amount || 0) - total) < 0.001) return prev;
      return [{ ...prev[0], amount: total }];
    });
  }, [total]);

  const payTotal = useMemo(
    () => payLines.reduce((s, p) => s + (Number(p.amount) || 0), 0),
    [payLines]
  );

  const togglePayMethod = (id: PayMethod) => {
    setPayLines((prev) => {
      const exists = prev.some((p) => p.method === id);
      if (exists) {
        const next = prev.filter((p) => p.method !== id);
        if (!next.length) return [{ method: 'cash', amount: total }];
        if (next.length === 1) return [{ ...next[0], amount: total }];
        return next;
      }
      // Add method for split
      if (prev.length === 0) return [{ method: id, amount: total }];
      const paid = prev.reduce((s, p) => s + (Number(p.amount) || 0), 0);
      const remaining = Math.max(0, Math.round((total - paid) * 100) / 100);
      return [...prev, { method: id, amount: remaining }];
    });
    if (id === 'pos') setPosConfirmed(false);
  };

  const setPayAmount = (method: PayMethod, amount: number) => {
    setPayLines((prev) =>
      prev.map((p) => (p.method === method ? { ...p, amount: Math.max(0, amount) } : p))
    );
  };


  // Load catalogue
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!businessId) return;
      setLoading(true);
      try {
        setOnline(offlineManager.isOnline());
        let list: TerminalProduct[] = [];
        if (!offlineManager.isOnline()) {
          list = (await offlineManager.getCachedProducts(businessId)) as TerminalProduct[];
        } else {
          list = (await fetchProducts(undefined, businessId)) as TerminalProduct[];
          void offlineManager.cacheProducts(businessId, list as any);
        }
        
        if (!cancelled && isDemoMode() && list.length === 0) {
          list = [
            { id: 'demo-1', name: 'Bottled Water 75cl', price: 200, costPrice: 80, stock: 48, barcode: '6151000000001', sku: 'WAT-75' },
            { id: 'demo-2', name: 'Indomie Chicken', price: 250, costPrice: 150, stock: 120, barcode: '6151000000002', sku: 'NDL-CH' },
            { id: 'demo-3', name: 'Peak Milk 160g', price: 450, costPrice: 320, stock: 36, barcode: '6151000000003', sku: 'MLK-PK' },
            { id: 'demo-4', name: 'Bread Loaf', price: 800, costPrice: 500, stock: 20, barcode: '6151000000004', sku: 'BRD-1' },
          ] as TerminalProduct[];
        }

        if (!cancelled) setProducts(list);

        const biz = await fetchDoc<Record<string, any>>('businesses', businessId);
        if (biz && !cancelled) {
          setBusinessName(biz.businessName || biz.name || businessNameProp || 'Business');
          if (biz.currency) setCurrency(String(biz.currency));
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load products');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const unsub = offlineManager.subscribe((s: 'online' | 'offline') => setOnline(s === 'online'));
    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [businessId, businessNameProp]);

  const findByBarcode = useCallback(
    (code: string): TerminalProduct | undefined => {
      const c = code.trim().toLowerCase();
      return products.find((p) => {
        const b = String((p as any).barcode || '').trim().toLowerCase();
        const sku = String((p as any).sku || '').trim().toLowerCase();
        return (b && b === c) || (sku && sku === c);
      });
    },
    [products]
  );

  const availableStock = (p: TerminalProduct): number => {
    const n = Number((p as any).stock ?? 0);
    return Number.isFinite(n) ? n : 0;
  };

  const addProduct = useCallback((p: TerminalProduct, qty = 1) => {
    const stock = availableStock(p);
    if (stock <= 0) {
      setError(`${p.name} is out of stock`);
      setUnknownBarcode(null);
      return;
    }
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.productId === p.id);
      if (idx >= 0) {
        const nextQty = prev[idx].quantity + qty;
        if (nextQty > stock) {
          setError(`Only ${stock} in stock for ${p.name}`);
          return prev;
        }
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: nextQty };
        return next;
      }
      return [
        ...prev,
        {
          productId: p.id,
          name: p.name,
          price: Number(p.price) || 0,
          costPrice: Number(p.costPrice) || 0,
          quantity: Math.min(qty, stock),
          barcode: (p as any).barcode,
        },
      ];
    });
    setFlash(p.name);
    setTimeout(() => setFlash(null), 900);
    setUnknownBarcode(null);
    setError(null);
  }, []);

  const onBarcode = useCallback(
    (code: string) => {
      const product = findByBarcode(code);
      if (product) {
        addProduct(product, 1);
        return;
      }
      setUnknownBarcode(code);
      setError(null);
    },
    [findByBarcode, addProduct]
  );

  // Scanner lifecycle
  useEffect(() => {
    const scanner = createDefaultScanner();
    scannerRef.current = scanner;
    void scanner.start();
    const off = scanner.onScan(onBarcode);
    return () => {
      off();
      void scanner.stop();
    };
  }, [onBarcode]);

  // Keep focus on scan field for wedge scanners
  useEffect(() => {
    const t = setInterval(() => {
      const el = scanInputRef.current;
      if (!el) return;
      const active = document.activeElement as HTMLElement | null;
      if (
        active &&
        (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA') &&
        active.getAttribute('data-barcode-input') !== 'true' &&
        active !== el
      ) {
        return;
      }
      if (document.visibilityState === 'visible') el.focus({ preventScroll: true });
    }, 1200);
    return () => clearInterval(t);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products.slice(0, 40);
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          String((p as any).barcode || '').toLowerCase().includes(q) ||
          String((p as any).sku || '').toLowerCase().includes(q)
      )
      .slice(0, 40);
  }, [products, search]);

  const setQty = (productId: string, quantity: number) => {
    setCart((prev) =>
      prev
        .map((l) =>
          l.productId === productId ? { ...l, quantity: Math.max(0, quantity) } : l
        )
        .filter((l) => l.quantity > 0)
    );
  };

  const removeLine = (productId: string) => {
    setCart((prev) => prev.filter((l) => l.productId !== productId));
  };

  const completeSale = async () => {
    if (!businessId || cart.length === 0 || submittingRef.current) return;
    const methods = payLines.length ? payLines : [{ method: 'cash' as PayMethod, amount: total }];
    if (methods.some((m) => m.method === 'pos') && !posConfirmed) {
      setError('Confirm that payment was received on the external POS terminal.');
      return;
    }
    const paidSum = methods.reduce((s, m) => s + (Number(m.amount) || 0), 0);
    if (Math.abs(paidSum - total) > 0.05) {
      setError(`Split payments must add up to total. Paid ${paidSum}, need ${total}.`);
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError(null);

    const clientSaleId =
      clientSaleIdRef.current ||
      (typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `term-${Date.now()}`);
    clientSaleIdRef.current = clientSaleId;

    const saleProducts = cart.map((l) => ({
      productId: l.productId,
      name: l.name,
      price: l.price,
      costPrice: l.costPrice,
      quantity: l.quantity,
    }));

    const paymentLabel =
      methods.length > 1
        ? methods.map((m) => `${m.method} ${money(m.amount, currency)}`).join(' + ')
        : methods[0].method === 'pos'
          ? 'External POS'
          : methods[0].method === 'transfer'
            ? 'Transfer'
            : 'Cash';

    try {
      if (!offlineManager.isOnline()) {
        await offlineManager.queueSale({
          id: clientSaleId,
          businessId,
          products: saleProducts,
          total,
          paymentType: methods.length > 1 ? 'split' : methods[0].method,
          staffId,
          staffName,
          createdAt: new Date().toISOString(),
        } as any);
        const receipt: PrintReceipt = {
          businessName,
          receiptNumber: clientSaleId.slice(0, 8).toUpperCase(),
          date: new Date().toLocaleString(),
          cashier: staffName,
          branchName,
          items: cart.map((l) => ({
            name: l.name,
            quantity: l.quantity,
            price: l.price,
            total: l.price * l.quantity,
          })),
          subtotal: total,
          total,
          paymentMethod: (payLines.length > 1 ? 'split' : payLines[0]?.method || 'cash') + ' · offline queue',
          currency,
        };
        setLastReceipt(receipt);
        setCart([]);
        setPosConfirmed(false);
        clientSaleIdRef.current = null;
        try {
          await createDefaultPrinter().printReceipt(receipt);
        } catch {
          /* mock may fail silently */
        }
        return;
      }

      if (isDemoMode()) {
        const receipt: PrintReceipt = {
          businessName: businessName + ' (Demo)',
          receiptNumber: 'DEMO',
          date: new Date().toLocaleString(),
          cashier: staffName,
          branchName,
          items: cart.map((l) => ({
            name: l.name,
            quantity: l.quantity,
            price: l.price,
            total: l.price * l.quantity,
          })),
          subtotal: total,
          total,
          paymentMethod: (payLines.length > 1 ? 'split' : payLines[0]?.method || 'cash') + ' · demo',
          currency,
        };
        setLastReceipt(receipt);
        setCart([]);
        setPosConfirmed(false);
        clientSaleIdRef.current = null;
        return;
      }

      const supabase = getSupabase();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Not signed in');

      const res = await fetch('/api/sales/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          businessId,
          products: saleProducts,
          total,
          paymentMethod: methods.length > 1 ? 'split' : methods[0].method,
          paymentMethods: methods.reduce(
            (acc, m) => {
              acc[m.method] = (acc[m.method] || 0) + (Number(m.amount) || 0);
              return acc;
            },
            {} as Record<string, number>
          ),
          paymentBreakdown: methods.map((m) => ({
            method: m.method,
            amount: Number(m.amount) || 0,
            received: true,
            manuallyConfirmed: m.method === 'pos',
          })),
          staffId,
          staffName,
          staffRole,
          offlineId: clientSaleId,
          source: 'busmo_one_terminal',
          note: methods.some((m) => m.method === 'pos')
            ? 'External POS — manually confirmed by cashier'
            : methods.length > 1
              ? 'Split payment'
              : '',
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || 'Sale failed');
      }

      const receipt: PrintReceipt = {
        businessName,
        receiptNumber: String(json.saleId || clientSaleId).slice(0, 8).toUpperCase(),
        date: new Date().toLocaleString(),
        cashier: staffName,
        branchName,
        items: cart.map((l) => ({
          name: l.name,
          quantity: l.quantity,
          price: l.price,
          total: l.price * l.quantity,
        })),
        subtotal: total,
        total,
        paymentMethod: paymentLabel,
        currency,
      };
      setLastReceipt(receipt);
      setCart([]);
      setPayLines([{ method: 'cash', amount: 0 }]);
      setPosConfirmed(false);
      clientSaleIdRef.current = null;
      try {
        await createDefaultPrinter().printReceipt(receipt);
      } catch {
        /* optional */
      }
    } catch (e: any) {
      setError(e?.message || 'Could not complete sale');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div
      className="terminal-sale-shell"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: '100%',
        minHeight: 0,
        overflow: 'hidden',
        background: 'var(--s-bg, #101513)',
        color: 'var(--s-text, #F5F7F5)',
        fontFamily: 'inherit',
      }}
    >
      <div
        className="terminal-sale-tools"
        style={{
          flexShrink: 0,
          background: 'var(--s-surface, #1B2420)',
          borderBottom: '1px solid var(--s-border, #344139)',
          zIndex: 5,
        }}
      >
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '10px 12px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{businessName}</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            {branchName ? `${branchName} · ` : ''}
            {staffName}
             · <span style={{ color: online ? 'var(--s-brand, #42B775)' : '#fbbf24' }}>
              {online ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              background: 'var(--s-brand, #42B775)',
              padding: '4px 8px',
              borderRadius: 6,
            }}
          >
            Busmo One
          </span>
          {onExit && (
            <button
              type="button"
              onClick={onExit}
              style={{
                background: 'var(--s-border, #344139)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '6px 10px',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Exit
            </button>
          )}
        </div>
      </header>

      {/* Scan input */}
      <div style={{ padding: '10px 12px', background: 'var(--s-surface, #1B2420)' }}>
        <input
          ref={scanInputRef}
          data-barcode-input="true"
          autoFocus
          placeholder="Scan barcode or type + Enter"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const v = (e.target as HTMLInputElement).value.trim();
              if (v) {
                onBarcode(v);
                (e.target as HTMLInputElement).value = '';
              }
            }
          }}
          style={{
            width: '100%',
            height: 48,
            borderRadius: 12,
            border: '2px solid var(--s-brand, #42B775)',
            background: 'var(--s-bg, #101513)',
            color: '#fff',
            padding: '0 14px',
            fontSize: 16,
            outline: 'none',
          }}
        />
        {flash && (
          <div style={{ marginTop: 6, color: 'var(--s-brand, #42B775)', fontSize: 13, fontWeight: 600 }}>
            + {flash}
          </div>
        )}
      </div>

      {/* Unknown barcode */}
      {unknownBarcode && (
        <div
          style={{
            margin: '8px 12px',
            padding: 12,
            borderRadius: 12,
            background: 'rgba(244,181,68,0.15)',
            border: '1px solid var(--s-warn, #F4B544)',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Product not found</div>
          <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 10 }}>
            Barcode <code>{unknownBarcode}</code> is not in this business catalogue.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                setSearch(unknownBarcode);
                setShowBrowse(true);
                setUnknownBarcode(null);
              }}
              style={btnSecondary}
            >
              Search products
            </button>
            {canCreateProducts ? (
              <button
                type="button"
                onClick={() =>
                  setError('Add products from the owner dashboard (Inventory), then rescan.')
                }
                style={btnSecondary}
              >
                Add product
              </button>
            ) : null}
            <button type="button" onClick={() => setUnknownBarcode(null)} style={btnGhost}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search / browse toggle */}
      <div style={{ padding: '0 12px 8px', display: 'flex', gap: 8 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name / SKU"
          style={{
            flex: 1,
            height: 40,
            borderRadius: 10,
            border: '1px solid var(--s-border, #344139)',
            background: 'var(--s-surface, #1B2420)',
            color: '#fff',
            padding: '0 12px',
            fontSize: 14,
          }}
        />
        <button
          type="button"
          onClick={() => setShowBrowse((v) => !v)}
          style={{ ...btnSecondary, height: 40 }}
          aria-pressed={showBrowse}
        >
          {showBrowse ? 'Hide list' : 'Show list'}
        </button>
      </div>
      </div>

      <div
        className="terminal-sale-scroll"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
        }}
      >

      {/* Owner catalogue — visible by default (no Browse required) */}
      {showBrowse && (
        <div
          style={{
            padding: '0 12px 12px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 8,
          }}
        >
          {loading ? (
            <div style={{ opacity: 0.6 }}>Loading products…</div>
          ) : (
            filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => addProduct(p, 1)}
                disabled={availableStock(p) <= 0}
                style={{
                  textAlign: 'left',
                  background: 'var(--s-elevated, #26312B)',
                  border: '1px solid var(--s-border, #344139)',
                  borderRadius: 10,
                  padding: 10,
                  color: '#fff',
                  cursor: availableStock(p) <= 0 ? 'not-allowed' : 'pointer',
                  minHeight: 64,
                  opacity: availableStock(p) <= 0 ? 0.45 : 1,
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>
                  {money(p.price, currency)}
                  {availableStock(p) <= 0 ? ' · Out of stock' : ''}
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Cart */}
      <div style={{ padding: '4px 12px 12px' }}>
        {cart.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              opacity: 0.5,
              padding: 40,
              fontSize: 14,
            }}
          >
            Tap a product below or scan a barcode — checkout appears when the cart has items
          </div>
        ) : (
          cart.map((l) => (
            <div
              key={l.productId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 0',
                borderBottom: '1px solid var(--s-border, #344139)',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{l.name}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  {money(l.price, currency)} each
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button type="button" style={qtyBtn} onClick={() => setQty(l.productId, l.quantity - 1)}>
                  −
                </button>
                <span style={{ minWidth: 28, textAlign: 'center', fontWeight: 700 }}>
                  {l.quantity}
                </span>
                <button type="button" style={qtyBtn} onClick={() => setQty(l.productId, l.quantity + 1)}>
                  +
                </button>
              </div>
              <div style={{ width: 80, textAlign: 'right', fontWeight: 600 }}>
                {money(l.price * l.quantity, currency)}
              </div>
              <button
                type="button"
                onClick={() => removeLine(l.productId)}
                style={{ ...btnGhost, padding: '6px 8px' }}
                aria-label="Remove"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      {error && (
        <div style={{ margin: '0 12px 8px', color: 'var(--s-danger, #EF6464)', fontSize: 13 }}>{error}</div>
      )}

      </div>{/* end terminal-sale-scroll */}

      {/* Payment only when cart has items */}
      {cart.length > 0 && (
      <footer
        style={{
          flexShrink: 0,
          padding: 12,
          background: 'var(--s-surface, #1B2420)',
          borderTop: '1px solid var(--s-border, #344139)',
        }}
      >
        <div style={{ marginBottom: 6, fontSize: 12, opacity: 0.75 }}>
          Tap methods to split · amounts must equal total
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          {(
            [
              ['cash', 'Cash'],
              ['transfer', 'Transfer'],
              ['pos', 'External POS'],
            ] as const
          ).map(([id, label]) => {
            const active = payLines.some((p) => p.method === id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => togglePayMethod(id)}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 10,
                  border: active
                    ? '2px solid var(--s-brand, #42B775)'
                    : '1px solid var(--s-border, #344139)',
                  background: active
                    ? 'var(--s-brand-soft, rgba(66,183,117,0.2))'
                    : 'var(--s-elevated, #26312B)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {payLines.length > 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
            {payLines.map((line) => (
              <div
                key={line.method}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: 13, textTransform: 'capitalize', minWidth: 90 }}>
                  {line.method === 'pos' ? 'External POS' : line.method}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={line.amount || ''}
                  onChange={(e) => setPayAmount(line.method, parseFloat(e.target.value) || 0)}
                  style={{
                    flex: 1,
                    height: 40,
                    borderRadius: 8,
                    border: '1px solid var(--s-border, #344139)',
                    background: 'var(--s-bg, #101513)',
                    color: '#fff',
                    padding: '0 10px',
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                />
              </div>
            ))}
            <div
              style={{
                fontSize: 12,
                color: Math.abs(payTotal - total) > 0.05 ? '#fbbf24' : 'var(--s-brand, #42B775)',
              }}
            >
              Paid {money(payTotal, currency)}
              {Math.abs(payTotal - total) > 0.05
                ? ` · need ${money(total, currency)}`
                : ' · balanced'}
            </div>
          </div>
        )}

        {payLines.some((p) => p.method === 'pos') && (
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 10,
              fontSize: 13,
            }}
          >
            <input
              type="checkbox"
              checked={posConfirmed}
              onChange={(e) => setPosConfirmed(e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
            Payment received on external POS (manual confirmation)
          </label>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>Total</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{money(total, currency)}</div>
          </div>
          <button
            type="button"
            disabled={cart.length === 0 || submitting}
            onClick={() => void completeSale()}
            style={{
              height: 52,
              minWidth: 160,
              borderRadius: 14,
              border: 'none',
              background: cart.length === 0 || submitting ? 'var(--s-border, #344139)' : 'var(--s-brand, #42B775)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 16,
              cursor: cart.length === 0 || submitting ? 'not-allowed' : 'pointer',
              padding: '0 20px',
            }}
          >
            {submitting ? 'Saving…' : 'CHARGE'}
          </button>
        </div>

        {lastReceipt && (
          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
            Last sale {lastReceipt.receiptNumber} · {lastReceipt.paymentMethod}
            <button
              type="button"
              onClick={() => void createDefaultPrinter().printReceipt(lastReceipt)}
              style={{ ...btnGhost, marginLeft: 8 }}
            >
              Reprint
            </button>
          </div>
        )}
      </footer>
      )}
    </div>
  );
}

const btnSecondary: React.CSSProperties = {
  background: 'var(--s-border, #344139)',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};

const btnGhost: React.CSSProperties = {
  background: 'transparent',
  color: 'var(--s-text-2, #A3B3A9)',
  border: '1px solid var(--s-border, #344139)',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 13,
  cursor: 'pointer',
};

const qtyBtn: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 8,
  border: '1px solid var(--s-border, #344139)',
  background: 'var(--s-elevated, #26312B)',
  color: '#fff',
  fontSize: 18,
  fontWeight: 700,
  cursor: 'pointer',
};

export default TerminalModePage;
