import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '../mo-sales/_auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function naira(n: number) {
  return `₦${Math.round(Number(n) || 0).toLocaleString('en-NG')}`;
}

function lagosStart(dayOffset = 0) {
  const lagos = new Date(Date.now() + 60 * 60 * 1000);
  const startUtc = Date.UTC(lagos.getUTCFullYear(), lagos.getUTCMonth(), lagos.getUTCDate() + dayOffset) - 60 * 60 * 1000;
  return new Date(startUtc);
}

async function resolveBusiness(userId: string) {
  const admin = getSupabaseAdmin();
  const { data: own } = await admin.from('businesses').select('id, name').eq('id', userId).maybeSingle();
  if (own?.id) return { id: String(own.id), name: String((own as any).name || 'Your business') };

  const { data: profile } = await admin.from('users').select('business_id, name').eq('id', userId).maybeSingle();
  const fromProfile = (profile as any)?.business_id ? String((profile as any).business_id) : '';
  if (fromProfile) {
    const { data: biz } = await admin.from('businesses').select('id, name').eq('id', fromProfile).maybeSingle();
    return { id: fromProfile, name: String((biz as any)?.name || 'Your business') };
  }

  const { data: owned } = await admin.from('businesses').select('id, name').eq('owner_id', userId).limit(1).maybeSingle();
  if (owned?.id) return { id: String(owned.id), name: String((owned as any).name || 'Your business') };
  return null;
}

async function loadBrief(businessId: string, businessName: string) {
  const admin = getSupabaseAdmin();
  const todayStart = lagosStart(0).toISOString();
  const yStart = lagosStart(-1).toISOString();

  const [salesRes, expenseRes, productRes, creditRes] = await Promise.all([
    admin.from('sales').select('created_at, total_revenue, profit, status').eq('business_id', businessId).gte('created_at', yStart).limit(800),
    admin.from('expenses').select('created_at, amount').eq('business_id', businessId).gte('created_at', yStart).limit(400),
    admin.from('products').select('name, stock_level, reorder_level, status').eq('business_id', businessId).limit(400),
    admin.from('credit_customers').select('name, phone, balance, status').eq('business_id', businessId).limit(200),
  ]);

  const sales = (salesRes.data || []).filter((s: any) => String(s.status || 'completed') !== 'cancelled');
  const inRange = (iso: string, from: string, to?: string) => iso >= from && (!to || iso < to);
  const sum = (rows: any[], field: string) => rows.reduce((n, r) => n + (Number(r[field]) || 0), 0);

  const todaySalesRows = sales.filter((s: any) => inRange(String(s.created_at || ''), todayStart));
  const ySalesRows = sales.filter((s: any) => inRange(String(s.created_at || ''), yStart, todayStart));
  const expenses = expenseRes.data || [];
  const todayExpenses = sum(expenses.filter((e: any) => inRange(String(e.created_at || ''), todayStart)), 'amount');
  const yExpenses = sum(expenses.filter((e: any) => inRange(String(e.created_at || ''), yStart, todayStart)), 'amount');

  const tally = {
    todaySales: sum(todaySalesRows, 'total_revenue'),
    todayProfit: sum(todaySalesRows, 'profit'),
    todayCount: todaySalesRows.length,
    todayExpenses,
    yesterdaySales: sum(ySalesRows, 'total_revenue'),
    yesterdayProfit: sum(ySalesRows, 'profit'),
    yesterdayCount: ySalesRows.length,
    yesterdayExpenses: yExpenses,
  };

  const low = (productRes.data || [])
    .filter((p: any) => !['inactive', 'archived', 'deleted'].includes(String(p.status || '').toLowerCase()))
    .map((p: any) => ({
      name: String(p.name || 'Product'),
      stock: Number(p.stock_level) || 0,
      reorder: Number(p.reorder_level) || 0,
    }))
    .filter((p) => (p.reorder > 0 ? p.stock <= p.reorder : p.stock > 0 && p.stock <= 5) || p.stock <= 0)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 8);

  const owed = (creditRes.data || [])
    .map((c: any) => ({
      name: String(c.name || 'Customer'),
      phone: c.phone ? String(c.phone) : '',
      balance: Number(c.balance) || 0,
    }))
    .filter((c) => c.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 8);

  const ledger = {
    count: owed.length,
    total: owed.reduce((n, c) => n + c.balance, 0),
    people: owed,
  };

  const signals = [
    tally.todayCount
      ? { agent: 'tally', title: 'Sales so far today', detail: `${naira(tally.todaySales)} from ${tally.todayCount} sale${tally.todayCount === 1 ? '' : 's'}. Profit ${naira(tally.todayProfit)}.`, status: 'done' }
      : { agent: 'tally', title: 'No sales recorded today', detail: 'Tally is waiting for the first sale.', status: 'watching' },
    low.length
      ? { agent: 'bin', title: `${low.length} item${low.length === 1 ? '' : 's'} running low`, detail: low.slice(0, 3).map((p) => `${p.name} (${p.stock})`).join(', '), status: 'needs_you' }
      : { agent: 'bin', title: 'Stock looks steady', detail: 'Bin did not find items under their restock line.', status: 'done' },
    ledger.count
      ? { agent: 'ledger', title: `${ledger.count} customer${ledger.count === 1 ? '' : 's'} still owe`, detail: `${naira(ledger.total)} outstanding.`, status: 'needs_you' }
      : { agent: 'ledger', title: 'No open customer debt', detail: 'Ledger does not see a balance to collect.', status: 'done' },
  ];

  return { businessName, tally, low, ledger, signals, warnings: [salesRes.error?.message, expenseRes.error?.message, productRes.error?.message, creditRes.error?.message].filter(Boolean) };
}

