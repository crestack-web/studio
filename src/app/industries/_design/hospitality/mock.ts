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

export const notifications = [];

export const revenueSummary = {
  today: 0,
  monthToDate: 0,
  target: 0,
  adr: 0,
  revpar: 0,
};

export const revenueByType: { label: string; revenue: number }[] = [];

export const channelMix: { name: string; value: number; color: string }[] = [];

export const expenseSummary = {
  monthToDate: 0,
  budget: 0,
  pending: 0,
  largest: '—',
};

export const paymentSummary = {
  collectedToday: 0,
  outstanding: 0,
  refunds: 0,
  settled: 0,
};

export const reports = [];

export const websiteStats = {
  published: false,
  visits30d: 0,
  directBookings30d: 0,
  inquiries30d: 0,
  conversion: 0,
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

function channelLabel(source: Booking['source'] | string): string {
  const src = String(source || '');
  if (src === 'website') return 'Direct';
  if (src === 'walk_in') return 'Walk-in';
  if (src === 'phone') return 'Phone';
  if (src === 'ota' || src === 'agents') return 'Agents';
  if (src === 'corporate') return 'Corporate';
  return 'Front desk';
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

  const activeBookings = bookings.filter((b) => !['cancelled', 'no_show'].includes(b.status));
  const todayRevenue = activeBookings
    .filter((b) => b.check_in_date === TODAY || b.check_out_date === TODAY || b.status === 'checked_in')
    .reduce((s, b) => s + Number(b.amount || 0), 0);
  const monthPrefix = TODAY.slice(0, 7);
  const monthRevenue = activeBookings
    .filter((b) => String(b.check_in_date || '').startsWith(monthPrefix))
    .reduce((s, b) => s + Number(b.amount || 0), 0);
  Object.assign(revenueSummary, {
    today: todayRevenue,
    monthToDate: monthRevenue,
    target: monthRevenue > 0 ? Math.round(monthRevenue * 1.25) : 0,
    adr,
    revpar: Math.round((adr * rate) / 100),
  });

  const series: { date: string; rooms: number; food: number; other: number; occupancy: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(`${TODAY}T12:00:00`);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const dayBookings = activeBookings.filter(
      (b) =>
        b.check_in_date <= iso &&
        b.check_out_date > iso &&
        ['checked_in', 'checked_out', 'confirmed'].includes(b.status),
    );
    const roomsRev = dayBookings.reduce((s, b) => s + Number(b.rate_per_night || 0), 0);
    const occ = rooms.length > 0 ? Math.round((dayBookings.length / rooms.length) * 100) : 0;
    series.push({ date: iso, rooms: roomsRev, food: 0, other: 0, occupancy: occ });
  }
  replaceArray(revenueSeries, series);

  replaceArray(
    revenueByType,
    roomTypeStats.map((rt) => ({
      label: rt.category,
      revenue: activeBookings
        .filter((b) => b.category === rt.category)
        .reduce((s, b) => s + Number(b.amount || 0), 0),
    })),
  );

  const sourceMap: Record<string, number> = {};
  activeBookings.forEach((b) => {
    const key = channelLabel(b.source);
    sourceMap[key] = (sourceMap[key] || 0) + 1;
  });
  const sourceTotal = Object.values(sourceMap).reduce((a, b) => a + b, 0) || 1;
  const colors = [
    'var(--sol-chart-1)',
    'var(--sol-chart-2)',
    'var(--sol-chart-3)',
    'var(--sol-chart-4)',
    'var(--sol-chart-5)',
  ];
  replaceArray(
    channelMix,
    Object.entries(sourceMap).map(([name, count], i) => ({
      name,
      value: Math.round((count / sourceTotal) * 100),
      color: colors[i % colors.length],
    })),
  );

  const monthExpenses = expenses.filter((e) => String(e.date || '').startsWith(monthPrefix));
  const pendingAmt = expenses
    .filter((e) => e.status === 'pending' || e.status === 'overdue')
    .reduce((s, e) => s + Number(e.amount || 0), 0);
  const catTotals = new Map<string, number>();
  monthExpenses.forEach((e) =>
    catTotals.set(e.category, (catTotals.get(e.category) || 0) + Number(e.amount || 0)),
  );
  let largest = '—';
  let largestAmt = 0;
  catTotals.forEach((amt, cat) => {
    if (amt > largestAmt) {
      largestAmt = amt;
      largest = cat;
    }
  });
  const mtdExp = monthExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  Object.assign(expenseSummary, {
    monthToDate: mtdExp,
    budget: mtdExp > 0 ? Math.round(mtdExp * 1.4) : 0,
    pending: pendingAmt,
    largest,
  });

  const payToday = payments
    .filter((p) => p.date === TODAY && p.status === 'settled')
    .reduce((s, p) => s + Number(p.amount || 0), 0);
  const refunds = payments
    .filter((p) => p.status === 'refunded')
    .reduce((s, p) => s + Number(p.amount || 0), 0);
  Object.assign(paymentSummary, {
    collectedToday: payToday,
    outstanding: activeBookings.reduce((s, b) => s + Number(b.balance_amount || 0), 0),
    refunds,
    settled: payments.filter((p) => p.status === 'settled').length,
  });

  const direct = activeBookings.filter((b) => b.source === 'website' || b.source === 'front_desk').length;
  Object.assign(websiteStats, {
    published: websiteStats.published,
    visits30d: websiteStats.visits30d,
    directBookings30d: direct,
    inquiries30d: websiteInquiries.length,
    conversion:
      websiteStats.visits30d > 0
        ? Math.round((direct / websiteStats.visits30d) * 1000) / 10
        : 0,
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
      vip: Boolean(r.vip) || /^\[VIP\]/i.test(String(r.notes || '')),
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
      stage: (['dirty', 'in_progress', 'inspected', 'ready'].includes(String(meta.stage || r.status))
        ? String(meta.stage || r.status)
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
      booking_id: meta.booking_id ? String(meta.booking_id) : undefined,
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
    const methodRaw = String(meta.method || r.method || 'card').toLowerCase();
    const method = (
      methodRaw.includes('cash')
        ? 'cash'
        : methodRaw.includes('pos')
          ? 'pos'
          : methodRaw.includes('transfer') || methodRaw.includes('bank')
            ? 'transfer'
            : 'card'
    ) as Payment['method'];
    const statusRaw = String(r.status || 'pending').toLowerCase();
    const status = (
      statusRaw === 'settled' || statusRaw === 'paid'
        ? 'settled'
        : statusRaw === 'refunded'
          ? 'refunded'
          : 'pending'
    ) as Payment['status'];
    return {
      id: String(r.id),
      guest_name: String(meta.guest_name || r.title || 'Guest'),
      room_number: String(meta.room_number || ''),
      method,
      amount: Number(r.amount || 0),
      status,
      date: day(meta.date || r.occurred_at || r.created_at),
      reference: String(meta.reference || r.id || ''),
    };
  });

  const liveWebsiteSections: WebsiteSection[] = asArray(payload.websiteSections).map((r: any) => {
    const meta = r.meta || {};
    return {
      id: String(r.id),
      name: String(r.title || meta.name || meta.title || 'Section'),
      description: String(meta.body || meta.description || r.notes || ''),
      enabled: r.status !== 'hidden' && meta.visible !== false && meta.enabled !== false,
    };
  });

  const liveInquiries: WebsiteInquiry[] = asArray(payload.websiteInquiries).map((r: any) => {
    const meta = r.meta || {};
    const statusRaw = String(r.status || 'new').toLowerCase();
    const status = (
      statusRaw === 'converted'
        ? 'converted'
        : statusRaw === 'responded' || statusRaw === 'replied'
          ? 'responded'
          : 'new'
    ) as WebsiteInquiry['status'];
    return {
      id: String(r.id),
      name: String(meta.name || r.title || 'Guest'),
      email: String(meta.email || ''),
      dates: String(meta.dates || ''),
      guests: Number(meta.guests || 1),
      status,
      received_at: String(r.occurred_at || r.created_at || new Date().toISOString()),
    };
  });

  const liveActivity: ActivityItem[] = asArray(payload.activity).map((r: any) => {
    const meta = r.meta || {};
    const kindRaw = String(meta.kind || meta.type || r.module || 'booking').toLowerCase();
    const kind = (
      ['check_in', 'check_out', 'booking', 'payment', 'housekeeping', 'alert'].includes(kindRaw)
        ? kindRaw
        : 'booking'
    ) as ActivityItem['kind'];
    return {
      id: String(r.id),
      title: String(r.title || ''),
      detail: String(r.notes || meta.detail || ''),
      time: String(r.occurred_at || r.created_at || ''),
      kind,
    };
  });

  replaceArray(rooms, liveRooms);
  replaceArray(bookings, liveBookings);

  // Guests often exist only on bookings until profiles are created — surface them in the directory.
  {
    const byKey = new Map(liveGuests.map((g) => [g.id, g]));
    const nameIndex = new Map(liveGuests.map((g) => [g.full_name.toLowerCase(), g]));
    for (const b of liveBookings) {
      const keyName = (b.guest_name || '').trim();
      if (!keyName) continue;
      const existing =
        (b.guest_id && byKey.get(b.guest_id)) ||
        nameIndex.get(keyName.toLowerCase()) ||
        null;
      if (existing) {
        if (!existing.last_stay || b.check_in_date > existing.last_stay) {
          existing.last_stay = b.check_in_date;
        }
        continue;
      }
      const derivedId = b.guest_id || `booking-guest-${b.id}`;
      const derived = {
        id: derivedId,
        full_name: keyName,
        phone: b.guest_phone || '',
        email: b.guest_email || '',
        country: 'Nigeria',
        stays: 1,
        total_spend: Number(b.amount || 0),
        last_stay: b.check_in_date,
        vip: false,
        notes: undefined as string | undefined,
      };
      liveGuests.push(derived);
      byKey.set(derived.id, derived);
      nameIndex.set(keyName.toLowerCase(), derived);
    }
    for (const g of liveGuests) {
      const related = liveBookings.filter(
        (b) =>
          (g.id && b.guest_id === g.id) ||
          (b.guest_name && b.guest_name === g.full_name) ||
          (g.email && b.guest_email === g.email),
      );
      g.stays = related.length || g.stays;
      g.total_spend = related.reduce((s, b) => s + Number(b.amount || 0), 0) || g.total_spend;
      const last = related.map((b) => b.check_in_date).filter(Boolean).sort().pop();
      if (last) g.last_stay = last;
    }
  }

  replaceArray(guests, liveGuests);
  replaceArray(folioLines, liveFolio);
  replaceArray(staff, liveStaff);
  replaceArray(tasks, liveTasks);
  if (!liveHousekeeping.length && liveRooms.length) {
    for (const r of liveRooms) {
      const st = String((r as any).status || 'available');
      let stage: HousekeepingRoom['stage'] = 'ready';
      if (st === 'cleaning' || st === 'dirty' || st === 'occupied') stage = 'dirty';
      else if (st === 'maintenance' || st === 'blocked') stage = 'dirty';
      liveHousekeeping.push({
        id: r.id,
        room_number: r.room_number,
        category: r.category || 'Standard',
        stage,
        assignee: 'Unassigned',
        priority: st === 'maintenance' ? 'high' : 'medium',
        updated_at: new Date().toISOString(),
        note: undefined,
      });
    }
  }
  replaceArray(housekeepingRooms, liveHousekeeping);
  replaceArray(roomServiceOrders, liveRoomService);
  replaceArray(expenses, liveExpenses);
  replaceArray(payments, livePayments);
  replaceArray(websiteSections, liveWebsiteSections);
  replaceArray(websiteInquiries, liveInquiries);
  replaceArray(activity, liveActivity);

  if (payload.settings) {
    Object.assign(orgSettings, payload.settings);
    if (payload.settings.property_name) hotel.name = String(payload.settings.property_name);
    if (payload.settings.currency) hotel.currency = String(payload.settings.currency);
    if (payload.settings.phone) hotel.phone = String(payload.settings.phone);
    if (payload.settings.email) hotel.email = String(payload.settings.email);
    if (payload.settings.address) hotel.address = String(payload.settings.address);
    if (payload.settings.check_in_time) hotel.checkIn = String(payload.settings.check_in_time);
    if (payload.settings.check_out_time) hotel.checkOut = String(payload.settings.check_out_time);
    if (payload.settings.timezone) hotel.timezone = String(payload.settings.timezone);
    if (payload.settings.total_rooms != null) hotel.totalRooms = Number(payload.settings.total_rooms);
  }

  if (payload.website) {
    websiteStats.published = Boolean(payload.website.published);
  }

  if (payload.branding) {
    if (payload.branding.display_name) hotel.name = String(payload.branding.display_name);
    if (payload.branding.currency) hotel.currency = String(payload.branding.currency);
  }

  recalcHospitalitySummaries();
  return isLive;
}
