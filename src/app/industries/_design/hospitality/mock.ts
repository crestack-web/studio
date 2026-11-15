import { addDays, nightsBetween, todayISO } from '../format';
import type {
  ActivityItem,
  Booking,
  Expense,
  FolioLine,
  Guest,
  HotelTask,
  HousekeepingRoom,
  Payment,
  RevenuePoint,
  Room,
  RoomServiceOrder,
  StaffMember,
  WebsiteInquiry,
  WebsiteSection,
} from '../types';

const TODAY = todayISO();
const CUR = 'NGN';

/** Saved workspace preferences from the live `settings` record. */
export const orgSettings: Record<string, any> = {};

export const hotel = {
  name: 'The Ashcombe Hotel',
  legalName: 'Ashcombe Hospitality Ltd',
  location: 'Lekki Phase 1, Lagos',
  address: '14 Admiralty Way, Lekki Phase 1, Lagos',
  phone: '+234 812 440 9090',
  email: 'stay@ashcombehotel.com',
  website: 'ashcombehotel.com',
  currency: CUR,
  checkIn: '14:00',
  checkOut: '11:00',
  timezone: 'Africa/Lagos',
  taxRate: 7.5,
  totalRooms: 48,
  ownerName: 'Amara Okonkwo',
  ownerEmail: 'amara@ashcombehotel.com',
  rating: 4.8,
};

/* ── Rooms ────────────────────────────────────────────────────────── */

const ROOM_TYPES = [
  {
    category: 'Standard Queen',
    bed_type: 'Queen bed',
    rate_amount: 65000,
    capacity: 2,
    size_sqm: 26,
    amenities: ['Air conditioning', 'Free Wi-Fi', 'Smart TV', 'Rain shower'],
  },
  {
    category: 'Deluxe King',
    bed_type: 'King bed',
    rate_amount: 95000,
    capacity: 2,
    size_sqm: 34,
    amenities: ['Air conditioning', 'Free Wi-Fi', 'Smart TV', 'Minibar', 'City view'],
  },
  {
    category: 'Executive Suite',
    bed_type: 'King bed + sofa',
    rate_amount: 150000,
    capacity: 3,
    size_sqm: 52,
    amenities: ['Lounge area', 'Free Wi-Fi', 'Smart TV', 'Minibar', 'Ocean view', 'Bathtub'],
  },
  {
    category: 'Presidential Suite',
    bed_type: 'Super king',
    rate_amount: 280000,
    capacity: 4,
    size_sqm: 88,
    amenities: ['Private lounge', 'Butler service', 'Smart TV', 'Wine cooler', 'Ocean view', 'Jacuzzi'],
  },
];

const OCCUPIED_GUESTS = [
  'Adaeze Okafor',
  'Chinedu Balogun',
  'Amina Yusuf',
  'Tunde Adebayo',
  'Grace Mensah',
  'Kwame Asante',
  'Michelle Adeyemi',
  'Yusuf Danladi',
  'Kemi Alabi',
  'Samuel Nnamdi',
  'Ifeoma Obi',
  'Daniel Eze',
  'Aisha Bello',
  'Oluwaseun Ajayi',
  'Chioma Onu',
  'Hassan Lawal',
  'Bola Ogunleye',
  'Rita Ekong',
  'Musa Garba',
  'Tolu Bakare',
  'Nneka Uche',
  'Femi Oladipo',
  'Halima Sani',
  'Peter Okoye',
  'Joy Ebere',
  'Abdul Rahman',
  'Sade Williams',
  'Chuka Mba',
  'Zara Ahmed',
  'Ebuka Umeh',
  'Maryam Isa',
];

const HOUSEKEEPERS = [
  'Blessing Ibe',
  'Ruth Okoro',
  'Joyce Adamu',
  'Halima Bello',
  'Grace Etim',
  'Esther Nwosu',
];

function statusFor(index: number): Room['status'] {
  // 48 rooms → 31 occupied, 11 available, 4 cleaning, 2 out of order
  if (index < 31) return 'occupied';
  if (index < 42) return 'available';
  if (index < 46) return 'cleaning';
  return 'ooo';
}

export const rooms: Room[] = Array.from({ length: 48 }, (_, i) => {
  const floorNum = Math.floor(i / 12) + 1;
  const roomIndex = (i % 12) + 1;
  const typeIdx = i % 9 === 0 ? 2 : i % 5 === 0 ? 1 : i % 17 === 0 ? 3 : 0;
  const type = ROOM_TYPES[typeIdx];
  const status = statusFor(i);
  const guestIdx = i % OCCUPIED_GUESTS.length;
  const room: Room = {
    id: `room-${floorNum}${String(roomIndex).padStart(2, '0')}`,
    room_number: `${floorNum}${String(roomIndex).padStart(2, '0')}`,
    floor: `Floor ${floorNum}`,
    category: type.category,
    bed_type: type.bed_type,
    rate_amount: type.rate_amount,
    capacity: type.capacity,
    size_sqm: type.size_sqm,
    status,
    amenities: type.amenities,
    housekeeper: HOUSEKEEPERS[i % HOUSEKEEPERS.length],
  };
  if (status === 'occupied') {
    room.guest_name = OCCUPIED_GUESTS[guestIdx];
    room.check_out_date = addDays(TODAY, 1 + (i % 4));
  }
  if (status === 'cleaning') {
    room.notes = 'Departure clean · priority';
  }
  if (status === 'ooo') {
    room.notes = i % 2 === 0 ? 'AC compressor replacement' : 'Bathroom re-grouting';
  }
  return room;
});

export const roomTypeStats = ROOM_TYPES.map((type) => {
  const list = rooms.filter((r) => r.category === type.category);
  return {
    ...type,
    total: list.length,
    occupied: list.filter((r) => r.status === 'occupied').length,
    available: list.filter((r) => r.status === 'available').length,
    revenue: list.filter((r) => r.status === 'occupied').length * type.rate_amount,
  };
});

export const occupancy = {
  total: 48,
  occupied: 31,
  available: 11,
  cleaning: 4,
  outOfOrder: 2,
  rate: 65,
  adr: 101_400,
  revpar: 65_910,
};

/* ── Bookings ─────────────────────────────────────────────────────── */

type BookingSeed = {
  guest: string;
  phone: string;
  email: string;
  room: string;
  category: string;
  status: Booking['status'];
  inDays: number;
  outDays: number;
  adults: number;
  children?: number;
  rate: number;
  balance?: number;
  source: Booking['source'];
  requests?: string;
};

