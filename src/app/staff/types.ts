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
  costPrice?: number;
  stock: number;
  category?: string;
  sku?: string;
  emoji?: string;
  low?: number;
}

export interface CartItem {
  product: Product;
  qty: number;
}

export interface Sale {
  id: string;
  productId: string;
  quantity: number;
  total: number;
  date: string;
  customerName?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  email?: string;
}

export interface DashboardState {
  activeTab: string;
  products: Product[];
  sales: Sale[];
  loading: boolean;
}