function answer(room: string, message: string, brief: any) {
  const q = message.toLowerCase();
  const t = brief.tally;
  const margin = (sales: number, profit: number) => (sales > 0 ? Math.round((profit / sales) * 100) : null);
  const todayMargin = margin(t.todaySales, t.todayProfit);
  const yMargin = margin(t.yesterdaySales, t.yesterdayProfit);
  const replies: { agent: string; text: string }[] = [];

  const tallyText = () => {
    const diff = t.todaySales - t.yesterdaySales;
    const dir = diff === 0 ? 'flat against yesterday' : diff > 0 ? `${naira(diff)} ahead of yesterday` : `${naira(Math.abs(diff))} behind yesterday`;
    return `Today you have recorded ${naira(t.todaySales)} from ${t.todayCount} sale${t.todayCount === 1 ? '' : 's'}. Profit is ${naira(t.todayProfit)}. Expenses logged today are ${naira(t.todayExpenses)}. Yesterday was ${naira(t.yesterdaySales)} in sales and ${naira(t.yesterdayProfit)} profit, so today is ${dir}.`;
  };
  const binText = () => {
    if (!brief.low.length) return 'I checked inventory. Nothing is sitting on or under its restock line.';
    const lines = brief.low.slice(0, 5).map((p: any) => `${p.name}: ${p.stock} left${p.reorder ? ` (restock at ${p.reorder})` : ''}`).join('\n');
    return `These need attention:\n${lines}\nI can prepare a restock list. I will not order anything until you approve it.`;
  };
  const ledgerText = () => {
    if (!brief.ledger.count) return 'Nobody currently has an open balance on credit.';
    const lines = brief.ledger.people.slice(0, 5).map((p: any) => `${p.name}: ${naira(p.balance)}`).join('\n');
    return `${brief.ledger.count} customer${brief.ledger.count === 1 ? '' : 's'} owe ${naira(brief.ledger.total)}.\n${lines}`;
  };

  const wantsAll = room === 'crew' || room === 'mo' || /why|profit|what.?s wrong|health|overview|how is the business/.test(q);
  if (wantsAll && (room === 'crew' || room === 'mo' || /why|profit|health|overview/.test(q))) {
    replies.push({ agent: 'tally', text: tallyText() + (todayMargin != null && yMargin != null ? ` Margin is ${todayMargin}% today and was ${yMargin}% yesterday.` : '') });
    replies.push({ agent: 'bin', text: binText() });
    replies.push({ agent: 'ledger', text: ledgerText() });
    return replies;
  }
  if (room === 'bin' || /stock|restock|inventory|product/.test(q)) return [{ agent: 'bin', text: binText() }];
  if (room === 'ledger' || /owe|debt|credit|customer/.test(q)) return [{ agent: 'ledger', text: ledgerText() }];
  if (room === 'tally' || /sale|money|revenue|expense|profit|cash/.test(q)) return [{ agent: 'tally', text: tallyText() }];
  if (/staff|shift|attendance/.test(q)) return [{ agent: 'mo', text: 'Shift is not on duty yet. Staff attendance is still on the Staff page.' }];
  return [{ agent: room === 'mo' || room === 'crew' ? 'tally' : room, text: room === 'bin' ? binText() : room === 'ledger' ? ledgerText() : tallyText() }];
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const business = await resolveBusiness(user.id);
  if (!business) return NextResponse.json({ error: 'No business found for this account' }, { status: 404 });
  const brief = await loadBrief(business.id, business.name);
  return NextResponse.json({ ok: true, businessId: business.id, ...brief });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const business = await resolveBusiness(user.id);
  if (!business) return NextResponse.json({ error: 'No business found for this account' }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const message = String(body.message || '').trim();
  if (!message) return NextResponse.json({ error: 'message required' }, { status: 400 });
  const brief = await loadBrief(business.id, business.name);
  const room = String(body.room || 'mo');
  return NextResponse.json({ ok: true, replies: answer(room, message, brief) });
}
