/**
 * Real notifications for the owner header inbox.
 * Sources:
 *  1) public.notifications table (persisted events)
 *  2) Derived operational alerts from products (low stock / expiry)
 */

import { getSupabase } from '@/lib/supabase';
import { fetchDocs, toDate } from '@/lib/supabase-client-data';
import type { AppNotification, NotificationType } from '@/app/owner/dashboard/notificationTypes';
import type { PageId } from '@/app/owner/dashboard/index';

function mapType(raw: string | null | undefined): NotificationType {
  const t = String(raw || 'info').toLowerCase();
  if (t.includes('warn') || t.includes('stock') || t.includes('expir')) return 'warning';
  if (t.includes('alert') || t.includes('error') || t.includes('critical')) return 'alert';
  if (t.includes('success') || t.includes('sale')) return 'success';
  return 'info';
}

function mapCategory(
  raw: string | null | undefined
): AppNotification['category'] {
  const t = String(raw || '').toLowerCase();
  if (t.includes('sale')) return 'sales';
  if (t.includes('stock') || t.includes('inventory') || t.includes('expir')) return 'stock';
  if (t.includes('payroll') || t.includes('staff')) return 'payroll';
  if (t.includes('tip')) return 'tip';
  return 'system';
}

function mapHref(category?: string, data?: Record<string, unknown>): PageId | undefined {
  const c = String(category || '').toLowerCase();
  if (data?.href && typeof data.href === 'string') return data.href as PageId;
  if (c.includes('sale')) return 'statement';
  if (c.includes('expir')) return 'expiry-alerts' as PageId;
  if (c.includes('stock') || c.includes('ingredient')) return 'inventory';
  if (c.includes('menu')) return 'menu-management' as PageId;
  return undefined;
}

/** Load rows from notifications table for this user/business */
export async function fetchStoredBusinessNotifications(opts: {
  userId: string;
  businessId?: string | null;
  limit?: number;
}): Promise<AppNotification[]> {
  const { userId, businessId, limit = 40 } = opts;
  const supabase = getSupabase();

  let q = supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  // Prefer business-scoped; also include user-only rows
  if (businessId) {
    q = q.or(`business_id.eq.${businessId},user_id.eq.${userId}`);
  } else {
    q = q.eq('user_id', userId);
  }

  const { data, error } = await q;
  if (error) {
    console.warn('[notifications] fetch', error.message);
    return [];
  }

  return (data || []).map((row: any) => {
    const created =
      toDate(row.created_at)?.getTime() ||
      toDate(row.createdAt)?.getTime() ||
      Date.now();
    const dataJson =
      row.data && typeof row.data === 'object' ? (row.data as Record<string, unknown>) : {};
    return {
      id: String(row.id),
      type: mapType(row.type),
      title: String(row.title || 'Notification'),
      body: String(row.message || row.body || ''),
      createdAt: created,
      read: Boolean(row.read),
      href: mapHref(row.type, dataJson),
      category: mapCategory(row.type || dataJson.category as string),
    } satisfies AppNotification;
  });
}

