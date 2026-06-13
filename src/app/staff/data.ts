import { Product, Sale, StaffMember } from './types';

export const PRODUCTS: Product[] = [
  { id: '1', name: 'Rice 50kg', price: 25000, stock: 100, category: 'Grains' },
  { id: '2', name: 'Beans 50kg', price: 30000, stock: 50, category: 'Grains' },
  { id: '3', name: 'Oil 5L', price: 8000, stock: 200, category: 'Cooking' },
  { id: '4', name: 'Sugar 50kg', price: 35000, stock: 30, category: 'Foodstuff' },
  { id: '5', name: 'Salt 50kg', price: 5000, stock: 150, category: 'Foodstuff' },
];

export const SALES: Sale[] = [
  { id: '1', productId: '1', quantity: 2, total: 50000, date: '2025-02-28', customerName: 'John' },
  { id: '2', productId: '2', quantity: 1, total: 30000, date: '2025-02-28', customerName: 'Mary' },
];

export const STAFF_MEMBERS: StaffMember[] = [
  { id: '1', name: 'Adamu Ibrahim', role: 'Sales Attendant' },
  { id: '2', name: 'Blessing Okon', role: 'Cashier' },
  { id: '3', name: 'Chinedu Okafor', role: 'Store Manager' },
];

export const CATEGORIES = ['All', 'Grains', 'Cooking', 'Foodstuff', 'Beverages', 'Snacks'];