const bookingSeeds: BookingSeed[] = [
  { guest: 'Adaeze Okafor', phone: '+234 803 421 8890', email: 'adaeze.okafor@gmail.com', room: '101', category: 'Standard Queen', status: 'checked_in', inDays: -3, outDays: 2, adults: 2, rate: 65000, balance: 45000, source: 'website', requests: 'High floor, quiet room' },
  { guest: 'Chinedu Balogun', phone: '+234 805 118 2043', email: 'chinedu.b@outfit.ng', room: '204', category: 'Deluxe King', status: 'checked_in', inDays: -1, outDays: 2, adults: 1, rate: 95000, balance: 0, source: 'corporate' },
  { guest: 'Amina Yusuf', phone: '+234 810 772 3311', email: 'amina.yusuf@yahoo.com', room: '305', category: 'Deluxe King', status: 'checked_in', inDays: -2, outDays: 0, adults: 2, children: 1, rate: 95000, balance: 38000, source: 'phone', requests: 'Extra bed for child' },
  { guest: 'Tunde Adebayo', phone: '+234 802 909 4471', email: 'tunde.adebayo@zenith.co', room: '102', category: 'Standard Queen', status: 'checked_in', inDays: -4, outDays: 0, adults: 2, rate: 65000, balance: 0, source: 'front_desk' },
  { guest: 'Grace Mensah', phone: '+233 244 118 902', email: 'grace.mensah@gmail.com', room: '210', category: 'Deluxe King', status: 'checked_in', inDays: -1, outDays: 1, adults: 1, rate: 95000, balance: 95000, source: 'ota' },
  { guest: 'Kwame Asante', phone: '+233 201 555 700', email: 'kwame.asante@accra.io', room: '401', category: 'Presidential Suite', status: 'checked_in', inDays: -2, outDays: 2, adults: 2, rate: 280000, balance: 0, source: 'corporate', requests: 'Airport pickup at 18:40' },
  { guest: 'Fatima Bello', phone: '+234 807 331 2255', email: 'fatima.bello@gmail.com', room: '306', category: 'Deluxe King', status: 'confirmed', inDays: 0, outDays: 2, adults: 2, rate: 95000, balance: 95000, source: 'website', requests: 'Late arrival, around 22:00' },
  { guest: 'Emeka Nwosu', phone: '+234 813 882 9004', email: 'emeka.nwosu@nexus.africa', room: '108', category: 'Standard Queen', status: 'confirmed', inDays: 0, outDays: 3, adults: 1, rate: 65000, balance: 195000, source: 'front_desk' },
  { guest: 'Zainab Musa', phone: '+234 806 447 1120', email: 'zainab.musa@gmail.com', room: '203', category: 'Deluxe King', status: 'confirmed', inDays: 0, outDays: 1, adults: 2, rate: 95000, balance: 95000, source: 'phone' },
  { guest: 'David Okon', phone: '+234 809 221 7745', email: 'david.okon@bluewave.co', room: '402', category: 'Presidential Suite', status: 'confirmed', inDays: 0, outDays: 4, adults: 2, rate: 280000, balance: 0, source: 'corporate', requests: 'Vegetarian meals only' },
  { guest: 'Ngozi Eze', phone: '+234 811 665 2288', email: 'ngozi.eze@gmail.com', room: '111', category: 'Standard Queen', status: 'confirmed', inDays: 0, outDays: 2, adults: 1, rate: 65000, balance: 130000, source: 'website' },
  { guest: 'Sarah Mitchell', phone: '+44 7700 900123', email: 'sarah.mitchell@outlook.com', room: '309', category: 'Executive Suite', status: 'confirmed', inDays: 0, outDays: 5, adults: 2, rate: 150000, balance: 750000, source: 'ota', requests: 'Ocean view, anniversary stay' },
  { guest: 'Ibrahim Sule', phone: '+234 803 118 7742', email: 'ibrahim.sule@gmail.com', room: '207', category: 'Deluxe King', status: 'checked_out', inDays: -5, outDays: 0, adults: 1, rate: 95000, balance: 0, source: 'front_desk' },
  { guest: 'Halima Abubakar', phone: '+234 805 990 3317', email: 'halima.ab@gmail.com', room: '303', category: 'Deluxe King', status: 'checked_out', inDays: -6, outDays: 0, adults: 2, rate: 95000, balance: 0, source: 'website' },
  { guest: 'Peter Obi', phone: '+234 802 671 2200', email: 'peter.obi@mail.com', room: '105', category: 'Standard Queen', status: 'cancelled', inDays: 1, outDays: 3, adults: 1, rate: 65000, balance: 0, source: 'ota' },
  { guest: 'Blessing Ade', phone: '+234 810 224 9908', email: 'blessing.ade@gmail.com', room: '212', category: 'Deluxe King', status: 'pending', inDays: 2, outDays: 4, adults: 2, rate: 95000, balance: 0, source: 'website' },
];

export const bookings: Booking[] = bookingSeeds.map((seed, i) => {
  const checkIn = addDays(TODAY, seed.inDays);
  const checkOut = addDays(TODAY, seed.outDays);
  const nights = Math.max(1, nightsBetween(checkIn, checkOut));
  return {
    id: `bk-${1000 + i}`,
    guest_name: seed.guest,
    guest_phone: seed.phone,
    guest_email: seed.email,
    room_number: seed.room,
    category: seed.category,
    status: seed.status,
    check_in_date: checkIn,
    check_out_date: checkOut,
    nights,
    adults: seed.adults,
    children: seed.children || 0,
    rate_per_night: seed.rate,
    amount: seed.rate * nights,
    balance_amount: seed.balance ?? 0,
    deposit_amount: seed.source === 'website' ? seed.rate : 0,
    source: seed.source,
    special_requests: seed.requests,
    created_at: `${addDays(TODAY, seed.inDays === 0 ? 0 : Math.min(seed.inDays - 1, 0))}T09:24:00Z`,
  };
});

export const todaysArrivals = bookings.filter(
  (b) => b.check_in_date === TODAY && ['confirmed', 'pending'].includes(b.status)
);
export const todaysDepartures = bookings.filter(
  (b) => b.check_out_date === TODAY && b.status === 'checked_in'
);
export const inHouse = bookings.filter((b) => b.status === 'checked_in');

export const reservationStats = {
  total: bookings.length,
  arriving: todaysArrivals.length,
  inHouse: inHouse.length,
  departing: todaysDepartures.length,
  cancelled: bookings.filter((b) => b.status === 'cancelled').length,
};

/* ── Guests ───────────────────────────────────────────────────────── */

