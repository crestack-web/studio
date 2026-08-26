/**
 * Client helpers for product mutations via /api/products
 * Uses service-role on the server after ownership check (avoids RLS false negatives).
 */

import { getSupabase } from '@/lib/supabase';

async function authHeader(): Promise<Record<string, string>> {
  const supabase = getSupabase();
  let {
    data: { session },
  } = await supabase.auth.getSession();

  // Refresh if missing / near expiry
  if (!session?.access_token) {
    const { data: refreshed } = await supabase.auth.refreshSession();
    session = refreshed.session;
  }

  const token = session?.access_token;
  if (!token) throw new Error('Not signed in — please log in again');

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
  if (!businessId) throw new Error('Business ID is required');

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

  let json: any = {};
  try {
    json = await res.json();
  } catch {
    json = {};
  }

  if (!res.ok) {
    const parts = [
      json.error,
      json.code ? `(${json.code})` : null,
      json.details,
      json.hint,
    ].filter(Boolean);
    throw new Error(parts.join(' ') || `Save failed (${res.status})`);
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
