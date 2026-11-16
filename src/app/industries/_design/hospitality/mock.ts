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

/** Saved workspace preferences from the live `settings` record. */
export const orgSettings: Record<string, any> = {};

export const hotel = {
  name: 'Your hotel',
  legalName: '',
  location: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  currency: 'NGN',
  checkIn: '14:00',
  checkOut: '11:00',
  timezone: 'Africa/Lagos',
  taxRate: 7.5,
  totalRooms: 0,
  ownerName: '',
  ownerEmail: '',
  rating: 0,
};

/* Live arrays start empty — hydrateHospitality fills them from /api/industries/hospitality/workspace */
export const rooms: Room[] = [];
export const roomTypeStats: any[] = [];
export const occupancy = {
  total: 0,
  occupied: 0,
  available: 0,
  cleaning: 0,
  outOfOrder: 0,
  rate: 0,
  adr: 0,
  revpar: 0,
};
export const bookings: Booking[] = [];
export const todaysArrivals: Booking[] = [];
export const todaysDepartures: Booking[] = [];
export const inHouse: Booking[] = [];
export const reservationStats = {
  total: 0,
  arriving: 0,
  inHouse: 0,
  departing: 0,
  cancelled: 0,
};
export const guests: Guest[] = [];
export const folioLines: FolioLine[] = [];
export const housekeepingRooms: HousekeepingRoom[] = [];
export const roomServiceOrders: RoomServiceOrder[] = [];
export const staff: StaffMember[] = [];
export const tasks: HotelTask[] = [];
export const expenses: Expense[] = [];
export const payments: Payment[] = [];
export const websiteSections: WebsiteSection[] = [];
export const websiteInquiries: WebsiteInquiry[] = [];
export const reviews: any[] = [];
export const activity: ActivityItem[] = [];
export const revenueSeries: RevenuePoint[] = [];

export const notifications = [
  { id: 'hn-1', title: '3 arrivals still expected', detail: 'Before 6:00 pm today', time: '12m', unread: true },
  { id: 'hn-2', title: 'Room 204 is still with housekeeping', detail: 'Turnover has not been marked ready', time: '28m', unread: true },
  { id: 'hn-3', title: '₦126,000 still unpaid', detail: '4 open guest folios', time: '1h', unread: false },
];

export const revenueSummary = {
  today: 612000,
  monthToDate: 8420000,
  target: 12000000,
  adr: 34000,
  revpar: 25500,
};

export const revenueByType = [
  { label: 'Standard', revenue: 4200000 },
  { label: 'Deluxe', revenue: 2860000 },
  { label: 'Suite', revenue: 980000 },
  { label: 'Family', revenue: 380000 },
];

export const channelMix = [
  { name: 'Direct', value: 38, color: 'var(--sol-chart-1)' },
  { name: 'Walk-in', value: 27, color: 'var(--sol-chart-2)' },
  { name: 'Phone', value: 21, color: 'var(--sol-chart-3)' },
  { name: 'Agents', value: 14, color: 'var(--sol-chart-4)' },
];

export const expenseSummary = {
  monthToDate: 2140000,
  budget: 3200000,
  pending: 186000,
  largest: 'Housekeeping',
};

export const paymentSummary = {
  collectedToday: 486000,
  outstanding: 126000,
  refunds: 15000,
  settled: 22,
};

export const reports = [
  { id: 'daily-flash', name: 'Daily flash', description: 'Occupancy, revenue and arrivals for the day.', cadence: 'Daily', lastRun: '06:02', icon: 'chart' as const },
  { id: 'night-audit', name: 'Night audit', description: 'Room charges, payments and open folios.', cadence: 'Daily', lastRun: '00:14', icon: 'receipt' as const },
  { id: 'manager', name: 'Manager report', description: 'Week-to-date performance against target.', cadence: 'Weekly', lastRun: 'Mon', icon: 'trend' as const },
  { id: 'channels', name: 'Channel mix', description: 'Where bookings came from this month.', cadence: 'Monthly', lastRun: '1 Nov', icon: 'globe' as const },
];

