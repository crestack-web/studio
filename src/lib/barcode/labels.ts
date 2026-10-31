import { barcodeToSvg } from './code128';

export type LabelOptions = {
  productName: string;
  barcode: string;
  priceLabel?: string;
  businessName?: string;
  widthMm?: number;
  heightMm?: number;
  showName?: boolean;
  showPrice?: boolean;
  showBusiness?: boolean;
  copies?: number;
};

export function buildLabelHtml(opts: LabelOptions): string {
  const showName = opts.showName !== false;
  const showPrice = opts.showPrice !== false;
  const showBusiness = opts.showBusiness === true;
  const copies = Math.max(1, Math.min(50, opts.copies || 1));
  const w = opts.widthMm || 50;
  const h = opts.heightMm || 30;
  const svg = barcodeToSvg(opts.barcode, { height: 48, moduleWidth: 1.4, showText: true });

  const one = `
  <div class="label" style="width:${w}mm;min-height:${h}mm;padding:2mm;box-sizing:border-box;page-break-inside:avoid;border:1px dashed #ccc;margin:2mm;display:inline-block;vertical-align:top;font-family:system-ui,sans-serif;color:#111;text-align:center;">
    ${showBusiness && opts.businessName ? `<div style="font-size:8pt;opacity:.7;margin-bottom:1mm;">${escapeHtml(opts.businessName)}</div>` : ''}
    ${showName ? `<div style="font-size:10pt;font-weight:700;line-height:1.2;margin-bottom:1mm;">${escapeHtml(opts.productName)}</div>` : ''}
    ${showPrice && opts.priceLabel ? `<div style="font-size:11pt;font-weight:700;margin-bottom:1mm;">${escapeHtml(opts.priceLabel)}</div>` : ''}
    <div style="display:flex;justify-content:center;">${svg}</div>
  </div>`;

  const sheet = Array.from({ length: copies }, () => one).join('\n');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Barcode labels</title>
<style>
  @page { margin: 4mm; }
  body { margin: 0; }
  @media print {
    .no-print { display: none !important; }
    .label { border: none !important; }
  }
</style></head><body>
<div class="no-print" style="padding:12px;font-family:system-ui;">
  <button onclick="window.print()">Print labels</button>
  <button onclick="window.close()">Close</button>
</div>
${sheet}
</body></html>`;
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function openLabelPrintWindow(opts: LabelOptions): void {
  if (typeof window === 'undefined') return;
  const html = buildLabelHtml(opts);
  const w = window.open('', '_blank', 'noopener,noreferrer,width=480,height=640');
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}

export function openBulkLabelPrint(labels: LabelOptions[]): void {
  if (typeof window === 'undefined' || !labels.length) return;
  const chunks = labels.map((l) => buildLabelHtml({ ...l, copies: l.copies || 1 }));
  // merge bodies
  const bodies = chunks
    .map((html) => {
      const m = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      return m ? m[1].replace(/<div class="no-print"[\s\S]*?<\/div>/, '') : '';
    })
    .join('\n');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Bulk barcode labels</title>
<style>@page{margin:4mm}body{margin:0}@media print{.no-print{display:none!important}.label{border:none!important}}</style>
</head><body>
<div class="no-print" style="padding:12px;font-family:system-ui;">
<button onclick="window.print()">Print all labels</button>
</div>${bodies}</body></html>`;
  const w = window.open('', '_blank', 'noopener,noreferrer,width=640,height=800');
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}
