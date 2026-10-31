import { addOrIncrement, findProductByBarcode, cartTotal } from './cart-helpers';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const products = [
  { id: '1', name: 'Water', price: 100, barcode: '6151234567890', sku: 'WAT-1' },
  { id: '2', name: 'Bread', price: 500, barcode: '615999', sku: 'BRD' },
];

let cart = addOrIncrement([], products[0], 1);
assert(cart.length === 1 && cart[0].quantity === 1, 'add once');
cart = addOrIncrement(cart, products[0], 1);
assert(cart[0].quantity === 2, 'same barcode increases qty');
cart = addOrIncrement(cart, products[1], 1);
assert(cart.length === 2, 'second product');
assert(cartTotal(cart) === 100 * 2 + 500, 'total');
assert(findProductByBarcode(products, '6151234567890')?.id === '1', 'lookup barcode');
assert(findProductByBarcode(products, 'BRD')?.id === '2', 'lookup sku');
assert(findProductByBarcode(products, 'nope') === undefined, 'unknown barcode');

console.log('cart-helpers tests OK');
