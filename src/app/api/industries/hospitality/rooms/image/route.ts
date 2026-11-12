import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/app/api/mo-sales/_auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { loadIndustrySession } from '@/lib/industries/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await loadIndustrySession(user.id, user.user_metadata as Record<string, unknown>);
  const businessId = session.businessId;
  if (!businessId) return NextResponse.json({ error: 'No organization' }, { status: 403 });

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Photo required' }, { status: 400 });
  if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Choose an image' }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Photo must be under 5MB' }, { status: 400 });

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${businessId}/rooms/${Date.now()}.${ext}`;
  const admin = getSupabaseAdmin();
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage.from('media').upload(path, bytes, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data } = admin.storage.from('media').getPublicUrl(path);
  return NextResponse.json({ ok: true, url: data.publicUrl });
}