const guestSeeds: { name: string; phone: string; email: string; country: string; vip?: boolean; notes?: string }[] = [
  { name: 'Adaeze Okafor', phone: '+234 803 421 8890', email: 'adaeze.okafor@gmail.com', country: 'Nigeria', vip: true, notes: 'Prefers high floor and quiet rooms. Anniversary in March.' },
  { name: 'Chinedu Balogun', phone: '+234 805 118 2043', email: 'chinedu.b@outfit.ng', country: 'Nigeria' },
  { name: 'Amina Yusuf', phone: '+234 810 772 3311', email: 'amina.yusuf@yahoo.com', country: 'Nigeria' },
  { name: 'Tunde Adebayo', phone: '+234 802 909 4471', email: 'tunde.adebayo@zenith.co', country: 'Nigeria' },
  { name: 'Grace Mensah', phone: '+233 244 118 902', email: 'grace.mensah@gmail.com', country: 'Ghana' },
  { name: 'Kwame Asante', phone: '+233 201 555 700', email: 'kwame.asante@accra.io', country: 'Ghana', vip: true, notes: 'Corporate account — Nexus Africa. Always books airport pickup.' },
  { name: 'Fatima Bello', phone: '+234 807 331 2255', email: 'fatima.bello@gmail.com', country: 'Nigeria' },
  { name: 'Emeka Nwosu', phone: '+234 813 882 9004', email: 'emeka.nwosu@nexus.africa', country: 'Nigeria' },
  { name: 'Sarah Mitchell', phone: '+44 7700 900123', email: 'sarah.mitchell@outlook.com', country: 'United Kingdom', vip: true, notes: 'Repeat leisure guest. Prefers ocean view suites.' },
  { name: 'Ibrahim Sule', phone: '+234 803 118 7742', email: 'ibrahim.sule@gmail.com', country: 'Nigeria' },
  { name: 'Halima Abubakar', phone: '+234 805 990 3317', email: 'halima.ab@gmail.com', country: 'Nigeria' },
  { name: 'David Okon', phone: '+234 809 221 7745', email: 'david.okon@bluewave.co', country: 'Nigeria' },
];

const spendSeed = [6, 3, 4, 8, 2, 14, 1, 5, 9, 3, 2, 7];

export const guests: Guest[] = guestSeeds.map((seed, i) => ({
  id: `guest-${200 + i}`,
  full_name: seed.name,
  phone: seed.phone,
  email: seed.email,
  id_number: `NIN-${9220 + i * 37}`,
  country: seed.country,
  stays: spendSeed[i],
  total_spend: spendSeed[i] * (65000 + (i % 4) * 30000),
  last_stay: addDays(TODAY, -(i % 9) - 1),
  vip: seed.vip,
  notes: seed.notes,
}));

/* ── Folio ────────────────────────────────────────────────────────── */

export const folioLines: FolioLine[] = [
  { id: 'fl-1', booking_id: 'bk-1000', line_type: 'room', description: 'Room charge · 5 nights', amount: 325000, created_at: `${TODAY}T08:00:00Z` },
  { id: 'fl-2', booking_id: 'bk-1000', line_type: 'food', description: 'Room service · Breakfast x2', amount: 24000, created_at: `${TODAY}T08:45:00Z` },
  { id: 'fl-3', booking_id: 'bk-1000', line_type: 'service', description: 'Airport transfer', amount: 18000, created_at: `${addDays(TODAY, -2)}T16:30:00Z` },
  { id: 'fl-4', booking_id: 'bk-1000', line_type: 'payment', description: 'Deposit · card', amount: -65000, created_at: `${addDays(TODAY, -3)}T14:12:00Z` },
  { id: 'fl-5', booking_id: 'bk-1000', line_type: 'tax', description: 'VAT 7.5%', amount: 24375, created_at: `${TODAY}T08:00:00Z` },
];

/* ── Housekeeping ─────────────────────────────────────────────────── */

const cleaningRooms = rooms.filter((r) => r.status === 'cleaning');
const extraCleaning = rooms.filter((r) => r.status === 'occupied').slice(0, 3);

export const housekeepingRooms: HousekeepingRoom[] = [
  ...cleaningRooms.map((r, i) => ({
    id: `hk-${r.id}`,
    room_number: r.room_number,
    category: r.category,
    stage: (i === 0 ? 'in_progress' : i === 1 ? 'inspected' : 'dirty') as HousekeepingRoom['stage'],
    assignee: HOUSEKEEPERS[i % HOUSEKEEPERS.length],
    priority: (i === 0 ? 'urgent' : i === 1 ? 'high' : 'medium') as HousekeepingRoom['priority'],
    updated_at: `${TODAY}T09:${20 + i * 7}:00Z`,
    note: i === 0 ? 'Guest arriving at 14:00' : undefined,
  })),
  ...extraCleaning.map((r, i) => ({
    id: `hk-${r.id}`,
    room_number: r.room_number,
    category: r.category,
    stage: (i === 0 ? 'dirty' : i === 1 ? 'in_progress' : 'ready') as HousekeepingRoom['stage'],
    assignee: HOUSEKEEPERS[(i + 3) % HOUSEKEEPERS.length],
    priority: (i === 1 ? 'high' : 'low') as HousekeepingRoom['priority'],
    updated_at: `${TODAY}T10:${10 + i * 11}:00Z`,
    note: i === 0 ? 'Turn-down requested' : undefined,
  })),
];

/* ── Room service ─────────────────────────────────────────────────── */

export const roomServiceOrders: RoomServiceOrder[] = [
  {
    id: 'rs-1',
    code: 'RS-2041',
    room_number: '305',
    guest_name: 'Amina Yusuf',
    items: [
      { name: 'Jollof rice & grilled chicken', qty: 2, price: 9500 },
      { name: 'Chapman', qty: 2, price: 3500 },
    ],
    total: 26000,
    status: 'preparing',
    placed_at: `${TODAY}T11:42:00Z`,
    note: 'No pepper on one plate',
  },
  {
    id: 'rs-2',
    code: 'RS-2042',
    room_number: '401',
    guest_name: 'Kwame Asante',
    items: [
      { name: 'Club sandwich', qty: 1, price: 7500 },
      { name: 'Espresso', qty: 2, price: 2500 },
    ],
    total: 12500,
    status: 'on_the_way',
    placed_at: `${TODAY}T11:58:00Z`,
  },
  {
    id: 'rs-3',
    code: 'RS-2043',
    room_number: '210',
    guest_name: 'Grace Mensah',
    items: [
      { name: 'Caesar salad', qty: 1, price: 6500 },
      { name: 'Still water', qty: 1, price: 1500 },
    ],
    total: 8000,
    status: 'new',
    placed_at: `${TODAY}T12:06:00Z`,
  },
  {
    id: 'rs-4',
    code: 'RS-2038',
    room_number: '101',
    guest_name: 'Adaeze Okafor',
    items: [
      { name: 'Continental breakfast', qty: 2, price: 12000 },
    ],
    total: 12000,
    status: 'delivered',
    placed_at: `${TODAY}T07:35:00Z`,
  },
  {
    id: 'rs-5',
    code: 'RS-2039',
    room_number: '102',
    guest_name: 'Tunde Adebayo',
    items: [
      { name: 'Beef suya platter', qty: 1, price: 8500 },
      { name: 'Malt drink', qty: 2, price: 2000 },
    ],
    total: 12500,
    status: 'delivered',
    placed_at: `${TODAY}T08:10:00Z`,
  },
  {
    id: 'rs-6',
    code: 'RS-2040',
    room_number: '204',
    guest_name: 'Chinedu Balogun',
    items: [{ name: 'Egusi soup & pounded yam', qty: 1, price: 11000 }],
    total: 11000,
    status: 'delivered',
    placed_at: `${TODAY}T09:02:00Z`,
  },
];

/* ── Staff ────────────────────────────────────────────────────────── */

