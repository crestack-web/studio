import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function conversationId(businessId: string, key: string) {
  const k = key === 'team' || !key ? 'team' : `dm:${key}`;
  return `busmo-team:${businessId}:${k}`;
}

async function ensureTeamConversation(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  opts: {
    conversationId: string;
    businessId: string;
    userId: string;
    conversationKey: string;
  }
) {
  const { conversationId, businessId, userId, conversationKey } = opts;
  const title =
    conversationKey === 'team'
      ? 'Team channel'
      : `Staff chat (${conversationKey.slice(0, 8)})`;

  // Already exists?
  const { data: existing } = await supabase
    .from('mo_conversations')
    .select('id')
    .eq('id', conversationId)
    .maybeSingle();
  if (existing?.id) return;

  const row: Record<string, unknown> = {
    id: conversationId,
    business_id: businessId,
    user_id: userId,
    title,
  };

  let { error } = await supabase.from('mo_conversations').insert(row);
  if (error) {
    // Unique race — ok
    if (String(error.code) === '23505' || /duplicate|unique/i.test(error.message || '')) {
      return;
    }
    // Retry minimal columns
    console.warn('[team-chat] mo_conversations insert failed, retry minimal', error.message);
    const { error: e2 } = await supabase.from('mo_conversations').insert({
      id: conversationId,
      business_id: businessId,
      user_id: userId,
    });
    if (e2 && String(e2.code) !== '23505' && !/duplicate|unique/i.test(e2.message || '')) {
      throw e2;
    }
  }
}


async function assertMember(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  user: { id: string; user_metadata?: any; email?: string | null },
  businessId: string
): Promise<{ allowed: boolean; role: 'owner' | 'staff'; name: string }> {
  const meta = user.user_metadata || {};
  const metaBiz = meta.businessId || meta.business_id;
  let allowed = false;
  let role: 'owner' | 'staff' = 'staff';
  let name = String(meta.full_name || meta.name || user.email?.split('@')[0] || 'User');

  if (metaBiz && String(metaBiz) === businessId) {
    allowed = true;
    const r = String(meta.role || '').toLowerCase();
    if (r === 'owner' || r === 'admin' || r === 'business owner') role = 'owner';
  }

  if (!allowed) {
    const { data: business } = await supabase
      .from('businesses')
      .select('id, owner_id, ownerId, user_id, business_name, name')
      .eq('id', businessId)
      .maybeSingle();
    const ownerId =
      business?.owner_id || (business as any)?.ownerId || (business as any)?.user_id || null;
    if (ownerId && String(ownerId) === user.id) {
      allowed = true;
      role = 'owner';
    }
  }

  if (!allowed) {
    const { data: staffRow } = await supabase
      .from('staff')
      .select('id, status, business_id, name, user_id')
      .eq('business_id', businessId)
      .or(`user_id.eq.${user.id},id.eq.${user.id}`)
      .maybeSingle();
    if (staffRow && String(staffRow.status || 'active').toLowerCase() !== 'removed') {
      allowed = true;
      role = 'staff';
      if (staffRow.name) name = String(staffRow.name);
    }
  }

  // Invited staff markers
  if (!allowed && (meta.staffId || meta.staff_id)) {
    if (businessId) {
      allowed = true;
      role = 'staff';
    }
  }

  return { allowed, role, name };
}

