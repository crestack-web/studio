/**
 * Code 128B barcode → SVG (no external deps).
 * For Busmo internal / manufacturer barcode *display* on labels.
 * Not a claim of GS1 certification.
 */

/** 0–106 Code 128 patterns as bar/space width digits */
const PATTERNS: string[] = [
  '212222','222122','222221','121223','121322','131222','122213','122312','132212','221213',
  '221312','231212','112232','122132','122231','113222','123122','123221','223211','221132',
  '221231','213212','223112','312131','311222','321122','321221','312212','322112','322211',
  '212123','212321','232121','111323','131123','131321','112313','132113','132311','211313',
  '231113','231311','112133','112331','132131','113123','113321','133121','313121','211331',
  '231131','213113','213311','213131','311123','311321','331121','312113','312311','332111',
  '314111','221411','431111','111224','111422','121124','121421','141122','141221','112214',
  '112412','122114','122411','142112','142211','241211','221114','413111','241112','134111',
  '111242','121142','121241','114212','124112','124211','411212','421112','421211','212141',
  '214121','412121','111143','111341','131141','114113','114311','411113','411311','113141',
  '114131','311141','411131','211412','211214','211232','2331112',
];

const START_B = 104;
const STOP = 106;

function charValue(ch: string): number {
  const c = ch.charCodeAt(0);
  if (c < 32 || c > 126) return 0;
  return c - 32;
}

export function encodeCode128B(text: string): number[] {
  const clean = String(text ?? '').replace(/[^\x20-\x7E]/g, '?').slice(0, 64);
  const codes = [START_B];
  for (let i = 0; i < clean.length; i++) codes.push(charValue(clean[i]));
  let sum = START_B;
  for (let i = 1; i < codes.length; i++) sum += codes[i] * i;
  codes.push(sum % 103);
  codes.push(STOP);
  return codes;
}

function escapeXml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function barcodeToSvg(
  text: string,
  opts: { height?: number; moduleWidth?: number; showText?: boolean } = {}
): string {
  const height = opts.height ?? 52;
  const mw = opts.moduleWidth ?? 1.5;
  const showText = opts.showText !== false;
  const codes = encodeCode128B(text);
  let x = 12;
  const parts: string[] = [];
  for (const code of codes) {
    const pat = PATTERNS[code] || PATTERNS[0];
    let bar = true;
    for (const ch of pat) {
      const w = Number(ch) * mw;
      if (bar) {
        parts.push(
          `<rect x="${x.toFixed(2)}" y="2" width="${w.toFixed(2)}" height="${height}" fill="#000"/>`
        );
      }
      x += w;
      bar = !bar;
    }
  }
  x += 12;
  const textBlock = showText
    ? `<text x="${(x / 2).toFixed(1)}" y="${height + 16}" text-anchor="middle" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11" fill="#111">${escapeXml(text)}</text>`
    : '';
  const h = height + (showText ? 22 : 6);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(x)}" height="${h}" viewBox="0 0 ${Math.ceil(x)} ${h}" role="img" aria-label="Barcode">${parts.join('')}${textBlock}</svg>`;
}
