/**
 * Infobip WhatsApp client (server-only).
 * Auth: Authorization: App {INFOBIP_API_KEY}
 * Send text: POST {base}/whatsapp/1/message/text
 */
import 'server-only';

export type SendWhatsAppTextParams = {
  from: string;
  to: string;
  text: string;
  /** Client-supplied message id (Infobip may use for correlation) */
  messageId?: string;
};

export type SendWhatsAppTextResult = {
  ok: boolean;
  messageId?: string;
  status?: string;
  statusName?: string;
  statusDescription?: string;
  raw?: unknown;
  error?: string;
};

function getConfig() {
  const apiKey = process.env.INFOBIP_API_KEY?.trim();
  let baseUrl = (process.env.INFOBIP_BASE_URL || process.env.INFOBIP_API_BASE_URL || '').trim();
  const defaultSender = (
    process.env.INFOBIP_WHATSAPP_SENDER ||
    process.env.INFOBIP_SENDER ||
    ''
  ).trim();

  if (baseUrl && !baseUrl.startsWith('http')) {
    baseUrl = `https://${baseUrl}`;
  }
  baseUrl = baseUrl.replace(/\/$/, '');

  return { apiKey, baseUrl, defaultSender };
}

export function isInfobipConfigured(): boolean {
  const { apiKey, baseUrl } = getConfig();
  return Boolean(apiKey && baseUrl);
}

export function getInfobipDefaultSender(): string | null {
  const { defaultSender } = getConfig();
  return defaultSender || null;
}

export async function sendWhatsAppText(
  params: SendWhatsAppTextParams
): Promise<SendWhatsAppTextResult> {
  const { apiKey, baseUrl } = getConfig();
  if (!apiKey || !baseUrl) {
    return {
      ok: false,
      error: 'Infobip is not configured (INFOBIP_API_KEY / INFOBIP_BASE_URL)',
    };
  }

  const from = normalizePhone(params.from);
  const to = normalizePhone(params.to);
  if (!from || !to || !params.text?.trim()) {
    console.error(
      JSON.stringify({
        event: 'whatsapp_send_failed',
        error: 'from, to, and text are required',
        hasFrom: Boolean(from),
        hasTo: Boolean(to),
        textLen: String(params.text || '').length,
        fromSuffix: from ? from.slice(-4) : null,
        toSuffix: to ? to.slice(-4) : null,
      })
    );
    return { ok: false, error: 'from, to, and text are required' };
  }

  const url = `${baseUrl}/whatsapp/1/message/text`;
  const body: Record<string, unknown> = {
    from,
    to,
    content: { text: params.text.trim().slice(0, 4096) },
  };
  if (params.messageId) body.messageId = params.messageId;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    console.log(
      JSON.stringify({
        event: 'whatsapp_send_started',
        fromSuffix: from.slice(-4),
        toSuffix: to.slice(-4),
        textLen: params.text.length,
      })
    );

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `App ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const raw = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg =
        (raw as any)?.requestError?.serviceException?.text ||
        (raw as any)?.message ||
        `Infobip HTTP ${res.status}`;
      console.error(
        JSON.stringify({
          event: 'whatsapp_send_failed',
          status: res.status,
          error: errMsg,
        })
      );
      return { ok: false, error: errMsg, raw };
    }

    const messageId =
      (raw as any)?.messageId ||
      (raw as any)?.messages?.[0]?.messageId ||
      params.messageId ||
      undefined;

    const statusObj =
      (raw as any)?.status ||
      (raw as any)?.messages?.[0]?.status ||
      null;
    const statusGroup = statusObj?.groupName || null;
    const statusName = statusObj?.name || null;
    const statusDescription = statusObj?.description || null;
    const statusId = statusObj?.id ?? null;

    // HTTP 200 = accepted by Infobip, NOT final WhatsApp delivery
    console.log(
      JSON.stringify({
        event: 'outbound_accepted',
        messageId,
        clientMessageId: params.messageId || null,
        toSuffix: to.slice(-4),
        fromSuffix: from.slice(-4),
        httpStatus: res.status,
        statusGroup,
        statusName,
        statusDescription,
        statusId,
      })
    );
    // Keep legacy event name for existing log filters
    console.log(
      JSON.stringify({
        event: 'whatsapp_send_succeeded',
        messageId,
        toSuffix: to.slice(-4),
        statusGroup,
        statusName,
        note: 'accepted_by_infobip_not_whatsapp_delivery',
      })
    );

    return {
      ok: true,
      messageId,
      status: statusGroup || statusDescription || undefined,
      statusName: statusName || undefined,
      statusDescription: statusDescription || undefined,
      raw,
    };
  } catch (e: any) {
    const error = e?.name === 'AbortError' ? 'Infobip request timeout' : e?.message || 'send failed';
    console.error(JSON.stringify({ event: 'whatsapp_send_failed', error }));
    return { ok: false, error };
  } finally {
    clearTimeout(timeout);
  }
}

export function normalizePhone(input: string): string {
  return String(input || '').replace(/\D/g, '');
}
