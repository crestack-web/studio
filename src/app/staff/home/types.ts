export type PageId = 'home' | 'sale' | 'inv' | 'hist' | 'atd' | 'msg' | 'settings' | 'products' | 'customers' | 'reports' | 'expenses' | 'suppliers' | 'credit';

export interface Permissions {
  sale: boolean;
  inv: boolean;
  hist: boolean;
  atd: boolean;
  msg: boolean;
  earn: boolean;
  products: boolean;
  customers: boolean;
  reports: boolean;
  expenses: boolean;
  suppliers: boolean;
  credit: boolean;
  refunds: boolean;
  discounts: boolean;
  priceEdit: boolean;
}

export interface StaffUser {
  id: string;
  initials: string;
  name: string;
  firstName?: string;
  role: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  emoji?: string;
}

export interface CartItem extends Product {
  qty: number;
}

export interface SaleRecord {
  id: string;
  productId: string;
  quantity: number;
  total: number;
  date: string;
}

export interface SalesHistoryItem {
  id: string;
  time: string;
  items: string;
  amount: number;
  payment: string;
}
