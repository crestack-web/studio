/**
 * Tenant-scoped business context for Business Builder + FeatureRenderer.
 * Summaries only — never another business’s data.
 */

import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import type { BusmoRelationTarget } from './types';

export type EntityOption = {
  id: string;
  label: string;
  secondary?: string;
  meta?: Record<string, unknown>;
};

export type BusinessContextSummary = {
  businessId: string;
  name?: string;
  category?: string;
  currency: string;
  counts: Record<string, number>;
  modules: string[];
};

function admin() {
  return getSupabaseAdmin();
}

export async function getBusinessContextSummary(
  businessId: string
): Promise<BusinessContextSummary> {
  const sb = admin();
  let name: string | undefined;
  let category: string | undefined;
  try {
    const { data } = await sb
      .from('businesses')
      .select('name, category, industry, metadata')
      .eq('id', businessId)
      .maybeSingle();
    if (data) {
      name = String((data as any).name || '');
      category = String(
        (data as any).category ||
          (data as any).industry ||
          (data as any).metadata?.category ||
          ''
      );
    }
  } catch {
    /* ignore */
  }

  const counts: Record<string, number> = {};
  async function count(table: string, col = 'business_id') {
    try {
      const { count: c } = await sb
        .from(table)
        .select('id', { count: 'exact', head: true })
        .eq(col, businessId);
      counts[table] = c || 0;
    } catch {
      counts[table] = 0;
    }
  }
  await Promise.all([
    count('suppliers'),
    count('customers'),
    count('products'),
    count('staff'),
  ]);

  return {
    businessId,
    name,
    category,
    currency: 'NGN',
    counts,
    modules: [],
  };
}

/**
 * List entity options for relation fields (max 100, tenant-scoped).
 */
export async function listEntityOptions(
  businessId: string,
  target: BusmoRelationTarget,
  opts?: { q?: string; limit?: number }
): Promise<EntityOption[]> {
  const limit = Math.min(opts?.limit || 50, 100);
  const q = (opts?.q || '').trim().toLowerCase();
  const sb = admin();

  if (target === 'supplier') {
    try {
      let query = sb
        .from('suppliers')
        .select('id, name, phone, email')
        .eq('business_id', businessId)
        .limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return filterMap(
        (data || []).map((r: any) => ({
          id: String(r.id),
          label: String(r.name || 'Supplier'),
          secondary: r.phone || r.email || undefined,
        })),
        q
      );
    } catch {
      return [];
    }
  }

  if (target === 'customer') {
    try {
      const { data } = await sb
        .from('customers')
        .select('id, name, phone, email')
        .eq('business_id', businessId)
        .limit(limit);
      return filterMap(
        (data || []).map((r: any) => ({
          id: String(r.id),
          label: String(r.name || 'Customer'),
          secondary: r.phone || r.email || undefined,
        })),
        q
      );
    } catch {
      return [];
    }
  }

  if (target === 'product' || target === 'material') {
    try {
      const { data } = await sb
        .from('products')
        .select('id, name, price, cost_price, category, metadata')
        .eq('business_id', businessId)
        .limit(limit);
      return filterMap(
        (data || []).map((r: any) => ({
          id: String(r.id),
          label: String(r.name || 'Product'),
          secondary:
            r.price != null
              ? `₦${Number(r.price).toLocaleString()}`
              : r.category || undefined,
          meta: {
            price: r.price,
            cost_price: r.cost_price,
          },
        })),
        q
      );
    } catch {
      return [];
    }
  }

  if (target === 'staff') {
    try {
      const { data } = await sb
        .from('staff')
        .select('id, name, full_name, phone, role, email')
        .eq('business_id', businessId)
        .limit(limit);
      return filterMap(
        (data || []).map((r: any) => ({
          id: String(r.id),
          label: String(r.name || r.full_name || 'Staff'),
          secondary: r.role || r.phone || undefined,
        })),
        q
      );
    } catch {
      return [];
    }
  }

  return [];
}

function filterMap(rows: EntityOption[], q: string): EntityOption[] {
  if (!q) return rows;
  return rows.filter(
    (r) =>
      r.label.toLowerCase().includes(q) ||
      (r.secondary && r.secondary.toLowerCase().includes(q))
  );
}