export const staff: StaffMember[] = [
  { id: 'st-1', full_name: 'Amara Okonkwo', email: 'amara@ashcombehotel.com', phone: '+234 812 440 9090', role: 'General manager', department: 'Management', shift: 'Morning', status: 'active' },
  { id: 'st-2', full_name: 'Daniel Eze', email: 'daniel@ashcombehotel.com', phone: '+234 803 114 2299', role: 'Front desk supervisor', department: 'Front desk', shift: 'Morning', status: 'active' },
  { id: 'st-3', full_name: 'Nneka Uche', email: 'nneka@ashcombehotel.com', phone: '+234 805 660 7781', role: 'Front desk agent', department: 'Front desk', shift: 'Evening', status: 'active' },
  { id: 'st-4', full_name: 'Blessing Ibe', email: 'blessing@ashcombehotel.com', phone: '+234 809 221 5540', role: 'Housekeeping lead', department: 'Housekeeping', shift: 'Morning', status: 'active', rooms_assigned: 12 },
  { id: 'st-5', full_name: 'Ruth Okoro', email: 'ruth@ashcombehotel.com', phone: '+234 810 998 3321', role: 'Room attendant', department: 'Housekeeping', shift: 'Morning', status: 'active', rooms_assigned: 9 },
  { id: 'st-6', full_name: 'Joyce Adamu', email: 'joyce@ashcombehotel.com', phone: '+234 802 111 4478', role: 'Room attendant', department: 'Housekeeping', shift: 'Evening', status: 'active', rooms_assigned: 8 },
  { id: 'st-7', full_name: 'Chuka Mba', email: 'chuka@ashcombehotel.com', phone: '+234 807 332 9910', role: 'Chef de cuisine', department: 'Food & beverage', shift: 'Morning', status: 'active' },
  { id: 'st-8', full_name: 'Tolu Bakare', email: 'tolu@ashcombehotel.com', phone: '+234 813 776 2204', role: 'Restaurant supervisor', department: 'Food & beverage', shift: 'Evening', status: 'active' },
  { id: 'st-9', full_name: 'Musa Garba', email: 'musa@ashcombehotel.com', phone: '+234 805 991 7723', role: 'Maintenance technician', department: 'Maintenance', shift: 'Off duty', status: 'active' },
  { id: 'st-10', full_name: 'Esther Nwosu', email: 'esther@ashcombehotel.com', phone: '+234 811 220 3377', role: 'Night auditor', department: 'Front desk', shift: 'Night', status: 'invited' },
];

/* ── Tasks ────────────────────────────────────────────────────────── */

export const tasks: HotelTask[] = [
  { id: 'tk-1', title: 'Prepare welcome amenity for Sarah Mitchell', room: '309', assignee: 'Blessing Ibe', priority: 'high', due: 'Today · 13:30', done: false, group: 'today' },
  { id: 'tk-2', title: 'Fix AC in room 4A', room: '412', assignee: 'Musa Garba', priority: 'urgent', due: 'Today · 12:00', done: false, group: 'today' },
  { id: 'tk-3', title: 'Confirm airport pickup for Kwame Asante', room: '401', assignee: 'Daniel Eze', priority: 'high', due: 'Today · 16:00', done: false, group: 'today' },
  { id: 'tk-4', title: 'Restock minibar on floor 3', assignee: 'Ruth Okoro', priority: 'medium', due: 'Today · 17:00', done: false, group: 'today' },
  { id: 'tk-5', title: 'Review tomorrow’s arrivals list', assignee: 'Amara Okonkwo', priority: 'medium', due: 'Today · 18:30', done: false, group: 'today' },
  { id: 'tk-6', title: 'Deep clean presidential suite', room: '402', assignee: 'Joyce Adamu', priority: 'high', due: 'Tomorrow · 10:00', done: false, group: 'upcoming' },
  { id: 'tk-7', title: 'Reorder laundry supplies', assignee: 'Blessing Ibe', priority: 'medium', due: 'Tomorrow · 12:00', done: false, group: 'upcoming' },
  { id: 'tk-8', title: 'Update room rates for December', assignee: 'Amara Okonkwo', priority: 'low', due: 'Fri · 09:00', done: false, group: 'upcoming' },
  { id: 'tk-9', title: 'Night audit — reconcile card settlements', assignee: 'Esther Nwosu', priority: 'high', due: 'Yesterday · 23:00', done: true, group: 'today' },
  { id: 'tk-10', title: 'Replace corridor light bulbs (floor 2)', assignee: 'Musa Garba', priority: 'low', due: 'Yesterday · 15:00', done: true, group: 'today' },
];

/* ── Revenue ──────────────────────────────────────────────────────── */

const revSeed = [
  { rooms: 2_940_000, food: 512_000, other: 181_000, occ: 58, adr: 96_800 },
  { rooms: 3_120_000, food: 548_000, other: 204_000, occ: 61, adr: 98_200 },
  { rooms: 2_860_000, food: 486_000, other: 176_000, occ: 56, adr: 95_400 },
  { rooms: 3_380_000, food: 604_000, other: 221_000, occ: 66, adr: 101_000 },
  { rooms: 3_510_000, food: 631_000, other: 238_000, occ: 69, adr: 103_400 },
  { rooms: 3_260_000, food: 574_000, other: 210_000, occ: 63, adr: 99_600 },
  { rooms: 3_640_000, food: 662_000, other: 247_000, occ: 72, adr: 105_200 },
  { rooms: 3_880_000, food: 706_000, other: 268_000, occ: 76, adr: 108_900 },
  { rooms: 3_720_000, food: 674_000, other: 251_000, occ: 73, adr: 106_400 },
  { rooms: 3_410_000, food: 598_000, other: 224_000, occ: 67, adr: 102_800 },
  { rooms: 3_180_000, food: 552_000, other: 206_000, occ: 62, adr: 98_900 },
  { rooms: 3_540_000, food: 618_000, other: 233_000, occ: 70, adr: 104_600 },
  { rooms: 3_760_000, food: 652_000, other: 244_000, occ: 74, adr: 107_300 },
  { rooms: 3_420_000, food: 612_000, other: 238_000, occ: 65, adr: 101_400 },
];

export const revenueSeries: RevenuePoint[] = revSeed.map((row, i) => ({
  date: addDays(TODAY, i - (revSeed.length - 1)),
  rooms: row.rooms,
  food: row.food,
  other: row.other,
  target: 4_000_000,
  occupancy: row.occ,
  adr: row.adr,
}));

export const revenueSummary = {
  today: 4_270_000,
  monthToDate: 84_610_000,
  lastMonth: 76_240_000,
  adr: 101_400,
  revpar: 65_910,
  target: 90_000_000,
};

export const channelMix = [
  { name: 'Direct website', value: 38, color: 'var(--sol-chart-1)' },
  { name: 'OTA partners', value: 29, color: 'var(--sol-chart-2)' },
  { name: 'Corporate', value: 21, color: 'var(--sol-chart-3)' },
  { name: 'Walk-in', value: 12, color: 'var(--sol-chart-4)' },
];