/**
 * GET /api/team-chat?businessId=&conversationKey=team|staffId
 * Returns messages for one thread (or all if conversationKey omitted — owner view).
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const businessId = String(searchParams.get('businessId') || '').trim();
    const conversationKey = String(searchParams.get('conversationKey') || '').trim();
    const mode = String(searchParams.get('mode') || 'thread').trim(); // thread | all

    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    }

    const membership = await assertMember(supabase, userData.user, businessId);
    if (!membership.allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (mode === 'all') {
      // Load all busmo-team conversations for this business
      const prefix = `busmo-team:${businessId}:`;
      const { data, error } = await supabase
        .from('mo_messages')
        .select('*')
        .eq('business_id', businessId)
        .like('conversation_id', `${prefix}%`)
        .order('created_at', { ascending: true })
        .limit(800);

      if (error) {
        console.error('[team-chat GET all]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const threads: Record<string, any[]> = { team: [] };
      for (const row of data || []) {
        const cid = String(row.conversation_id || '');
        let key = 'team';
        if (cid.includes(':dm:')) {
          key = cid.split(':dm:')[1] || 'team';
        } else if (cid.endsWith(':team')) {
          key = 'team';
        }
        if (!threads[key]) threads[key] = [];
        threads[key].push(mapRow(row));
      }
      return NextResponse.json({ threads });
    }

    const key = conversationKey || 'team';
    const cid = conversationId(businessId, key);
    const { data, error } = await supabase
      .from('mo_messages')
      .select('*')
      .eq('business_id', businessId)
      .eq('conversation_id', cid)
      .order('created_at', { ascending: true })
      .limit(400);

    if (error) {
      console.error('[team-chat GET]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      conversationKey: key,
      messages: (data || []).map(mapRow),
    });
  } catch (e: any) {
    console.error('[team-chat GET]', e);
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}

function mapRow(row: any) {
  const meta =
    row.metadata && typeof row.metadata === 'object' ? row.metadata : {};
  const senderType =
    meta.senderType ||
    (row.role === 'owner' || row.role === 'assistant' ? 'owner' : 'staff');
  return {
    id: String(row.id),
    senderId: String(meta.senderId || row.user_id || ''),
    senderName: String(meta.senderName || 'User'),
    senderType: senderType === 'owner' ? 'owner' : 'staff',
    text: String(row.content || meta.text || ''),
    timestamp: row.created_at
      ? new Date(row.created_at).getTime()
      : Date.now(),
  };
}

/**
 * POST /api/team-chat
 * body: { businessId, conversationKey, text, senderName? }
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const businessId = String(body.businessId || '').trim();
    const conversationKey = String(body.conversationKey || 'team').trim() || 'team';
    const text = String(body.text || '').trim();
    const clientSenderName = String(body.senderName || '').trim();

    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    }
    if (!text) {
      return NextResponse.json({ error: 'text required' }, { status: 400 });
    }

    const membership = await assertMember(supabase, userData.user, businessId);
    if (!membership.allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const senderType = membership.role;
    const senderName = clientSenderName || membership.name;
    const cid = conversationId(businessId, conversationKey);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // FK: mo_messages.conversation_id → mo_conversations.id
    await ensureTeamConversation(supabase, {
      conversationId: cid,
      businessId,
      userId: userData.user.id,
      conversationKey,
    });

    const row = {
      id,
      conversation_id: cid,
      business_id: businessId,
      user_id: userData.user.id,
      role: senderType === 'owner' ? 'owner' : 'user',
      content: text,
      created_at: now,
      metadata: {
        channel: 'team-chat',
        senderType,
        senderName,
        senderId: userData.user.id,
        conversationKey,
        text,
      },
    };

    const { error } = await supabase.from('mo_messages').insert(row);
    if (error) {
      // Retry without metadata / created_at if schema is stricter
      console.warn('[team-chat POST] insert failed, retry slim', error.message);
      const slim = {
        id,
        conversation_id: cid,
        business_id: businessId,
        user_id: userData.user.id,
        role: senderType === 'owner' ? 'owner' : 'user',
        content: text,
      };
      const { error: e2 } = await supabase.from('mo_messages').insert(slim);
      if (e2) {
        console.error('[team-chat POST]', e2);
        return NextResponse.json({ error: e2.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      ok: true,
      message: {
        id,
        senderId: userData.user.id,
        senderName,
        senderType,
        text,
        timestamp: Date.parse(now),
      },
    });
  } catch (e: any) {
    console.error('[team-chat POST]', e);
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}
