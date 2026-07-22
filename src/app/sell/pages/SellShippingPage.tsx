'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { useSell } from '../context/SellContext';
import styles from './SellShippingPage.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShippingZone {
  id: string;
  zoneName: string;
  regions: string[];
  flatRate: number;
  estimatedDeliveryDays: number;
  createdAt: Date;
  updatedAt: Date;
}

interface PickupLocation {
  name: string;
  address: string;
}

type ZoneForm = {
  zoneName: string;
  regions: string;
  flatRate: string;
  estimatedDeliveryDays: string;
};

const EMPTY_ZONE_FORM: ZoneForm = {
  zoneName: '', regions: '', flatRate: '', estimatedDeliveryDays: '3',
};

function fmt(n: number, currency = 'NGN') {
  const s = currency === 'NGN' ? '₦' : '$';
  return `${s}${n.toLocaleString()}`;
}

// ─── Zone Slide-Over ──────────────────────────────────────────────────────────

interface ZoneSlideOverProps {
  zone: ShippingZone | null;
  onClose: () => void;
  onSaved: () => void;
  businessId: string;
  currency: string;
}

function ZoneSlideOver({ zone, onClose, onSaved, businessId, currency }: ZoneSlideOverProps) {
  const { showToast } = useSell();
  const [form, setForm] = useState<ZoneForm>(() => zone
    ? { zoneName: zone.zoneName, regions: zone.regions.join(', '), flatRate: String(zone.flatRate), estimatedDeliveryDays: String(zone.estimatedDeliveryDays) }
    : { ...EMPTY_ZONE_FORM }
  );
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof ZoneForm>(k: K, v: ZoneForm[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = useCallback(async () => {
    if (!form.zoneName.trim()) return;
    const rate = parseFloat(form.flatRate);
    if (isNaN(rate) || rate < 0) { showToast('Flat rate must be 0 or more', 'error'); return; }
    setSaving(true);
    try {
      const { firestore } = initializeFirebase();
      const payload = {
        zoneName: form.zoneName.trim(),
        regions: form.regions.split(',').map(r => r.trim()).filter(Boolean),
        flatRate: rate,
        estimatedDeliveryDays: parseInt(form.estimatedDeliveryDays) || 3,
        updatedAt: serverTimestamp(),
      };
      const colRef = collection(firestore, 'businesses', businessId, 'storeShippingZones');
      if (zone) {
        await updateDoc(doc(colRef, zone.id), payload);
      } else {
        await addDoc(colRef, { ...payload, createdAt: serverTimestamp() });
      }
      onSaved();
    } catch (err) {
      console.error('[ZoneSlideOver] Save error:', err);
      showToast('Failed to save zone', 'error');
    } finally { setSaving(false); }
  }, [form, zone, businessId, onSaved, showToast]);

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.slideover}>
        <div className={styles.slideoverHeader}>
          <div>
            <p className={styles.slideoverTitle}>{zone ? 'Edit Shipping Zone' : 'Add Shipping Zone'}</p>
            <p className={styles.slideoverSub}>{zone ? `Editing ${zone.zoneName}` : 'Define a delivery area and rate'}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className={styles.slideoverBody}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Zone name *</label>
            <input className={styles.formInput} placeholder="e.g. Lagos Island, South-West Nigeria" value={form.zoneName} onChange={e => set('zoneName', e.target.value)} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>States / regions covered</label>
            <input className={styles.formInput} placeholder="e.g. Lagos, Ogun, Oyo" value={form.regions} onChange={e => set('regions', e.target.value)} />
            <p className={styles.formHint}>Separate multiple regions with commas</p>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Flat delivery rate *</label>
              <div className={styles.priceWrap}>
                <span className={styles.pricePrefix}>{currency === 'NGN' ? '₦' : '$'}</span>
                <input className={`${styles.formInput} ${styles.priceInput}`} type="number" min="0" step="1" placeholder="0" value={form.flatRate} onChange={e => set('flatRate', e.target.value)} />
              </div>
              <p className={styles.formHint}>Enter 0 for free delivery</p>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Est. delivery days</label>
              <input className={styles.formInput} type="number" min="1" placeholder="3" value={form.estimatedDeliveryDays} onChange={e => set('estimatedDeliveryDays', e.target.value)} />
            </div>
          </div>
        </div>
        <div className={styles.slideoverFooter}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={onClose} disabled={saving}>Cancel</button>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSave} disabled={saving || !form.zoneName.trim()}>
            {saving
              ? <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.7s linear infinite' }}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>Saving…</>
              : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>{zone ? 'Save changes' : 'Add zone'}</>}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Pickup Location Slide-Over ───────────────────────────────────────────────

interface PickupSlideOverProps {
  locations: PickupLocation[];
  onSave: (locs: PickupLocation[]) => void;
  onClose: () => void;
}

function PickupSlideOver({ locations, onSave, onClose }: PickupSlideOverProps) {
  const [locs, setLocs] = useState<PickupLocation[]>(locations);
  const [name, setName]     = useState('');
  const [address, setAddr]  = useState('');

  const add = () => {
    if (!name.trim() || !address.trim()) return;
    setLocs(prev => [...prev, { name: name.trim(), address: address.trim() }]);
    setName(''); setAddr('');
  };

  const remove = (idx: number) => setLocs(prev => prev.filter((_, i) => i !== idx));

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.slideover}>
        <div className={styles.slideoverHeader}>
          <div>
            <p className={styles.slideoverTitle}>Pickup Locations</p>
            <p className={styles.slideoverSub}>Let customers pick up orders from these addresses</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className={styles.slideoverBody}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Location name</label>
              <input className={styles.formInput} placeholder="e.g. Main Store, Warehouse" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Address</label>
              <input className={styles.formInput} placeholder="Full street address" value={address} onChange={e => setAddr(e.target.value)} />
            </div>
            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={add} disabled={!name.trim() || !address.trim()} style={{ alignSelf: 'flex-start' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add location
            </button>
          </div>
          {locs.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <p className={styles.formLabel} style={{ marginBottom: 8 }}>Current locations</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {locs.map((loc, i) => (
                  <div key={i} className={styles.locationRow}>
                    <div>
                      <p className={styles.locName}>{loc.name}</p>
                      <p className={styles.locAddr}>{loc.address}</p>
                    </div>
                    <button className={styles.removeBtn} onClick={() => remove(i)} title="Remove">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className={styles.slideoverFooter}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={onClose}>Cancel</button>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => onSave(locs)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Save locations
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function SellShippingPage() {
  const { user, storeConfig, showToast, refreshStoreConfig } = useSell();
  const currency = storeConfig?.currency ?? 'NGN';

  const [zones, setZones]             = useState<ShippingZone[]>([]);
  const [loading, setLoading]         = useState(true);
  const [slideOver, setSlideOver]     = useState<'add' | ShippingZone | null>(null);
  const [pickupSlide, setPickupSlide] = useState(false);
  const [deleting, setDeleting]       = useState<string | null>(null);
  const [savingPickup, setSavingPickup] = useState(false);

  const pickupLocations: PickupLocation[] = (storeConfig as any)?.pickupLocations ?? [];

  const load = useCallback(async () => {
    if (!user?.businessId) return;
    try {
      const { firestore } = initializeFirebase();
      const snap = await getDocs(
        collection(firestore, 'businesses', user.businessId, 'storeShippingZones')
      );
      const items = snap.docs.map(d => ({
        id: d.id, ...d.data(),
        regions: d.data().regions ?? [],
        createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
        updatedAt: d.data().updatedAt?.toDate?.() ?? new Date(),
      })) as ShippingZone[];
      items.sort((a, b) => a.zoneName.localeCompare(b.zoneName));
      setZones(items);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [user?.businessId]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = useCallback(async (zone: ShippingZone, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete zone "${zone.zoneName}"?`)) return;
    setDeleting(zone.id);
    try {
      const { firestore } = initializeFirebase();
      await deleteDoc(doc(collection(firestore, 'businesses', user!.businessId, 'storeShippingZones'), zone.id));
      setZones(prev => prev.filter(z => z.id !== zone.id));
      showToast('Zone deleted', 'info');
    } catch { showToast('Failed to delete zone', 'error'); }
    finally { setDeleting(null); }
  }, [user, showToast]);

  const handleSavePickup = useCallback(async (locs: PickupLocation[]) => {
    if (!user?.businessId) return;
    setSavingPickup(true);
    try {
      const { firestore } = initializeFirebase();
      const { doc: fbDoc, setDoc } = await import('firebase/firestore');
      await setDoc(
        fbDoc(firestore, 'businesses', user.businessId, 'store', 'config'),
        { pickupLocations: locs, updatedAt: serverTimestamp() },
        { merge: true }
      );
      await refreshStoreConfig();
      setPickupSlide(false);
      showToast('Pickup locations saved', 'success');
    } catch { showToast('Failed to save pickup locations', 'error'); }
    finally { setSavingPickup(false); }
  }, [user?.businessId, refreshStoreConfig, showToast]);

  const onSaved = useCallback(async () => {
    setSlideOver(null);
    await load();
    showToast('Shipping zone saved', 'success');
  }, [load, showToast]);

  return (
    <>
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.heading}>Shipping &amp; Delivery</h2>
            <p className={styles.sub}>Define delivery zones, rates, and pickup locations for your store.</p>
          </div>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setSlideOver('add')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add zone
          </button>
        </div>

        {/* Pickup locations card */}
        <div className={styles.pickupCard}>
          <div className={styles.pickupCardHeader}>
            <div className={styles.pickupCardIcon}>🏪</div>
            <div style={{ flex: 1 }}>
              <p className={styles.pickupCardTitle}>Pickup Locations</p>
              <p className={styles.pickupCardSub}>
                {pickupLocations.length > 0
                  ? `${pickupLocations.length} location${pickupLocations.length !== 1 ? 's' : ''} configured`
                  : 'Let customers pick up from your store'}
              </p>
            </div>
            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setPickupSlide(true)}>
              {pickupLocations.length > 0 ? 'Edit locations' : 'Add location'}
            </button>
          </div>
          {pickupLocations.length > 0 && (
            <div className={styles.pickupList}>
              {pickupLocations.map((loc, i) => (
                <div key={i} className={styles.pickupItem}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <div>
                    <p className={styles.locName}>{loc.name}</p>
                    <p className={styles.locAddr}>{loc.address}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Shipping zones */}
        <div>
          <p className={styles.sectionTitle}>Delivery Zones</p>
          {loading ? (
            <div className={styles.empty}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--sell-text-3)', fontSize: '0.875rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.7s linear infinite' }}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                Loading zones…
              </div>
            </div>
          ) : zones.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🚚</div>
              <p className={styles.emptyTitle}>No shipping zones</p>
              <p className={styles.emptySub}>Add your first delivery zone to start accepting orders from customers across different regions.</p>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setSlideOver('add')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add first zone
              </button>
            </div>
          ) : (
            <div className={styles.zoneList}>
              {zones.map(zone => (
                <div key={zone.id} className={styles.zoneCard} onClick={() => setSlideOver(zone)}>
                  <div className={styles.zoneIcon}>🌍</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className={styles.zoneName}>{zone.zoneName}</p>
                    {zone.regions.length > 0 && (
                      <p className={styles.zoneRegions}>{zone.regions.join(' · ')}</p>
                    )}
                  </div>
                  <div className={styles.zoneRate}>
                    <p className={styles.zoneRateValue}>{zone.flatRate === 0 ? 'Free' : fmt(zone.flatRate, currency)}</p>
                    <p className={styles.zoneRateSub}>{zone.estimatedDeliveryDays} day{zone.estimatedDeliveryDays !== 1 ? 's' : ''}</p>
                  </div>
                  <div className={styles.zoneActions} onClick={e => e.stopPropagation()}>
                    <button className={styles.iconBtn} onClick={() => setSlideOver(zone)} title="Edit">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={e => handleDelete(zone, e)} disabled={deleting === zone.id} title="Delete">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {slideOver !== null && user?.businessId && (
        <ZoneSlideOver
          zone={slideOver === 'add' ? null : slideOver}
          onClose={() => setSlideOver(null)}
          onSaved={onSaved}
          businessId={user.businessId}
          currency={currency}
        />
      )}
      {pickupSlide && (
        <PickupSlideOver
          locations={pickupLocations}
          onSave={handleSavePickup}
          onClose={() => setPickupSlide(false)}
        />
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
