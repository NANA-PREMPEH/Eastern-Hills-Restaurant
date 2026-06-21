/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CarListing {
  id: string;
  name: string;
  type: 'Saloon' | 'SUV' | 'Minivan' | 'Pickup' | 'Executive';
  dailyRate: number;
  seats: number;
  transmission: 'Automatic' | 'Manual';
  features: string[];
  enabled: boolean;
  image?: string;
  emoji: string;
  colorClass: string; // Tailwind bg color for the card accent
}

export const CAR_FLEET: CarListing[] = [
  {
    id: 'car_001',
    name: 'Toyota Corolla',
    type: 'Saloon',
    dailyRate: 350,
    seats: 5,
    transmission: 'Automatic',
    features: ['Air Conditioning', 'Bluetooth', 'USB Charging', 'Fuel Efficient'],
    enabled: true,
    emoji: '🚗',
    colorClass: 'from-blue-600 to-blue-800',
  },
  {
    id: 'car_002',
    name: 'Toyota Land Cruiser',
    type: 'SUV',
    dailyRate: 800,
    seats: 7,
    transmission: 'Automatic',
    features: ['4WD', 'Air Conditioning', 'Leather Seats', 'Navigation'],
    enabled: true,
    emoji: '🚙',
    colorClass: 'from-amber-600 to-amber-800',
  },
  {
    id: 'car_003',
    name: 'Toyota HiAce',
    type: 'Minivan',
    dailyRate: 600,
    seats: 14,
    transmission: 'Manual',
    features: ['Air Conditioning', 'Large Cargo Space', 'Group Travel', 'USB Charging'],
    enabled: true,
    emoji: '🚐',
    colorClass: 'from-emerald-600 to-emerald-800',
  },
  {
    id: 'car_004',
    name: 'Mercedes-Benz E-Class',
    type: 'Executive',
    dailyRate: 1200,
    seats: 5,
    transmission: 'Automatic',
    features: ['Luxury Interior', 'Sunroof', 'Leather Seats', 'Premium Sound', 'Navigation'],
    enabled: true,
    emoji: '🏎️',
    colorClass: 'from-slate-700 to-slate-900',
  },
  {
    id: 'car_005',
    name: 'Hyundai Tucson',
    type: 'SUV',
    dailyRate: 550,
    seats: 5,
    transmission: 'Automatic',
    features: ['Air Conditioning', 'Backup Camera', 'Bluetooth', 'Fuel Efficient'],
    enabled: true,
    emoji: '🚙',
    colorClass: 'from-red-600 to-red-800',
  },
  {
    id: 'car_006',
    name: 'Toyota Hilux',
    type: 'Pickup',
    dailyRate: 500,
    seats: 5,
    transmission: 'Manual',
    features: ['4WD', 'Off-Road Capable', 'Large Load Bed', 'Durable'],
    enabled: true,
    emoji: '🛻',
    colorClass: 'from-orange-600 to-orange-800',
  },
];
