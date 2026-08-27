/**
 * Infobip Tech Provider / Embedded Signup helpers (server-only).
 * Docs: share-waba POST /whatsapp/1/embedded-signup/registrations/share-waba
 */
import 'server-only';

function getConfig() {
  const apiKey = process.env.INFOBIP_API_KEY?.trim();
  let baseUrl = (process.env.INFOBIP_BASE_URL || process.env.INFOBIP_API_BASE_URL || '').trim();
  if (baseUrl && !baseUrl.startsWith('http')) baseUrl = `https://${baseUrl}`;
  baseUrl = baseUrl.replace(/\/$/, '');
  return { apiKey, baseUrl };
}

/** Public Meta/Infobip config safe to return to authenticated merchants (no secrets). */
export function getEmbeddedSignupPublicConfig(): {
  configured: boolean;
  metaAppId: string | null;
  metaConfigId: string | null;
  infobipSolutionId: string | null;
  graphVersion: string;
} {
  const metaAppId = process.env.NEXT_PUBLIC_META_APP_ID?.trim() || process.env.META_APP_ID?.trim() || null;
  const metaConfigId =
    process.env.NEXT_PUBLIC_META_EMBEDDED_SIGNUP_CONFIG_ID?.trim() ||
    process.env.META_EMBEDDED_SIGNUP_CONFIG_ID?.trim() ||
    null;
  const infobipSolutionId =
    process.env.NEXT_PUBLIC_INFOBIP_SOLUTION_ID?.trim() ||
    process.env.INFOBIP_SOLUTION_ID?.trim() ||
    null;
  const graphVersion = process.env.META_GRAPH_VERSION?.trim() || 'v21.0';
  return {
    configured: Boolean(metaAppId && metaConfigId),
    metaAppId,
    metaConfigId,
    infobipSolutionId,
    graphVersion,
  };
}

/**
 * Share WABA with Infobip after Meta Embedded Signup completes.
 * POST {base}/whatsapp/1/embedded-signup/registrations/share-waba
 * Body: { "businessAccountId": "<WABA_ID>" }
 */
export async function shareWabaWithInfobip(businessAccountId: string): Promise<{
  ok: boolean;
  status?: number;
  error?: string;
  raw?: unknown;
}> {
  const { apiKey, baseUrl } = getConfig();
  const wabaId = String(businessAccountId || '').trim();
  if (!apiKey || !baseUrl) {
    return { ok: false, error: 'Infobip is not configured' };
  }
  if (!wabaId) {
    return { ok: false, error: 'businessAccountId (WABA ID) required' };
  }

  const url = `${baseUrl}/whatsapp/1/embedded-signup/registrations/share-waba`;
  try {
    console.log(
      JSON.stringify({
        event: 'infobip_share_waba_started',
        wabaIdSuffix: wabaId.slice(-6),
      })
    );
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `App ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ businessAccountId: wabaId }),
    });
    const raw = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errMsg =
        (raw as any)?.requestError?.serviceException?.text ||
        (raw as any)?.message ||
        `Infobip HTTP ${res.status}`;
      console.error(
        JSON.stringify({
          event: 'infobip_share_waba_failed',
          status: res.status,
          error: errMsg,
          wabaIdSuffix: wabaId.slice(-6),
        })
      );
      return { ok: false, status: res.status, error: errMsg, raw };
    }
    console.log(
      JSON.stringify({
        event: 'infobip_share_waba_succeeded',
        status: res.status,
        wabaIdSuffix: wabaId.slice(-6),
      })
    );
    return { ok: true, status: res.status, raw };
  } catch (e: any) {
    console.error(
      JSON.stringify({
        event: 'infobip_share_waba_failed',
        error: e?.message || 'share-waba failed',
      })
    );
    return { ok: false, error: e?.message || 'share-waba failed' };
  }
}
