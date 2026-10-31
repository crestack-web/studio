/** Pure helpers for Busmo One terminal cart (unit-testable). */

export type TerminalCartLine = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

export function addOrIncrement(
  cart: TerminalCartLine[],
  product: { id: string; name: string; price: number },
  qty = 1
): TerminalCartLine[] {
  const idx = cart.findIndex((l) => l.productId === product.id);
  if (idx >= 0) {
    return cart.map((l, i) =>
      i === idx ? { ...l, quantity: l.quantity + qty } : l
    );
  }
  return [
    ...cart,
    {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: qty,
    },
  ];
}

export function findProductByBarcode<T extends { barcode?: string; sku?: string }>(
  products: T[],
  code: string
): T | undefined {
  const c = String(code || '').trim().toLowerCase();
  if (!c) return undefined;
  return products.find((p) => {
    const b = String(p.barcode || '').trim().toLowerCase();
    const sku = String(p.sku || '').trim().toLowerCase();
    return (b && b === c) || (sku && sku === c);
  });
}

export function cartTotal(cart: TerminalCartLine[]): number {
  return cart.reduce((s, l) => s + l.price * l.quantity, 0);
}
