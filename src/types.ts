/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  image: string; // URL or Base64 string
  available: boolean;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  tableNumber: string | null;
  items: CartItem[];
  totalAmount: number;
  notes: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'cancelled';
}

export type Category = 'Mains' | 'Sides' | 'Drinks' | 'Desserts';
export const CATEGORIES: Category[] = ['Mains', 'Sides', 'Drinks', 'Desserts'];