export const revenueByType = roomTypeStats.map((t) => ({
  label: t.category.replace('Standard ', 'Std ').replace('Presidential ', 'Pres. '),
  revenue: t.revenue,
  rooms: t.total,
}));

/* ── Expenses & payments ──────────────────────────────────────────── */

export const expenses: Expense[] = [
  { id: 'ex-1', vendor: 'Lagos Power Co.', category: 'Utilities', description: 'Diesel & grid electricity — October', amount: 2_840_000, status: 'paid', date: addDays(TODAY, -2), method: 'Bank transfer' },
  { id: 'ex-2', vendor: 'Fresh Foods Market', category: 'Food & beverage', description: 'Kitchen produce restock', amount: 1_260_000, status: 'paid', date: addDays(TODAY, -1), method: 'POS' },
  { id: 'ex-3', vendor: 'CleanPro Supplies', category: 'Housekeeping', description: 'Linen, detergents and toiletries', amount: 685_000, status: 'pending', date: addDays(TODAY, -1), method: 'Bank transfer' },
  { id: 'ex-4', vendor: 'MTN Business', category: 'Utilities', description: 'Internet & phone lines', amount: 320_000, status: 'paid', date: addDays(TODAY, -4), method: 'Card' },
  { id: 'ex-5', vendor: 'CoolAir Engineering', category: 'Maintenance', description: 'AC compressor replacement — room 412', amount: 450_000, status: 'pending', date: TODAY, method: 'Bank transfer' },
  { id: 'ex-6', vendor: 'Ashcombe Staff Payroll', category: 'Payroll', description: 'October salaries — 34 staff', amount: 9_600_000, status: 'paid', date: addDays(TODAY, -6), method: 'Bank transfer' },
  { id: 'ex-7', vendor: 'Bloom & Co.', category: 'Marketing', description: 'Seasonal campaign — December', amount: 780_000, status: 'overdue', date: addDays(TODAY, -12), method: 'Invoice' },
  { id: 'ex-8', vendor: 'Prime Laundry', category: 'Housekeeping', description: 'Weekly laundry service', amount: 240_000, status: 'paid', date: addDays(TODAY, -3), method: 'Cash' },
];

export const expenseSummary = {
  monthToDate: 16_175_000,
  pending: 1_135_000,
  budget: 22_000_000,
  largest: 'Payroll',
};

export const payments: Payment[] = [
  { id: 'pm-1', reference: 'ASH-90412', guest_name: 'Kwame Asante', room_number: '401', amount: 560_000, method: 'transfer', status: 'settled', date: addDays(TODAY, -2) },
  { id: 'pm-2', reference: 'ASH-90413', guest_name: 'Adaeze Okafor', room_number: '101', amount: 65_000, method: 'card', status: 'settled', date: addDays(TODAY, -3) },
  { id: 'pm-3', reference: 'ASH-90414', guest_name: 'Tunde Adebayo', room_number: '102', amount: 260_000, method: 'pos', status: 'settled', date: addDays(TODAY, -4) },
  { id: 'pm-4', reference: 'ASH-90415', guest_name: 'Sarah Mitchell', room_number: '309', amount: 750_000, method: 'card', status: 'pending', date: TODAY },
  { id: 'pm-5', reference: 'ASH-90416', guest_name: 'Emeka Nwosu', room_number: '108', amount: 195_000, method: 'transfer', status: 'pending', date: TODAY },
  { id: 'pm-6', reference: 'ASH-90417', guest_name: 'Grace Mensah', room_number: '210', amount: 95_000, method: 'cash', status: 'settled', date: TODAY },
  { id: 'pm-7', reference: 'ASH-90418', guest_name: 'Ibrahim Sule', room_number: '207', amount: 475_000, method: 'card', status: 'settled', date: addDays(TODAY, -5) },
  { id: 'pm-8', reference: 'ASH-90419', guest_name: 'Peter Obi', room_number: '105', amount: 65_000, method: 'card', status: 'refunded', date: addDays(TODAY, -1) },
];

export const paymentSummary = {
  collectedToday: 990_000,
  outstanding: 1_573_000,
  refunds: 65_000,
  settled: payments.filter((p) => p.status === 'settled').length,
};

/* ── Activity ─────────────────────────────────────────────────────── */

export const activity: ActivityItem[] = [
  { id: 'ac-1', title: 'Grace Mensah checked in', detail: 'Room 210 · 2 nights · Deluxe King', time: '12 min ago', kind: 'check_in' },
  { id: 'ac-2', title: 'Payment received', detail: '₦95,000 cash · Room 210', time: '14 min ago', kind: 'payment' },
  { id: 'ac-3', title: 'New booking from website', detail: 'Ngozi Eze · 2 nights · Room 111', time: '38 min ago', kind: 'booking' },
  { id: 'ac-4', title: 'Housekeeping updated 305', detail: 'Marked inspected by Blessing Ibe', time: '52 min ago', kind: 'housekeeping' },
  { id: 'ac-5', title: 'Maintenance alert', detail: 'AC fault reported in room 412', time: '1h 05m ago', kind: 'alert' },
  { id: 'ac-6', title: 'Tunde Adebayo checked out', detail: 'Room 102 · balance settled', time: '1h 22m ago', kind: 'check_out' },
];

/* ── Website ──────────────────────────────────────────────────────── */

export const websiteSections: WebsiteSection[] = [
  { id: 'hero', name: 'Hero & booking bar', description: 'Headline, hero image and availability search', enabled: true },
  { id: 'rooms', name: 'Rooms & suites', description: 'Room types, photos and nightly rates', enabled: true },
  { id: 'amenities', name: 'Amenities', description: 'Pool, gym, dining and hotel services', enabled: true },
  { id: 'dining', name: 'Dining', description: 'Restaurant menus and opening hours', enabled: false },
  { id: 'reviews', name: 'Guest reviews', description: 'Recent ratings pulled from stays', enabled: true },
  { id: 'contact', name: 'Contact & map', description: 'Phone, email, address and directions', enabled: true },
];

export const websiteInquiries: WebsiteInquiry[] = [
  { id: 'wq-1', name: 'Bisi Adeyemi', email: 'bisi.a@gmail.com', dates: '22–25 Nov', guests: 2, status: 'new', received_at: '35 min ago' },
  { id: 'wq-2', name: 'James Carter', email: 'j.carter@uk.io', dates: '2–8 Dec', guests: 3, status: 'responded', received_at: '2h ago' },
  { id: 'wq-3', name: 'Nadia Hassan', email: 'nadia.h@gmail.com', dates: '18–19 Nov', guests: 1, status: 'converted', received_at: 'Yesterday' },
  { id: 'wq-4', name: 'Femi Ojo', email: 'femi.ojo@corp.ng', dates: '28–30 Nov', guests: 4, status: 'new', received_at: 'Yesterday' },
];

export const websiteStats = {
  published: true,
  visits30d: 4_812,
  inquiries30d: 38,
  directBookings30d: 27,
  conversion: 3.4,
};

