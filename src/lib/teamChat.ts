/**
 * Shared owner ↔ staff team chat via Supabase
 * (businesses/{businessId}/conversations → chat_conversations)
 */

import {
  fetchDocs,
  fetchDoc,
  addDoc,
  updateDoc,
} from '@/lib/supabase-client-data';

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

function asMillis(ts: unknown): number {
  if (typeof ts === 'number' && Number.isFinite(ts)) return ts;
  if (ts && typeof ts === 'object' && 'toMillis' in (ts as object)) {
    try {
      return (ts as { toMillis: () => number }).toMillis();
    } catch {
      /* ignore */
    }
  }
  if (ts && typeof ts === 'object' && 'seconds' in (ts as object)) {
    return Number((ts as { seconds: number }).seconds) * 1000;
  }
  const n = Date.parse(String(ts || ''));
  return Number.isFinite(n) ? n : Date.now();
}

export function normalizeMessage(raw: any): TeamChatMessage {
  return {
    id: String(raw?.id || `m-${raw?.timestamp || Date.now()}`),
    senderId: String(raw?.senderId || raw?.sender_id || ''),
    senderName: String(raw?.senderName || raw?.sender_name || 'User'),
    senderType:
      raw?.senderType === 'owner' || raw?.sender_type === 'owner' ? 'owner' : 'staff',
    text: String(raw?.text || raw?.body || ''),
    timestamp: asMillis(raw?.timestamp || raw?.createdAt || raw?.created_at),
    imageUrl: raw?.imageUrl || raw?.image_url,
    audioUrl: raw?.audioUrl || raw?.audio_url,
  };
}

function convPath(businessId: string) {
  return `businesses/${businessId}/conversations`;
}

function extractMessages(row: any): TeamChatMessage[] {
  let msgs = row?.messages;
  if (!msgs && row?.metadata && typeof row.metadata === 'object') {
    msgs = (row.metadata as any).messages;
  }
  if (!Array.isArray(msgs)) return [];
  return msgs.map(normalizeMessage).sort((a, b) => a.timestamp - b.timestamp);
}

function extractParticipants(row: any): string[] {
  const p = row?.participants ?? row?.metadata?.participants;
  return Array.isArray(p) ? p.map(String) : [];
}

/** Load all owner↔staff + team threads for a business into ChatPanel shape */
export async function loadOwnerConversations(
  businessId: string
): Promise<Record<string, { id: string; messages: TeamChatMessage[] }>> {
  const out: Record<string, { id: string; messages: TeamChatMessage[] }> = {
    team: { id: 'team', messages: [] },
  };
  if (!businessId) return out;

  const rows = await fetchDocs(convPath(businessId));
  for (const row of rows as any[]) {
    const messages = extractMessages(row);
    const type = String(row.type || row.metadata?.type || '');
    if (type === 'team') {
      out.team = { id: 'team', messages };
      continue;
    }
    const participants = extractParticipants(row);
    const staffKey =
      participants.find((p) => p && p !== 'owner') || participants[0] || row.id;
    if (staffKey) {
      out[String(staffKey)] = { id: String(staffKey), messages };
    }
  }
  return out;
}

export async function loadStaffConversations(
  businessId: string,
  staffId: string
): Promise<{ owner: TeamChatMessage[]; team: TeamChatMessage[] }> {
  const all = await loadOwnerConversations(businessId);
  return {
    owner: all[staffId]?.messages || [],
    team: all.team?.messages || [],
  };
}

export async function appendConversationMessage(
  businessId: string,
  opts: {
    conversationKey: string; // 'team' or staffId
    message: TeamChatMessage;
    staffIdForDm?: string;
  }
): Promise<void> {
  const { conversationKey, message } = opts;
  const isTeam = conversationKey === 'team';
  const rows = (await fetchDocs(convPath(businessId))) as any[];

  if (isTeam) {
    const existing = rows.find((r) => String(r.type || r.metadata?.type) === 'team');
    if (!existing) {
      const participants = ['owner', opts.staffIdForDm].filter(Boolean) as string[];
      await addDoc(convPath(businessId), {
        type: 'team',
        participants,
        messages: [message],
        metadata: { type: 'team', participants, messages: [message] },
        updatedAt: new Date().toISOString(),
      });
    } else {
      const prev = extractMessages(existing);
      const messages = [...prev, message];
      const participants = extractParticipants(existing);
      await updateDoc(convPath(businessId), existing.id, {
        type: 'team',
        participants,
        messages,
        metadata: { type: 'team', participants, messages },
        updatedAt: new Date().toISOString(),
      });
    }
    return;
  }

  const staffId = opts.staffIdForDm || conversationKey;
  const existing = rows.find((r) => {
    const type = String(r.type || r.metadata?.type || '');
    if (type === 'team') return false;
    const participants = extractParticipants(r);
    return participants.includes(String(staffId));
  });

  if (!existing) {
    const participants = [staffId, 'owner'];
    await addDoc(convPath(businessId), {
      type: 'owner',
      participants,
      messages: [message],
      metadata: { type: 'owner', participants, messages: [message] },
      updatedAt: new Date().toISOString(),
    });
  } else {
    const prev = extractMessages(existing);
    const messages = [...prev, message];
    const participants = extractParticipants(existing).length
      ? extractParticipants(existing)
      : [staffId, 'owner'];
    await updateDoc(convPath(businessId), existing.id, {
      type: 'owner',
      participants,
      messages,
      metadata: { type: 'owner', participants, messages },
      updatedAt: new Date().toISOString(),
    });
  }
}

/**
 * Polling-based "subscribe" (Supabase client has no Firestore-style snapshot here).
 * Returns an unsubscribe that clears the interval.
 */
export function subscribeOwnerConversations(
  businessId: string,
  onData: (convos: Record<string, { id: string; messages: TeamChatMessage[] }>) => void,
  intervalMs = 4000
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

/** @deprecated firestore arg ignored — kept for call-site compatibility */
export async function loadOwnerConversationsLegacy(
  _firestore: unknown,
  businessId: string
) {
  return loadOwnerConversations(businessId);
}
