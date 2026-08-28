/**
 * Shared owner ↔ staff team chat.
 * Client calls /api/team-chat (service role) so RLS cannot block staff/owner.
 */

import { getSupabase } from '@/lib/supabase';

export type ChatSenderType = 'owner' | 'staff';

export interface TeamChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: ChatSenderType;
  text: string;
  timestamp: number;
  imageUrl?: string;
  audioUrl?: string;
}

async function authHeaders(): Promise<HeadersInit> {
  const supabase = getSupabase();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not signed in');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export function normalizeMessage(raw: any): TeamChatMessage {
  return {
    id: String(raw?.id || `m-${raw?.timestamp || Date.now()}`),
    senderId: String(raw?.senderId || raw?.sender_id || ''),
    senderName: String(raw?.senderName || raw?.sender_name || 'User'),
    senderType:
      raw?.senderType === 'owner' || raw?.sender_type === 'owner' ? 'owner' : 'staff',
    text: String(raw?.text || raw?.body || ''),
    timestamp:
      typeof raw?.timestamp === 'number'
        ? raw.timestamp
        : Date.parse(String(raw?.createdAt || raw?.created_at || Date.now())) || Date.now(),
    imageUrl: raw?.imageUrl || raw?.image_url,
    audioUrl: raw?.audioUrl || raw?.audio_url,
  };
}

export async function loadOwnerConversations(
  businessId: string
): Promise<Record<string, { id: string; messages: TeamChatMessage[] }>> {
  const out: Record<string, { id: string; messages: TeamChatMessage[] }> = {
    team: { id: 'team', messages: [] },
  };
  if (!businessId) return out;

  try {
    const headers = await authHeaders();
    const res = await fetch(
      `/api/team-chat?businessId=${encodeURIComponent(businessId)}&mode=all`,
      { headers, cache: 'no-store' }
    );
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('[teamChat] loadOwner failed', json);
      return out;
    }
    const threads = json.threads || {};
    for (const [key, msgs] of Object.entries(threads)) {
      const list = Array.isArray(msgs) ? (msgs as any[]).map(normalizeMessage) : [];
      out[key] = { id: key, messages: list };
    }
    if (!out.team) out.team = { id: 'team', messages: [] };
  } catch (e) {
    console.error('[teamChat] loadOwnerConversations', e);
  }
  return out;
}

export async function loadStaffConversations(
  businessId: string,
  staffId: string
): Promise<{ owner: TeamChatMessage[]; team: TeamChatMessage[] }> {
  const all = await loadOwnerConversations(businessId);
  const ownerMsgs: TeamChatMessage[] = [];
  const seen = new Set<string>();
  const push = (msgs?: TeamChatMessage[]) => {
    if (!msgs) return;
    for (const m of msgs) {
      if (seen.has(m.id)) continue;
      seen.add(m.id);
      ownerMsgs.push(m);
    }
  };
  push(all[staffId]?.messages);
  // Also merge any dm thread that contains this staff id
  for (const [key, thread] of Object.entries(all)) {
    if (key === 'team') continue;
    if (staffId && (key === staffId || key.includes(staffId) || staffId.includes(key))) {
      push(thread.messages);
    }
  }
  ownerMsgs.sort((a, b) => a.timestamp - b.timestamp);
  return {
    owner: ownerMsgs,
    team: all.team?.messages || [],
  };
}

export async function appendConversationMessage(
  businessId: string,
  opts: {
    conversationKey: string;
    message: TeamChatMessage;
    staffIdForDm?: string;
  }
): Promise<TeamChatMessage> {
  const key =
    opts.conversationKey === 'team'
      ? 'team'
      : opts.staffIdForDm || opts.conversationKey;

  const headers = await authHeaders();
  const res = await fetch('/api/team-chat', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      businessId,
      conversationKey: key,
      text: opts.message.text,
      senderName: opts.message.senderName,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || json.message || `Send failed (${res.status})`);
  }
  return normalizeMessage(json.message || opts.message);
}

export function subscribeOwnerConversations(
  businessId: string,
  onData: (convos: Record<string, { id: string; messages: TeamChatMessage[] }>) => void,
  intervalMs = 3000
): () => void {
  let cancelled = false;
  const tick = async () => {
    if (cancelled || !businessId) return;
    try {
      const data = await loadOwnerConversations(businessId);
      if (!cancelled) onData(data);
    } catch (e) {
      console.error('[teamChat] poll failed', e);
    }
  };
  void tick();
  const id = setInterval(tick, intervalMs);
  return () => {
    cancelled = true;
    clearInterval(id);
  };
}
