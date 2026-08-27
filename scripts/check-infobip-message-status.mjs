/**
 * Diagnostic: query Infobip for outbound message status by messageId.
 * Uses INFOBIP_API_KEY + INFOBIP_BASE_URL from env. Never prints the API key.
 *
 * Usage:
 *   INFOBIP_API_KEY=... INFOBIP_BASE_URL=https://3d44zw.api.infobip.com \
 *     node scripts/check-infobip-message-status.mjs busmo-out-diag-1
 */

const messageId = process.argv[2] || 'busmo-out-diag-1';
const apiKey = process.env.INFOBIP_API_KEY?.trim();
let baseUrl = (process.env.INFOBIP_BASE_URL || process.env.INFOBIP_API_BASE_URL || '').trim();
if (baseUrl && !baseUrl.startsWith('http')) baseUrl = `https://${baseUrl}`;
baseUrl = baseUrl.replace(/\/$/, '');

if (!apiKey || !baseUrl) {
  console.error('Missing INFOBIP_API_KEY or INFOBIP_BASE_URL');
  process.exit(1);
}

const headers = {
  Authorization: `App ${apiKey}`,
  Accept: 'application/json',
};

async function tryGet(path) {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, { headers });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* raw */ }
  return { url, status: res.status, json, text: text.slice(0, 2000) };
}

console.log(JSON.stringify({ event: 'diag_start', messageId, baseUrlHost: new URL(baseUrl).host }));

// Common Infobip log/report endpoints (channel-specific availability varies)
const paths = [
  `/whatsapp/1/logs?messageId=${encodeURIComponent(messageId)}&limit=10`,
  `/whatsapp/1/logs?messageIds=${encodeURIComponent(messageId)}`,
  `/whatsapp/1/reports?messageId=${encodeURIComponent(messageId)}`,
  `/sms/1/logs?messageId=${encodeURIComponent(messageId)}&limit=10`,
  `/sms/3/logs?messageId=${encodeURIComponent(messageId)}&limit=10`,
];

for (const path of paths) {
  try {
    const r = await tryGet(path);
    const summary = {
      event: 'diag_probe',
      path,
      httpStatus: r.status,
    };
    if (r.json?.results) {
      summary.resultsCount = r.json.results.length;
      summary.results = (r.json.results || []).slice(0, 3).map((row) => ({
        messageId: row.messageId,
        toSuffix: String(row.to || row.destination || '').replace(/\D/g, '').slice(-4) || null,
        statusGroup: row.status?.groupName || null,
        statusName: row.status?.name || null,
        statusDescription: row.status?.description || null,
        errorName: row.error?.name || null,
        errorDescription: row.error?.description || null,
        doneAt: row.doneAt || null,
      }));
    } else if (r.json?.requestError) {
      summary.error = r.json.requestError?.serviceException?.text || r.json.requestError;
    } else if (!r.json) {
      summary.rawPreview = r.text.slice(0, 200);
    } else {
      summary.keys = Object.keys(r.json);
    }
    console.log(JSON.stringify(summary));
  } catch (e) {
    console.log(JSON.stringify({ event: 'diag_probe_error', path, error: e.message }));
  }
}

console.log(JSON.stringify({
  event: 'diag_done',
  note: 'HTTP 200 on send only means accepted (often PENDING_ENROUTE). Check Analyze > Logs in Infobip portal for final status.',
}));
