export type PageId =
  | 'home'
  | 'sale'
  | 'inv'
  | 'hist'
  | 'atd'
  | 'msg'
  | 'settings'
  | 'customers'
  | 'credit'
  | 'returns'
  | 'receive'
  | 'expenses'
  | 'shift'
  | 'expiry'
  | 'production'
  | 'menu'
  | 'transfers';

export interface Permissions {
  sale: boolean;
  inv: boolean;
  hist: boolean;
  atd: boolean;
  msg: boolean;
  earn: boolean;
  customers?: boolean;
  credit?: boolean;
  returns?: boolean;
  receive?: boolean;
  expenses?: boolean;
  shift?: boolean;
  expiry?: boolean;
  production?: boolean;
  menu?: boolean;
  transfers?: boolean;
  [key: string]: boolean | undefined;
}

export interface StaffUser {
  id: string;
  initials: string;
  name: string;
  firstName?: string;
  role: string;
  businessId?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  emoji?: string;
  imageUrl?: string;
  costPrice?: number;
  lowStockThreshold?: number;
  category?: string;
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
  soldByName?: string;
  dateKey?: string;
}
