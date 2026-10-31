/**
 * Pure barcode helpers — run: npx tsx src/lib/barcode/barcode.test.ts
 */
import { proposeBusmoBarcode, isBusmoInternalBarcode, normalizeBarcode, BUSMO_BARCODE_PREFIX } from './generate';
import { barcodeToSvg, encodeCode128B } from './code128';
import { buildLabelHtml } from './labels';
import { findProductByBarcode, addOrIncrement } from '../terminal/cart-helpers';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(normalizeBarcode('  123  ') === '123', 'normalize trim');
assert(normalizeBarcode('00123') === '00123', 'preserve leading zeros');

const a = proposeBusmoBarcode('biz1');
const b = proposeBusmoBarcode('biz1');
assert(isBusmoInternalBarcode(a), 'BSM prefix a');
assert(isBusmoInternalBarcode(b), 'BSM prefix b');
assert(a.startsWith(BUSMO_BARCODE_PREFIX), 'prefix const');
assert(a !== b, 'random uniqueness candidates differ');
assert(!isBusmoInternalBarcode('5449000000996'), 'EAN not internal');

const codes = encodeCode128B('BSM-TEST1');
assert(codes[0] === 104, 'start B');
assert(codes[codes.length - 1] === 106, 'stop');
const svg = barcodeToSvg('BSM-TEST1');
assert(svg.includes('<svg'), 'svg root');
assert(svg.includes('BSM-TEST1'), 'human text');

const html = buildLabelHtml({
  productName: 'Groundnuts 250g',
  barcode: 'BSM-0001',
  priceLabel: 'NGN1500',
  copies: 2,
});
assert(html.includes('Groundnuts'), 'label name');
assert(html.includes('BSM-0001'), 'label code');
assert((html.match(/class="label"/g) || []).length === 2, 'two copies');

const products = [
  { id: '1', name: 'Water', price: 100, barcode: '6151234567890', sku: 'WAT-1' },
  { id: '2', name: 'Bread', price: 500, barcode: 'BSM-ABC', sku: 'BRD' },
];
assert(findProductByBarcode(products, '6151234567890')?.id === '1', 'mfr barcode');
assert(findProductByBarcode(products, 'BSM-ABC')?.id === '2', 'internal barcode');
assert(findProductByBarcode(products, 'WAT-1')?.id === '1', 'sku fallback');
assert(findProductByBarcode(products, 'nope') === undefined, 'unknown');
let cart = addOrIncrement([], products[0], 1);
cart = addOrIncrement(cart, products[0], 1);
assert(cart[0].quantity === 2, 'repeat scan increments');

console.log('barcode.test.ts OK');