/** Derive live alerts from inventory — real, not marketing seeds */
export async function deriveOperationalAlerts(
  businessId: string
): Promise<AppNotification[]> {
  if (!businessId) return [];
  try {
    const products = await fetchDocs(`businesses/${businessId}/products`);
    const now = Date.now();
    const items: AppNotification[] = [];

    let lowStockCount = 0;
    let expiredCount = 0;
    let expiringSoonCount = 0;
    const lowNames: string[] = [];
    const expNames: string[] = [];

    for (const p of products as any[]) {
      const meta = p.metadata && typeof p.metadata === 'object' ? p.metadata : {};
      const name = String(p.name || 'Item');
      const stock = Number(
        p.stock ?? p.stockLevel ?? p.stock_level ?? meta.stock ?? 0
      );
      const reorder = Number(
        p.reorderLevel ??
          p.reorder_level ??
          p.lowStockThreshold ??
          meta.reorderLevel ??
          10
      );
      if (stock <= reorder) {
        lowStockCount++;
        if (lowNames.length < 3) lowNames.push(name);
      }

      const exp =
        toDate(p.expiryDate) ||
        toDate(meta.expiryDate) ||
        toDate(p.expiry_date);
      if (exp) {
        const days = Math.ceil((exp.getTime() - now) / (1000 * 60 * 60 * 24));
        if (days <= 0) {
          expiredCount++;
          if (expNames.length < 3) expNames.push(name);
        } else if (days <= 7) {
          expiringSoonCount++;
          if (expNames.length < 3) expNames.push(name);
        }
      }
    }

    if (lowStockCount > 0) {
      items.push({
        id: `ops-low-stock-${businessId}`,
        type: 'warning',
        title:
          lowStockCount === 1
            ? '1 item is low on stock'
            : `${lowStockCount} items are low on stock`,
        body:
          lowNames.length > 0
            ? `${lowNames.join(', ')}${lowStockCount > lowNames.length ? ` +${lowStockCount - lowNames.length} more` : ''}`
            : 'Review inventory and restock soon.',
        createdAt: now - 1_000,
        read: false,
        href: 'inventory',
        category: 'stock',
      });
    }

    if (expiredCount > 0 || expiringSoonCount > 0) {
      const total = expiredCount + expiringSoonCount;
      items.push({
        id: `ops-expiry-${businessId}`,
        type: expiredCount > 0 ? 'alert' : 'warning',
        title:
          expiredCount > 0
            ? `${expiredCount} item${expiredCount > 1 ? 's' : ''} expired`
            : `${expiringSoonCount} item${expiringSoonCount > 1 ? 's' : ''} expiring soon`,
        body:
          expNames.length > 0
            ? `${expNames.join(', ')}${total > expNames.length ? ` +${total - expNames.length} more` : ''}`
            : 'Check expiry alerts in the kitchen.',
        createdAt: now - 2_000,
        read: false,
        href: 'expiry-alerts' as PageId,
        category: 'stock',
      });
    }

    return items;
  } catch (e) {
    console.warn('[notifications] deriveOperationalAlerts', e);
    return [];
  }
}

/** Persist a notification row (best-effort; does not block UI) */
export async function persistNotification(opts: {
  userId: string;
  businessId?: string | null;
  notification: Omit<AppNotification, 'read'> & { read?: boolean };
}): Promise<void> {
  try {
    const supabase = getSupabase();
    const n = opts.notification;
    await supabase.from('notifications').upsert(
      {
        id: n.id,
        business_id: opts.businessId || null,
        user_id: opts.userId,
        type: n.type,
        title: n.title,
        message: n.body,
        read: n.read ?? false,
        data: {
          category: n.category,
          href: n.href,
        },
        created_at: new Date(n.createdAt || Date.now()).toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch (e) {
    console.warn('[notifications] persist', e);
  }
}

export async function markNotificationReadRemote(id: string): Promise<void> {
  try {
    // Skip synthetic ops ids
    if (id.startsWith('ops-') || id.startsWith('seed-')) return;
    await getSupabase()
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
  } catch {
    /* ignore */
  }
}

export async function markAllNotificationsReadRemote(opts: {
  userId: string;
  businessId?: string | null;
}): Promise<void> {
  try {
    const supabase = getSupabase();
    if (opts.businessId) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .or(`business_id.eq.${opts.businessId},user_id.eq.${opts.userId}`);
    } else {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', opts.userId);
    }
  } catch {
    /* ignore */
  }
}

/** Merge DB + operational alerts, newest first, de-dupe by id */
export async function loadRealNotifications(opts: {
  userId: string;
  businessId?: string | null;
}): Promise<AppNotification[]> {
  const [stored, ops] = await Promise.all([
    fetchStoredBusinessNotifications(opts),
    opts.businessId
      ? deriveOperationalAlerts(opts.businessId)
      : Promise.resolve([] as AppNotification[]),
  ]);

  const byId = new Map<string, AppNotification>();
  for (const n of [...ops, ...stored]) {
    if (!byId.has(n.id)) byId.set(n.id, n);
  }
  return Array.from(byId.values()).sort((a, b) => b.createdAt - a.createdAt);
}