export const reviews = [
  { id: 'rv-1', guest: 'Sarah Mitchell', rating: 5, text: 'The suite was immaculate and the team remembered our anniversary. Genuinely world-class service.', date: addDays(TODAY, -3) },
  { id: 'rv-2', guest: 'Kwame Asante', rating: 5, text: 'Fast check-in, reliable airport pickup and the best jollof on the Lekki corridor.', date: addDays(TODAY, -6) },
  { id: 'rv-3', guest: 'Grace Mensah', rating: 4, text: 'Lovely room and breakfast. Waiting a little long for room service at peak time.', date: addDays(TODAY, -9) },
];

/* ── Reports ──────────────────────────────────────────────────────── */

export const reports = [
  { id: 'daily-flash', name: 'Daily flash report', description: 'Occupancy, arrivals, departures and revenue for today.', icon: 'chart', lastRun: 'Today · 06:00', cadence: 'Daily' },
  { id: 'night-audit', name: 'Night audit', description: 'End-of-day reconciliation of rooms, folios and payments.', icon: 'clock', lastRun: 'Today · 00:14', cadence: 'Daily' },
  { id: 'occupancy-adr', name: 'Occupancy & ADR', description: 'Occupancy, average daily rate and RevPAR trends.', icon: 'trend', lastRun: 'Yesterday', cadence: 'Weekly' },
  { id: 'channel-revenue', name: 'Revenue by channel', description: 'Direct, OTA, corporate and walk-in contribution.', icon: 'globe', lastRun: '2 days ago', cadence: 'Weekly' },
  { id: 'guest-ledger', name: 'Guest ledger', description: 'Open balances and folio activity by guest.', icon: 'receipt', lastRun: 'Today · 07:30', cadence: 'Daily' },
  { id: 'housekeeping-perf', name: 'Housekeeping performance', description: 'Turnaround time and rooms cleaned per attendant.', icon: 'sparkles', lastRun: 'Yesterday', cadence: 'Weekly' },
];

/* ── Notifications ────────────────────────────────────────────────── */

export const notifications = [
  { id: 'nt-1', title: '6 guests arriving today', detail: 'First arrival at 13:00 · Fatima Bello', time: '8m', unread: true },
  { id: 'nt-2', title: 'Outstanding balance · Room 305', detail: '₦38,000 due before check-out', time: '22m', unread: true },
  { id: 'nt-3', title: 'Room 412 out of order', detail: 'AC replacement scheduled for today', time: '1h', unread: true },
  { id: 'nt-4', title: 'New website inquiry', detail: 'Bisi Adeyemi · 22–25 Nov · 2 guests', time: '2h', unread: false },
];

/* ── Live hydration ───────────────────────────────────────────────── */

function asArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function replaceArray<T>(target: T[], next: T[]) {
  target.splice(0, target.length, ...next);
}

function day(iso: unknown): string {
  return String(iso || '').slice(0, 10);
}

function recalcHospitalitySummaries() {
  replaceArray(
    roomTypeStats,
    Array.from(new Set(rooms.map((r) => r.category))).map((category) => {
      const template = ROOM_TYPES.find((t) => t.category === category);
      const list = rooms.filter((r) => r.category === category);
      const occupied = list.filter((r) => r.status === 'occupied').length;
      return {
        category,
        bed_type: template?.bed_type || list[0]?.bed_type || '',
        rate_amount: template?.rate_amount || list[0]?.rate_amount || 0,
        capacity: template?.capacity || list[0]?.capacity || 2,
        size_sqm: template?.size_sqm || list[0]?.size_sqm || 0,
        amenities: template?.amenities || list[0]?.amenities || [],
        total: list.length,
        occupied,
        available: list.filter((r) => r.status === 'available').length,
        revenue: occupied * (template?.rate_amount || list[0]?.rate_amount || 0),
      };
    }),
  );

  const occupiedRooms = rooms.filter((r) => r.status === 'occupied');
  const adr = occupiedRooms.length
    ? Math.round(occupiedRooms.reduce((s, r) => s + r.rate_amount, 0) / occupiedRooms.length)
    : 0;
  const rate = rooms.length ? Math.round((occupiedRooms.length / rooms.length) * 100) : 0;
  Object.assign(occupancy, {
    total: rooms.length,
    occupied: occupiedRooms.length,
    available: rooms.filter((r) => r.status === 'available').length,
    cleaning: rooms.filter((r) => r.status === 'cleaning').length,
    outOfOrder: rooms.filter((r) => r.status === 'ooo').length,
    rate,
    adr,
    revpar: Math.round((adr * rate) / 100),
  });

  replaceArray(
    todaysArrivals,
    bookings.filter(
      (b) => b.check_in_date === TODAY && ['confirmed', 'pending'].includes(b.status),
    ),
  );
  replaceArray(
    todaysDepartures,
    bookings.filter((b) => b.check_out_date === TODAY && b.status === 'checked_in'),
  );
  replaceArray(inHouse, bookings.filter((b) => b.status === 'checked_in'));
  Object.assign(reservationStats, {
    total: bookings.length,
    arriving: todaysArrivals.length,
    inHouse: inHouse.length,
    departing: todaysDepartures.length,
    cancelled: bookings.filter((b) => b.status === 'cancelled').length,
  });

  replaceArray(
    revenueByType,
    roomTypeStats.map((t) => ({
      label: t.category.replace('Standard ', 'Std ').replace('Presidential ', 'Pres. '),
      revenue: t.revenue,
      rooms: t.total,
    })),
  );

  const settledToday = payments
    .filter((p) => p.status === 'settled' && p.date === TODAY)
    .reduce((s, p) => s + p.amount, 0);
  const activeBookings = bookings.filter((b) => !['cancelled', 'no_show'].includes(b.status));
  const monthRevenue = activeBookings.reduce((s, b) => s + b.amount, 0);
  Object.assign(revenueSummary, {
    today: settledToday || Math.round(monthRevenue / 30),
    monthToDate: monthRevenue,
    lastMonth: revenueSummary.lastMonth,
    adr,
    revpar: Math.round((adr * rate) / 100),
    target: Math.max(90_000_000, Math.round(monthRevenue * 1.1)),
  });

  Object.assign(expenseSummary, {
    monthToDate: expenses.reduce((s, e) => s + e.amount, 0),
    pending: expenses.filter((e) => e.status !== 'paid').reduce((s, e) => s + e.amount, 0),
    budget: Math.max(22_000_000, Math.round(expenses.reduce((s, e) => s + e.amount, 0) * 1.3)),
    largest: expenses.length
      ? expenses.reduce((a, b) => (b.amount > a.amount ? b : a)).category
      : 'Payroll',
  });

  Object.assign(paymentSummary, {
    collectedToday: settledToday,
    outstanding: bookings.reduce((s, b) => s + b.balance_amount, 0),
    refunds: payments.filter((p) => p.status === 'refunded').reduce((s, p) => s + p.amount, 0),
    settled: payments.filter((p) => p.status === 'settled').length,
  });

  const sourceCount = new Map<string, number>();
  for (const booking of bookings) {
    const key = booking.source || 'front_desk';
    sourceCount.set(key, (sourceCount.get(key) || 0) + 1);
  }
  const sourceTotal = Math.max(1, bookings.length);
  const sourceLabel: Record<string, string> = {
    website: 'Direct website',
    ota: 'OTA partners',
    corporate: 'Corporate',
    front_desk: 'Walk-in',
    phone: 'Phone',
    walk_in: 'Walk-in',
  };
  replaceArray(
    channelMix,
    Array.from(sourceCount.entries()).map(([key, count], i) => ({
      name: sourceLabel[key] || key,
      value: Math.round((count / sourceTotal) * 100),
      color: `var(--sol-chart-${(i % 4) + 1})`,
    })),
  );

  Object.assign(websiteStats, {
    published: websiteSections.some((s) => s.enabled),
    visits30d: websiteStats.visits30d,
    inquiries30d: websiteInquiries.length,
    directBookings30d: bookings.filter((b) => b.source === 'website').length,
    conversion: Math.round(
      (bookings.filter((b) => b.source === 'website').length / Math.max(1, websiteInquiries.length)) * 100,
    ) / 10,
  });
}

