/**
 * Client helpers for product mutations via /api/products
 * (service-role write after ownership check — avoids RLS false negatives).
 */

import { getSupabase } from '@/lib/supabase';

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await getSupabase().auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not signed in');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function saveProductViaApi(
  businessId: string,
  product: Record<string, unknown>,
  options?: { mode?: 'insert' | 'update'; productId?: string }
): Promise<string> {
  const headers = await authHeader();
  const res = await fetch('/api/products', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      businessId,
      product,
      mode: options?.mode || 'insert',
      productId: options?.productId,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `Save failed (${res.status})`);
  }
  return String(json.id || product.id || '');
}

export async function deleteProductViaApi(
  businessId: string,
  productId: string
): Promise<void> {
  const headers = await authHeader();
  const res = await fetch('/api/products', {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ businessId, productId }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `Delete failed (${res.status})`);
  }
}
