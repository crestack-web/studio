/**
 * Shared owner ↔ staff team chat (Firestore).
 * Staff portal and owner Staff → Chat both use businesses/{id}/conversations.
 */

import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
  onSnapshot,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';

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

function asMillis(ts: any): number {
  if (typeof ts === 'number' && Number.isFinite(ts)) return ts;
  if (ts?.toMillis) return ts.toMillis();
  if (ts?.seconds) return ts.seconds * 1000;
  const n = Date.parse(String(ts || ''));
  return Number.isFinite(n) ? n : Date.now();
}

export function normalizeMessage(raw: any): TeamChatMessage {
  return {
    id: String(raw?.id || `m-${raw?.timestamp || Date.now()}`),
    senderId: String(raw?.senderId || raw?.sender_id || ''),
    senderName: String(raw?.senderName || raw?.sender_name || 'User'),
    senderType: raw?.senderType === 'owner' || raw?.sender_type === 'owner' ? 'owner' : 'staff',
    text: String(raw?.text || raw?.body || ''),
    timestamp: asMillis(raw?.timestamp || raw?.createdAt || raw?.created_at),
    imageUrl: raw?.imageUrl || raw?.image_url,
    audioUrl: raw?.audioUrl || raw?.audio_url,
  };
}

/** Load all owner↔staff + team threads for a business into ChatPanel shape */
export async function loadOwnerConversations(
  firestore: Firestore,
  businessId: string
): Promise<Record<string, { id: string; messages: TeamChatMessage[] }>> {
  const out: Record<string, { id: string; messages: TeamChatMessage[] }> = {
    team: { id: 'team', messages: [] },
  };
  if (!businessId) return out;

  const snap = await getDocs(collection(firestore, 'businesses', businessId, 'conversations'));
  snap.forEach((d) => {
    const data = d.data() || {};
    const messages = Array.isArray(data.messages)
      ? data.messages.map(normalizeMessage).sort((a, b) => a.timestamp - b.timestamp)
      : [];
    const type = String(data.type || '');
    if (type === 'team') {
      out.team = { id: 'team', messages };
      return;
    }
    // DM with staff: key by staff participant id (not owner)
    const participants: string[] = Array.isArray(data.participants) ? data.participants.map(String) : [];
    const staffKey =
      participants.find((p) => p && p !== 'owner' && p !== data.ownerId) ||
      participants[0] ||
      d.id;
    if (staffKey) {
      out[staffKey] = { id: staffKey, messages };
    }
  });
  return out;
}

export async function appendConversationMessage(
  firestore: Firestore,
  businessId: string,
  opts: {
    conversationKey: string; // 'team' or staffId
    message: TeamChatMessage;
    staffIdForDm?: string;
  }
): Promise<void> {
  const { conversationKey, message } = opts;
  const isTeam = conversationKey === 'team';

  if (isTeam) {
    const q = query(
      collection(firestore, 'businesses', businessId, 'conversations'),
      where('type', '==', 'team')
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      await addDoc(collection(firestore, 'businesses', businessId, 'conversations'), {
        type: 'team',
        participants: ['owner', opts.staffIdForDm].filter(Boolean),
        messages: [message],
        updatedAt: Timestamp.now(),
      });
    } else {
      const ref = snap.docs[0].ref;
      const existing = snap.docs[0].data().messages || [];
      await updateDoc(ref, {
        messages: [...existing, message],
        updatedAt: Timestamp.now(),
      });
    }
    return;
  }

  // Owner ↔ staff DM
  const staffId = opts.staffIdForDm || conversationKey;
  const q = query(
    collection(firestore, 'businesses', businessId, 'conversations'),
    where('type', '==', 'owner'),
    where('participants', 'array-contains', staffId)
  );
  const snap = await getDocs(q);
  if (snap.empty) {
    await addDoc(collection(firestore, 'businesses', businessId, 'conversations'), {
      type: 'owner',
      participants: [staffId, 'owner'],
      messages: [message],
      updatedAt: Timestamp.now(),
    });
  } else {
    const ref = snap.docs[0].ref;
    const existing = snap.docs[0].data().messages || [];
    await updateDoc(ref, {
      messages: [...existing, message],
      updatedAt: Timestamp.now(),
    });
  }
}

/** Live subscribe to all conversations for a business */
export function subscribeOwnerConversations(
  firestore: Firestore,
  businessId: string,
  onData: (convos: Record<string, { id: string; messages: TeamChatMessage[] }>) => void
): Unsubscribe {
  return onSnapshot(
    collection(firestore, 'businesses', businessId, 'conversations'),
    (snap) => {
      const out: Record<string, { id: string; messages: TeamChatMessage[] }> = {
        team: { id: 'team', messages: [] },
      };
      snap.forEach((d) => {
        const data = d.data() || {};
        const messages = Array.isArray(data.messages)
          ? data.messages.map(normalizeMessage).sort((a, b) => a.timestamp - b.timestamp)
          : [];
        if (String(data.type) === 'team') {
          out.team = { id: 'team', messages };
          return;
        }
        const participants: string[] = Array.isArray(data.participants)
          ? data.participants.map(String)
          : [];
        const staffKey =
          participants.find((p) => p && p !== 'owner') || participants[0] || d.id;
        if (staffKey) out[staffKey] = { id: staffKey, messages };
      });
      onData(out);
    },
    (err) => console.error('[teamChat] subscribe', err)
  );
}