export const websiteStats = {
  published: true,
  visits30d: 1840,
  directBookings30d: 46,
  inquiries30d: 19,
  conversion: 2.5,
};

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
  const categories = Array.from(new Set(rooms.map((r) => r.category)));
  replaceArray(
    roomTypeStats,
    categories.map((category) => {
      const list = rooms.filter((r) => r.category === category);
      const occupied = list.filter((r) => r.status === 'occupied').length;
      const rate = list[0]?.rate_amount || 0;
      return {
        category,
        bed_type: list[0]?.bed_type || '',
        rate_amount: rate,
        capacity: list[0]?.capacity || 2,
        size_sqm: list[0]?.size_sqm || 0,
        amenities: list[0]?.amenities || [],
        total: list.length,
        occupied,
        available: list.filter((r) => r.status === 'available').length,
        revenue: occupied * rate,
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
}

export function hydrateHospitality(payload: any): boolean {
  if (!payload) return false;
  const isLive = Boolean(payload.ok || payload.businessId);

  const guestById = new Map(asArray(payload.guests).map((g: any) => [String(g.id), g]));
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
    const guest = r.guest_id ? guestById.get(String(r.guest_id)) : undefined;
    const guestName =
      String(r.guest_name || '').trim() ||
      (guest ? String(guest.full_name || '').trim() : '') ||
      'Guest';
    return {
      id: String(r.id),
      guest_id: r.guest_id ? String(r.guest_id) : undefined,
      guest_name: guestName,
      guest_phone: String(r.guest_phone || guest?.phone || ''),
      guest_email: String(r.guest_email || guest?.email || ''),
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
        (r.id && b.guest_id === String(r.id)) ||
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
      stays: guestBookings.length || Number(r.stays || 0),
      total_spend:
        guestBookings.reduce((s, b) => s + b.amount, 0) || Number(r.total_spend || 0),
      last_stay:
        guestBookings.map((b) => b.check_in_date).filter(Boolean).sort().pop() || day(r.updated_at),
      vip: Boolean(r.vip),
      notes: r.notes ? String(r.notes) : undefined,
    };
  });

  const liveFolio: FolioLine[] = asArray(payload.folioLines).map((r: any) => {
    const rawType = String(r.line_type || 'room');
    const lineType = (
      ['room', 'food', 'service', 'tax', 'discount', 'payment'].includes(rawType) ? rawType : 'room'
    ) as FolioLine['line_type'];
    return {
      id: String(r.id),
      booking_id: String(r.booking_id || ''),
      line_type: lineType,
      description: String(r.description || ''),
      amount: Number(r.amount || 0),
      created_at: String(r.created_at || new Date().toISOString()),
    };
  });

  const liveStaff: StaffMember[] = asArray(payload.staff).map((r: any) => {
    const deptRaw = String(r.department || 'Front desk');
    const department = (
      ['Front desk', 'Housekeeping', 'Food & beverage', 'Management', 'Maintenance'].includes(deptRaw)
        ? deptRaw
        : 'Front desk'
    ) as StaffMember['department'];
    const shiftRaw = String(r.shift || 'Morning');
    const shift = (
      ['Morning', 'Evening', 'Night', 'Off duty'].includes(shiftRaw) ? shiftRaw : 'Morning'
    ) as StaffMember['shift'];
    const statusRaw = String(r.status || 'active');
    const status = (
      ['active', 'invited', 'suspended'].includes(statusRaw) ? statusRaw : 'active'
    ) as StaffMember['status'];
    return {
      id: String(r.id),
      full_name: String(r.full_name || ''),
      email: String(r.email || ''),
      phone: String(r.phone || ''),
      role: String(r.role || 'Staff'),
      department,
      shift,
      status,
      rooms_assigned: r.rooms_assigned != null ? Number(r.rooms_assigned) : undefined,
    };
  });

  const liveTasks: HotelTask[] = asArray(payload.tasks).map((r: any) => {
    const meta = r.meta || {};
    return {
      id: String(r.id),
      title: String(r.title || ''),
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
        : 'medium') as HousekeepingRoom['priority'],
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
      reference: String(meta.reference || `PAY-${String(r.id).slice(0, 5)}`),
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
      received_at: String(meta.received_at || r.occurred_at || r.created_at || ''),
    };
  });

  const liveReviews = asArray(payload.reviews).map((r: any) => {
    const meta = r.meta || {};
    return {
      id: String(r.id),
      guest: String(meta.guest_name || meta.guest || r.title || 'Guest'),
      rating: Number(meta.rating || r.amount || 0),
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

  // Always replace — empty production data clears any residual seed
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

  const settingsRow =
    payload.settings && typeof payload.settings === 'object'
      ? (payload.settings as Record<string, any>)
      : {};
  const settingsMeta =
    settingsRow.meta && typeof settingsRow.meta === 'object'
      ? (settingsRow.meta as Record<string, any>)
      : {};
  Object.assign(orgSettings, settingsMeta);

  const propertyName = String(
    settingsMeta.name ||
      settingsMeta.property_name ||
      settingsRow.property_name ||
      payload.businessName ||
      '',
  ).trim();
  if (propertyName) hotel.name = propertyName;
  if (settingsMeta.legal || settingsRow.legal_name) {
    hotel.legalName = String(settingsMeta.legal || settingsRow.legal_name);
  }
  if (settingsMeta.phone || settingsRow.phone) hotel.phone = String(settingsMeta.phone || settingsRow.phone);
  if (settingsMeta.email || settingsRow.email) hotel.email = String(settingsMeta.email || settingsRow.email);
  if (settingsMeta.address || settingsRow.address) {
    hotel.address = String(settingsMeta.address || settingsRow.address);
  }
  if (settingsMeta.website || settingsRow.website) {
    hotel.website = String(settingsMeta.website || settingsRow.website);
  }
  if (settingsMeta.checkIn || settingsMeta.check_in || settingsRow.check_in_time) {
    hotel.checkIn = String(settingsMeta.checkIn || settingsMeta.check_in || settingsRow.check_in_time);
  }
  if (settingsMeta.checkOut || settingsMeta.check_out || settingsRow.check_out_time) {
    hotel.checkOut = String(settingsMeta.checkOut || settingsMeta.check_out || settingsRow.check_out_time);
  }
  const tax =
    settingsMeta.tax ?? settingsMeta.tax_rate ?? settingsRow.tax_rate ?? settingsRow.tax;
  if (tax != null && tax !== '') hotel.taxRate = Number(tax);
  if (settingsMeta.currency || settingsRow.currency) {
    hotel.currency = String(settingsMeta.currency || settingsRow.currency);
  }
  if (settingsMeta.location || settingsRow.location) {
    hotel.location = String(settingsMeta.location || settingsRow.location);
  }
  if (settingsMeta.timezone || settingsRow.timezone) {
    hotel.timezone = String(settingsMeta.timezone || settingsRow.timezone);
  }
  hotel.totalRooms = liveRooms.length || Number(settingsRow.total_rooms || 0) || hotel.totalRooms;

  recalcHospitalitySummaries();
  return isLive || liveRooms.length + liveBookings.length + liveGuests.length > 0;
}
