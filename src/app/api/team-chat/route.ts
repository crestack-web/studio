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
      : `Staff chat (${String(conversationKey).slice(0, 12)})`;

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

  const { error } = await supabase.from('mo_conversations').insert(row);
  if (error) {
    if (String(error.code) === '23505' || /duplicate|unique/i.test(error.message || '')) {
      return;
    }
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

function isOwnerRole(role: unknown): boolean {
  const r = String(role || '').toLowerCase().trim();
  return ['owner', 'admin', 'business owner', 'business_owner'].includes(r);
}

function isStaffRole(role: unknown): boolean {
  const r = String(role || '').toLowerCase().trim();
  return [
    'staff',
    'cashier',
    'manager',
    'store manager',
    'seller',
    'sales attendant',
    'attendant',
    'clerk',
    'supervisor',
    'assistant',
  ].includes(r);
}

/**
 * Authorize owner or staff for a business. Owners often lack matching
 * user_metadata.businessId — resolve via businesses / users tables.
 */
async function assertMember(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  user: { id: string; user_metadata?: any; email?: string | null },
  businessId: string
): Promise<{ allowed: boolean; role: 'owner' | 'staff'; name: string }> {
  const meta = user.user_metadata || {};
  let allowed = false;
  let role: 'owner' | 'staff' = 'staff';
  let name = String(
    meta.full_name || meta.name || meta.display_name || user.email?.split('@')[0] || 'User'
  );

  const metaBiz = String(meta.businessId || meta.business_id || '').trim();
  const metaRole = meta.role || meta.user_role || '';

  // 1) Metadata business match
  if (metaBiz && metaBiz === businessId) {
    allowed = true;
    role = isOwnerRole(metaRole) ? 'owner' : isStaffRole(metaRole) ? 'staff' : 'staff';
    if (isOwnerRole(metaRole)) role = 'owner';
  }

  // 2) Signup convention: business id === user id
  if (!allowed && businessId === user.id) {
    allowed = true;
    role = 'owner';
  }

  // 3) businesses row — owner_id / user_id / id
  if (!allowed) {
    try {
      const { data: business } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .maybeSingle();
      if (business) {
        const ownerCandidates = [
          business.owner_id,
          business.ownerId,
          business.user_id,
          business.userId,
          business.id, // sometimes owner uses same id
        ]
          .filter(Boolean)
          .map(String);
        if (ownerCandidates.includes(user.id)) {
          allowed = true;
          role = 'owner';
        }
      }
    } catch (e) {
      console.warn('[team-chat] business lookup', e);
    }
  }

  // 4) User owns any business whose id matches, or users.business_id matches
  if (!allowed) {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (profile) {
        if (profile.name || profile.full_name || profile.displayName) {
          name = String(profile.name || profile.full_name || profile.displayName || name);
        }
        const ub = String(
          (profile as any).business_id || (profile as any).businessId || ''
        ).trim();
        if (ub && ub === businessId) {
          allowed = true;
          role = isOwnerRole((profile as any).role) || isOwnerRole(metaRole) ? 'owner' : 'staff';
          if (isOwnerRole((profile as any).role) || isOwnerRole(metaRole)) role = 'owner';
        }
        // Owner role on profile without exact business id match — still allow if they own it
        if (!allowed && isOwnerRole((profile as any).role)) {
          // Check ownership via businesses.owner_id = user.id for this businessId
          const { data: owned } = await supabase
            .from('businesses')
            .select('id')
            .eq('id', businessId)
            .or(`owner_id.eq.${user.id},user_id.eq.${user.id}`)
            .maybeSingle();
          if (owned) {
            allowed = true;
            role = 'owner';
          }
        }
      }
    } catch (e) {
      console.warn('[team-chat] users lookup', e);
    }
  }

  // 5) Explicit owner scan: any business owned by this user with matching id
  if (!allowed) {
    try {
      const { data: ownedList } = await supabase
        .from('businesses')
        .select('id, owner_id, user_id')
        .or(`owner_id.eq.${user.id},user_id.eq.${user.id}`)
        .limit(20);
      if ((ownedList || []).some((b: any) => String(b.id) === businessId)) {
        allowed = true;
        role = 'owner';
      }
    } catch (e) {
      console.warn('[team-chat] owned list', e);
    }
  }

  // 6) Staff table
  if (!allowed) {
    try {
      const { data: staffRows } = await supabase
        .from('staff')
        .select('id, status, business_id, name, user_id, email')
        .eq('business_id', businessId)
        .limit(100);
      const match = (staffRows || []).find(
        (r: any) =>
          String(r.user_id || '') === user.id ||
          String(r.id || '') === user.id ||
          (user.email &&
            String(r.email || '').toLowerCase() === String(user.email).toLowerCase())
      );
      if (match && String(match.status || 'active').toLowerCase() !== 'removed') {
        allowed = true;
        role = 'staff';
        if (match.name) name = String(match.name);
      }
    } catch (e) {
      console.warn('[team-chat] staff lookup', e);
    }
  }

  // 7) Invited staff markers in metadata
  if (!allowed && (meta.staffId || meta.staff_id) && businessId) {
    allowed = true;
    role = 'staff';
  }

  // 8) Last resort for owners: metadata role owner + any businessId present
  if (!allowed && isOwnerRole(metaRole) && businessId) {
    allowed = true;
    role = 'owner';
  }

  return { allowed, role, name };
}