export function hydrateHospitality(payload: any): boolean {
  if (!payload) return false;

  const roomById = new Map(asArray(payload.rooms).map((r: any) => [String(r.id), r]));

  const liveRooms: Room[] = asArray(payload.rooms).map((r: any) => ({
    id: String(r.id),
    room_number: String(r.room_number || ''),
    floor: String(r.floor || ''),
    category: String(r.category || 'Standard'),
    bed_type: String(r.bed_type || ''),
    rate_amount: Number(r.rate_amount || 0),
    capacity: Number(r.capacity || 2),
    size_sqm: Number(r.size_sqm || 0),
    status: (['available', 'occupied', 'cleaning', 'inspected', 'ooo', 'reserved'].includes(String(r.status))
      ? r.status
      : 'available') as Room['status'],
    amenities: asArray(r.amenities).map(String),
    guest_name: r.guest_name ? String(r.guest_name) : undefined,
    guest_id: r.guest_id ? String(r.guest_id) : undefined,
    check_out_date: r.check_out_date ? day(r.check_out_date) : undefined,
    housekeeper: r.housekeeper ? String(r.housekeeper) : undefined,
    notes: r.notes ? String(r.notes) : undefined,
  }));

  const liveBookings: Booking[] = asArray(payload.bookings).map((r: any) => {
    const room = roomById.get(String(r.room_id || '')) as any;
    return {
      id: String(r.id),
      guest_id: r.guest_id ? String(r.guest_id) : undefined,
      guest_name: String(r.guest_name || 'Guest'),
      guest_phone: String(r.guest_phone || ''),
      guest_email: String(r.guest_email || ''),
      room_number: String(room?.room_number || r.room_number || ''),
      category: String(room?.category || r.category || ''),
      status: (['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'].includes(
        String(r.status),
      )
        ? r.status
        : 'confirmed') as Booking['status'],
      check_in_date: day(r.check_in_date),
      check_out_date: day(r.check_out_date),
      nights: Number(r.nights || 1),
      adults: Number(r.adults || 1),
      children: Number(r.children || 0),
      rate_per_night: Number(r.rate_per_night || 0),
      amount: Number(r.amount || 0),
      balance_amount: Number(r.balance_amount || 0),
      deposit_amount: Number(r.deposit_amount || 0),
      source: (['front_desk', 'website', 'phone', 'ota', 'corporate', 'walk_in'].includes(String(r.source))
        ? r.source
        : 'front_desk') as Booking['source'],
      special_requests: r.special_requests ? String(r.special_requests) : undefined,
      created_at: String(r.created_at || new Date().toISOString()),
    };
  });

  // Attach the in-house guest to their room for the room grid.
  for (const booking of liveBookings) {
    if (booking.status !== 'checked_in' || !booking.room_number) continue;
    const room = liveRooms.find((r) => r.room_number === booking.room_number);
    if (room) {
      room.guest_name = room.guest_name || booking.guest_name;
      room.check_out_date = room.check_out_date || booking.check_out_date;
    }
  }

  const liveGuests: Guest[] = asArray(payload.guests).map((r: any) => {
    const guestBookings = liveBookings.filter(
      (b) =>
        (r.email && b.guest_email === String(r.email)) ||
        (b.guest_name && b.guest_name === String(r.full_name)),
    );
    return {
      id: String(r.id),
      full_name: String(r.full_name || 'Guest'),
      phone: String(r.phone || ''),
      email: String(r.email || ''),
      id_number: r.id_number ? String(r.id_number) : undefined,
      country: String(r.country || 'Nigeria'),
      stays: guestBookings.length,
      total_spend: guestBookings.reduce((s, b) => s + b.amount, 0),
      last_stay: guestBookings.map((b) => b.check_in_date).sort().pop() || day(r.updated_at),
      vip: Boolean(r.vip),
      notes: r.notes ? String(r.notes) : undefined,
    };
  });

  const liveFolio: FolioLine[] = asArray(payload.folioLines).map((r: any) => {
    const rawType = String(r.line_type || 'room');
    const lineType = (['room', 'food', 'service', 'tax', 'discount', 'payment'].includes(rawType)
      ? rawType
      : rawType === 'charge'
        ? 'room'
        : 'service') as FolioLine['line_type'];
    return {
      id: String(r.id),
      booking_id: String(r.booking_id || ''),
      line_type: lineType,
      description: String(r.description || ''),
      amount: Number(r.amount || 0),
      created_at: String(r.created_at || new Date().toISOString()),
    };
  });

  const liveStaff: StaffMember[] = asArray(payload.staff).map((r: any) => ({
    id: String(r.id),
    full_name: String(r.full_name || 'Staff'),
    email: String(r.email || ''),
    phone: String(r.phone || ''),
    role: String(r.role || 'Front desk agent'),
    department: (['Front desk', 'Housekeeping', 'Food & beverage', 'Management', 'Maintenance'].includes(
      String(r.department),
    )
      ? r.department
      : 'Front desk') as StaffMember['department'],
    shift: (['Morning', 'Evening', 'Night', 'Off duty'].includes(String(r.shift))
      ? r.shift
      : 'Morning') as StaffMember['shift'],
    status: (['active', 'invited', 'suspended'].includes(String(r.status))
      ? r.status
      : 'invited') as StaffMember['status'],
    rooms_assigned: r.rooms_assigned != null ? Number(r.rooms_assigned) : undefined,
  }));

  const liveTasks: HotelTask[] = asArray(payload.tasks).map((r: any) => {
    const meta = r.meta || {};
    return {
      id: String(r.id),
      title: String(r.title || 'Task'),
      room: meta.room ? String(meta.room) : undefined,
      assignee: String(meta.assignee || 'Unassigned'),
      priority: (['low', 'medium', 'high', 'urgent'].includes(String(meta.priority || r.status))
        ? meta.priority || r.status
        : 'medium') as HotelTask['priority'],
      due: String(meta.due || ''),
      done: String(r.status) === 'done' || Boolean(meta.done),
      group: String(meta.group) === 'upcoming' ? 'upcoming' : 'today',
    };
  });

  const liveHousekeeping: HousekeepingRoom[] = asArray(payload.housekeeping).map((r: any) => {
    const meta = r.meta || {};
    return {
      id: String(r.id),
      room_number: String(meta.room_number || r.title || ''),
      category: String(meta.category || ''),
      stage: (['dirty', 'in_progress', 'inspected', 'ready'].includes(String(r.status))
        ? r.status
        : 'dirty') as HousekeepingRoom['stage'],
      assignee: String(meta.assignee || 'Unassigned'),
      priority: (['low', 'medium', 'high', 'urgent'].includes(String(meta.priority))
        ? meta.priority
        : 'medium') as HotelTask['priority'],
      updated_at: String(r.updated_at || r.occurred_at || new Date().toISOString()),
      note: meta.note ? String(meta.note) : undefined,
    };
  });

  const liveRoomService: RoomServiceOrder[] = asArray(payload.roomService).map((r: any) => {
    const meta = r.meta || {};
    return {
      id: String(r.id),
      code: String(meta.code || r.title || `RS-${String(r.id).slice(0, 4)}`),
      room_number: String(meta.room_number || ''),
      guest_name: String(meta.guest_name || ''),
      items: asArray(meta.items),
      total: Number(r.amount || meta.total || 0),
      status: (['new', 'preparing', 'on_the_way', 'delivered', 'cancelled'].includes(String(r.status))
        ? r.status
        : 'new') as RoomServiceOrder['status'],
      placed_at: String(r.occurred_at || r.created_at || new Date().toISOString()),
      note: meta.note ? String(meta.note) : undefined,
    };
  });

  const liveExpenses: Expense[] = asArray(payload.expenses).map((r: any) => {
    const meta = r.meta || {};
    return {
      id: String(r.id),
      vendor: String(meta.vendor || r.title || 'Vendor'),
      category: String(meta.category || 'Operations'),
      description: String(meta.description || r.notes || ''),
      amount: Number(r.amount || 0),
      status: (['paid', 'pending', 'overdue'].includes(String(r.status))
        ? r.status
        : 'pending') as Expense['status'],
      date: day(meta.date || r.occurred_at || r.created_at),
      method: String(meta.method || 'Bank transfer'),
    };
  });

  const livePayments: Payment[] = asArray(payload.payments).map((r: any) => {
    const meta = r.meta || {};
    return {
      id: String(r.id),
      reference: String(meta.reference || `ASH-${String(r.id).slice(0, 5)}`),
      guest_name: String(meta.guest_name || r.title || 'Guest'),
      room_number: String(meta.room_number || ''),
      amount: Number(r.amount || 0),
      method: (['card', 'transfer', 'cash', 'pos'].includes(String(meta.method))
        ? meta.method
        : 'cash') as Payment['method'],
      status: (['settled', 'pending', 'refunded'].includes(String(r.status))
        ? r.status
        : 'settled') as Payment['status'],
      date: day(r.occurred_at || r.created_at),
    };
  });

  const liveWebsiteSections: WebsiteSection[] = asArray(payload.websiteSections).map((r: any) => {
    const meta = r.meta || {};
    return {
      id: String(r.id),
      name: String(meta.name || r.title || ''),
      description: String(meta.description || ''),
      enabled: Boolean(meta.enabled),
    };
  });

  const liveInquiries: WebsiteInquiry[] = asArray(payload.inquiries).map((r: any) => {
    const meta = r.meta || {};
    return {
      id: String(r.id),
      name: String(meta.name || r.title || 'Enquiry'),
      email: String(meta.email || ''),
      dates: String(meta.dates || ''),
      guests: Number(meta.guests || 1),
      status: (['new', 'responded', 'converted'].includes(String(r.status))
        ? r.status
        : 'new') as WebsiteInquiry['status'],
      received_at: String(meta.received_at || r.occurred_at || ''),
    };
  });

  const liveReviews = asArray(payload.reviews).map((r: any) => {
    const meta = r.meta || {};
    return {
      id: String(r.id),
      guest: String(meta.guest || r.title || 'Guest'),
      rating: Number(meta.rating || 5),
      text: String(meta.text || r.notes || ''),
      date: day(meta.date || r.occurred_at || r.created_at),
    };
  });

  const liveActivity: ActivityItem[] = asArray(payload.activity).map((r: any) => {
    const meta = r.meta || {};
    return {
      id: String(r.id),
      title: String(r.title || ''),
      detail: String(meta.detail || r.notes || ''),
      time: String(meta.time || ''),
      kind: (['check_in', 'check_out', 'booking', 'payment', 'housekeeping', 'alert'].includes(
        String(meta.kind),
      )
        ? meta.kind
        : 'alert') as ActivityItem['kind'],
    };
  });

  const settingsRow =
    payload.settings && typeof payload.settings === 'object' ? payload.settings : null;
  const settingsMeta =
    settingsRow && settingsRow.meta && typeof settingsRow.meta === 'object'
      ? (settingsRow.meta as Record<string, any>)
      : null;

  const anyLive =
    liveRooms.length +
      liveBookings.length +
      liveGuests.length +
      liveFolio.length +
      liveStaff.length +
      liveTasks.length +
      liveHousekeeping.length +
      liveExpenses.length +
      livePayments.length +
      liveReviews.length +
      (settingsMeta ? 1 : 0) >
    0;
  if (!anyLive) return false;

  if (settingsMeta) {
    Object.assign(orgSettings, settingsMeta);
    const s = settingsMeta;
    if (s.name) hotel.name = String(s.name);
    if (s.legal) hotel.legalName = String(s.legal);
    if (s.phone) hotel.phone = String(s.phone);
    if (s.email) hotel.email = String(s.email);
    if (s.address) hotel.address = String(s.address);
    if (s.website) hotel.website = String(s.website);
    if (s.checkIn) hotel.checkIn = String(s.checkIn);
    if (s.checkOut) hotel.checkOut = String(s.checkOut);
    if (s.tax != null && s.tax !== '') hotel.taxRate = Number(s.tax);
    if (s.currency) hotel.currency = String(s.currency);
  }

  replaceArray(rooms, liveRooms);
  replaceArray(bookings, liveBookings);
  replaceArray(guests, liveGuests);
  replaceArray(folioLines, liveFolio);
  replaceArray(staff, liveStaff);
  replaceArray(tasks, liveTasks);
  replaceArray(housekeepingRooms, liveHousekeeping);
  replaceArray(roomServiceOrders, liveRoomService);
  replaceArray(expenses, liveExpenses);
  replaceArray(payments, livePayments);
  replaceArray(websiteSections, liveWebsiteSections);
  replaceArray(websiteInquiries, liveInquiries);
  replaceArray(reviews, liveReviews);
  replaceArray(activity, liveActivity);

  recalcHospitalitySummaries();
  return true;
}
