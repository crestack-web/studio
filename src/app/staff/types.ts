export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category?: string;
  sku?: string;
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
