export type PageId = 'home' | 'sale' | 'inv' | 'hist' | 'atd' | 'msg' | 'settings';

export interface Permissions {
  sale: boolean;
  inv: boolean;
  hist: boolean;
  atd: boolean;
  msg: boolean;
  earn: boolean;
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

export interface SaleRecord {
  id: string;
  productId: string;
  quantity: number;
  total: number;
  date: string;
}
