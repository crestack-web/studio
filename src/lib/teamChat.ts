/**
 * Shared owner ↔ staff team chat via Supabase.
 * Primary store: chat_conversations (metadata-first for schema flexibility).
 * Fallback: chat_messages rows when conversations table rejects writes.
 */

import { getSupabase } from '@/lib/supabase';
import {
  fetchDocs,
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

function extractType(row: any): string {
  return String(row?.type || row?.metadata?.type || '');
}

async function loadFlatMessages(
  businessId: string
): Promise<Record<string, { id: string; messages: TeamChatMessage[] }>> {
  const out: Record<string, { id: string; messages: TeamChatMessage[] }> = {
    team: { id: 'team', messages: [] },
  };
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: true })
      .limit(500);
    if (error || !data) return out;
    for (const row of data) {
      const meta = (row.metadata && typeof row.metadata === 'object' ? row.metadata : {}) as any;
      const key = String(meta.conversationKey || row.conversation_id || 'team');
      const msg = normalizeMessage({
        id: row.id,
        senderId: row.sender_id || meta.senderId,
        senderName: row.sender_name || meta.senderName,
        senderType: row.sender_type || meta.senderType,
        text: row.body || row.text || meta.text,
        timestamp: row.created_at,
        imageUrl: meta.imageUrl,
        audioUrl: meta.audioUrl,
      });
      if (!out[key]) out[key] = { id: key, messages: [] };
      out[key].messages.push(msg);
    }
  } catch (e) {
    console.warn('[teamChat] flat messages load failed', e);
  }
  return out;
}

export async function loadOwnerConversations(
  businessId: string
): Promise<Record<string, { id: string; messages: TeamChatMessage[] }>> {
  const out: Record<string, { id: string; messages: TeamChatMessage[] }> = {
    team: { id: 'team', messages: [] },
  };
  if (!businessId) return out;

  try {
    const rows = await fetchDocs(convPath(businessId));
    for (const row of rows as any[]) {
      const messages = extractMessages(row);
      const type = extractType(row);
      if (type === 'team') {
        out.team = { id: 'team', messages };
        continue;
      }
      const participants = extractParticipants(row);
      const staffKey =
        participants.find((p) => p && p !== 'owner') || participants[0] || row.id;
      if (staffKey) out[String(staffKey)] = { id: String(staffKey), messages };
    }
  } catch (e) {
    console.warn('[teamChat] conversations load failed', e);
  }

  // Merge flat chat_messages (fallback / hybrid)
  try {
    const flat = await loadFlatMessages(businessId);
    for (const [key, thread] of Object.entries(flat)) {
      if (!out[key] || out[key].messages.length === 0) {
        out[key] = thread;
      } else {
        const ids = new Set(out[key].messages.map((m) => m.id));
        for (const m of thread.messages) {
          if (!ids.has(m.id)) out[key].messages.push(m);
        }
        out[key].messages.sort((a, b) => a.timestamp - b.timestamp);
      }
    }
  } catch {
    /* optional */
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

async function appendFlatMessage(
  businessId: string,
  conversationKey: string,
  message: TeamChatMessage
) {
  const supabase = getSupabase();
  const id = message.id || crypto.randomUUID();
  const { error } = await supabase.from('chat_messages').insert({
    id,
    business_id: businessId,
    conversation_id: conversationKey,
    sender_id: message.senderId,
    sender_name: message.senderName,
    sender_type: message.senderType,
    body: message.text,
    text: message.text,
    created_at: new Date(message.timestamp || Date.now()).toISOString(),
    metadata: {
      conversationKey,
      senderId: message.senderId,
      senderName: message.senderName,
      senderType: message.senderType,
      text: message.text,
      imageUrl: message.imageUrl,
      audioUrl: message.audioUrl,
    },
  });
  if (error) throw error;
}

export async function appendConversationMessage(
  businessId: string,
  opts: {
    conversationKey: string;
    message: TeamChatMessage;
    staffIdForDm?: string;
  }
): Promise<void> {
  const { conversationKey, message } = opts;
  const isTeam = conversationKey === 'team';
  const staffId = opts.staffIdForDm || (!isTeam ? conversationKey : undefined);

  // Always write flat message (works even if conversations table is limited)
  try {
    await appendFlatMessage(
      businessId,
      isTeam ? 'team' : String(staffId || conversationKey),
      message
    );
  } catch (e) {
    console.warn('[teamChat] flat message insert failed', e);
  }

  // Best-effort conversation document (thread mirror)
  try {
    const rows = (await fetchDocs(convPath(businessId))) as any[];
    if (isTeam) {
      const existing = rows.find((r) => extractType(r) === 'team');
      const participants = ['owner', staffId].filter(Boolean) as string[];
      if (!existing) {
        const messages = [message];
        await addDoc(convPath(businessId), {
          metadata: { type: 'team', participants, messages },
          updatedAt: new Date().toISOString(),
        });
      } else {
        const messages = [...extractMessages(existing), message];
        await updateDoc(convPath(businessId), existing.id, {
          metadata: {
            type: 'team',
            participants: extractParticipants(existing).length
              ? extractParticipants(existing)
              : participants,
            messages,
          },
          updatedAt: new Date().toISOString(),
        });
      }
      return;
    }

    const sid = String(staffId || conversationKey);
    const existing = rows.find((r) => {
      if (extractType(r) === 'team') return false;
      return extractParticipants(r).includes(sid);
    });
    const participants = [sid, 'owner'];
    if (!existing) {
      await addDoc(convPath(businessId), {
        metadata: { type: 'owner', participants, messages: [message] },
        updatedAt: new Date().toISOString(),
      });
    } else {
      const messages = [...extractMessages(existing), message];
      await updateDoc(convPath(businessId), existing.id, {
        metadata: {
          type: 'owner',
          participants: extractParticipants(existing).length
            ? extractParticipants(existing)
            : participants,
          messages,
        },
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (e) {
    console.warn('[teamChat] conversation doc write failed (flat message still saved)', e);
  }
}

export function subscribeOwnerConversations(
  businessId: string,
  onData: (convos: Record<string, { id: string; messages: TeamChatMessage[] }>) => void,
  intervalMs = 3500
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