function mapRow(row: any) {
  const meta =
    row.metadata && typeof row.metadata === 'object' ? row.metadata : {};
  const senderTypeRaw =
    meta.senderType ||
    (row.role === 'owner' || row.role === 'assistant' ? 'owner' : 'staff');
  return {
    id: String(row.id),
    senderId: String(meta.senderId || row.user_id || ''),
    senderName: String(meta.senderName || 'User'),
    senderType: senderTypeRaw === 'owner' ? 'owner' : 'staff',
    text: String(row.content || meta.text || ''),
    timestamp: row.created_at
      ? new Date(row.created_at).getTime()
      : Date.now(),
  };
}

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
    let businessId = String(searchParams.get('businessId') || '').trim();
    const conversationKey = String(searchParams.get('conversationKey') || '').trim();
    const mode = String(searchParams.get('mode') || 'thread').trim();

    // Resolve businessId if missing (owner)
    if (!businessId) {
      const meta = userData.user.user_metadata || {};
      businessId = String(meta.businessId || meta.business_id || '').trim();
      if (!businessId) {
        const { data: profile } = await supabase
          .from('users')
          .select('business_id, businessId')
          .eq('id', userData.user.id)
          .maybeSingle();
        businessId = String(
          (profile as any)?.business_id || (profile as any)?.businessId || userData.user.id
        ).trim();
      }
    }

    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    }

    const membership = await assertMember(supabase, userData.user, businessId);
    if (!membership.allowed) {
      return NextResponse.json(
        { error: 'Forbidden', detail: 'Not a member of this business' },
        { status: 403 }
      );
    }

    if (mode === 'all') {
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
          key = cid.split(':dm:').pop() || 'team';
        } else if (cid.endsWith(':team')) {
          key = 'team';
        }
        if (!threads[key]) threads[key] = [];
        threads[key].push(mapRow(row));
      }
      return NextResponse.json({ threads, businessId });
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
      businessId,
    });
  } catch (e: any) {
    console.error('[team-chat GET]', e);
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}

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
    let businessId = String(body.businessId || '').trim();
    const conversationKey = String(body.conversationKey || 'team').trim() || 'team';
    const text = String(body.text || '').trim();
    const clientSenderName = String(body.senderName || '').trim();

    if (!businessId) {
      const meta = userData.user.user_metadata || {};
      businessId = String(meta.businessId || meta.business_id || '').trim();
      if (!businessId) {
        const { data: profile } = await supabase
          .from('users')
          .select('business_id, businessId')
          .eq('id', userData.user.id)
          .maybeSingle();
        businessId = String(
          (profile as any)?.business_id || (profile as any)?.businessId || userData.user.id
        ).trim();
      }
    }

    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    }
    if (!text) {
      return NextResponse.json({ error: 'text required' }, { status: 400 });
    }

    const membership = await assertMember(supabase, userData.user, businessId);
    if (!membership.allowed) {
      console.warn('[team-chat POST] forbidden', {
        userId: userData.user.id,
        businessId,
        meta: userData.user.user_metadata,
      });
      return NextResponse.json(
        {
          error: 'Forbidden',
          detail: 'You are not allowed to chat for this business. Re-login or check business link.',
        },
        { status: 403 }
      );
    }

    const senderType = membership.role;
    const senderName = clientSenderName || membership.name;
    const cid = conversationId(businessId, conversationKey);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

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
      businessId,
    });
  } catch (e: any) {
    console.error('[team-chat POST]', e);
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}
