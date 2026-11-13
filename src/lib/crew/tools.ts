/**
 * Crew tool registry — deterministic reads only.
 * Agents never query Supabase directly; Manager invokes these.
 */
import { getSupabaseAdmin } from '@/lib/supabase-server';

export type ToolResult = {
  ok: boolean;
  data?: unknown;
  error?: string;
};

function lagosStart(dayOffset = 0) {
  const lagos = new Date(Date.now() + 60 * 60 * 1000);
  const startUtc =
    Date.UTC(lagos.getUTCFullYear(), lagos.getUTCMonth(), lagos.getUTCDate() + dayOffset) -
    60 * 60 * 1000;
  return new Date(startUtc);
}

function naira(n: number) {
  return `₦${Math.round(Number(n) || 0).toLocaleString('en-NG')}`;
}

export async function getSalesSummary(businessId: string): Promise<ToolResult> {
  try {
    const admin = getSupabaseAdmin();
    const todayStart = lagosStart(0).toISOString();
    const yStart = lagosStart(-1).toISOString();
    const { data, error } = await admin
      .from('sales')
      .select('created_at, total_revenue, profit, status, metadata')
      .eq('business_id', businessId)
      .gte('created_at', yStart)
      .limit(800);
    if (error) return { ok: false, error: error.message };

    const rows = (data || []).filter((s: any) => {
      const st = String(s.status || 'completed').toLowerCase();
      return st !== 'cancelled' && st !== 'void';
    });

    const sum = (from: string, to?: string) => {
      let rev = 0;
      let profit = 0;
      let count = 0;
      for (const s of rows) {
        const t = String(s.created_at || '');
        if (t < from) continue;
        if (to && t >= to) continue;
        const meta = s.metadata && typeof s.metadata === 'object' ? s.metadata : {};
        if (meta.isReturn === true) continue;
        rev += Number(s.total_revenue) || 0;
        profit += Number(s.profit) || 0;
        count += 1;
      }
      return { rev, profit, count };
    };

    const today = sum(todayStart);
    const yesterday = sum(yStart, todayStart);
    return {
      ok: true,
      data: {
        today,
        yesterday,
        text: {
          today: `Today: ${naira(today.rev)} revenue, ${naira(today.profit)} profit, ${today.count} sales.`,
          yesterday: `Yesterday: ${naira(yesterday.rev)} revenue, ${naira(yesterday.profit)} profit, ${yesterday.count} sales.`,
        },
      },
    };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'sales summary failed' };
  }
}

export async function getExpenseSummary(businessId: string): Promise<ToolResult> {
  try {
    const admin = getSupabaseAdmin();
    const todayStart = lagosStart(0).toISOString();
    const yStart = lagosStart(-1).toISOString();
    const { data, error } = await admin
      .from('expenses')
      .select('created_at, amount')
      .eq('business_id', businessId)
      .gte('created_at', yStart)
      .limit(400);
    if (error) return { ok: false, error: error.message };
    let today = 0;
    let yesterday = 0;
    for (const e of data || []) {
      const t = String((e as any).created_at || '');
      const amt = Number((e as any).amount) || 0;
      if (t >= todayStart) today += amt;
      else yesterday += amt;
    }
    return {
      ok: true,
      data: {
        today,
        yesterday,
        text: `Expenses today ${naira(today)}, yesterday ${naira(yesterday)}.`,
      },
    };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'expense summary failed' };
  }
}

export async function listLowStock(businessId: string): Promise<ToolResult> {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('products')
      .select('id, name, stock_level, reorder_level, status')
      .eq('business_id', businessId)
      .limit(400);
    if (error) return { ok: false, error: error.message };

    const low = (data || [])
      .filter((p: any) => {
        const st = String(p.status || 'active').toLowerCase();
        if (['inactive', 'archived', 'deleted'].includes(st)) return false;
        const stock = Number(p.stock_level) || 0;
        const reorder = Number(p.reorder_level) || 0;
        return reorder > 0 ? stock <= reorder : stock <= 5;
      })
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        stock: Number(p.stock_level) || 0,
        reorder: Number(p.reorder_level) || 0,
      }))
      .slice(0, 20);

    return {
      ok: true,
      data: {
        items: low,
        count: low.length,
        text:
          low.length === 0
            ? 'No products are below reorder level right now.'
            : `${low.length} product${low.length === 1 ? '' : 's'} need attention:\n` +
              low
                .slice(0, 8)
                .map((p) => `· ${p.name}: ${p.stock} left`)
                .join('\n'),
      },
    };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'low stock failed' };
  }
}

export async function listCreditBalances(businessId: string): Promise<ToolResult> {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('credit_customers')
      .select('name, phone, balance, status')
      .eq('business_id', businessId)
      .limit(200);
    if (error) return { ok: false, error: error.message };

    const debtors = (data || [])
      .map((c: any) => ({
        name: c.name || 'Customer',
        phone: c.phone || '',
        balance: Number(c.balance) || 0,
        status: c.status,
      }))
      .filter((c) => c.balance > 0)
      .sort((a, b) => b.balance - a.balance);

    const total = debtors.reduce((s, c) => s + c.balance, 0);
    return {
      ok: true,
      data: {
        debtors: debtors.slice(0, 15),
        count: debtors.length,
        total,
        text:
          debtors.length === 0
            ? 'No outstanding customer balances.'
            : `${debtors.length} customer${debtors.length === 1 ? '' : 's'} owe ${naira(total)}.\n` +
              debtors
                .slice(0, 6)
                .map((c) => `· ${c.name}: ${naira(c.balance)}`)
                .join('\n'),
      },
    };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'credit balances failed' };
  }
}

export type CrewBrief = {
  businessName: string;
  sales: Awaited<ReturnType<typeof getSalesSummary>>;
  expenses: Awaited<ReturnType<typeof getExpenseSummary>>;
  lowStock: Awaited<ReturnType<typeof listLowStock>>;
  credit: Awaited<ReturnType<typeof listCreditBalances>>;
  signals: { agent: string; title: string; detail: string; status: string }[];
};

export async function loadCrewBrief(businessId: string, businessName: string): Promise<CrewBrief> {
  const [sales, expenses, lowStock, credit] = await Promise.all([
    getSalesSummary(businessId),
    getExpenseSummary(businessId),
    listLowStock(businessId),
    listCreditBalances(businessId),
  ]);

  const signals: CrewBrief['signals'] = [];
  if (sales.ok && sales.data) {
    const t = (sales.data as any).today;
    signals.push({
      agent: 'tally',
      title: t.count ? `${naira(t.rev)} today` : 'No sales yet today',
      detail: t.count ? `${t.count} sales · ${naira(t.profit)} profit` : 'Record a sale to wake Tally up',
      status: t.count ? 'ok' : 'idle',
    });
  }
  if (lowStock.ok && lowStock.data) {
    const c = (lowStock.data as any).count || 0;
    signals.push({
      agent: 'bin',
      title: c ? `${c} low-stock item${c === 1 ? '' : 's'}` : 'Stock looks steady',
      detail: c ? 'Bin can draft a restock list' : 'Nothing below reorder level',
      status: c ? 'alert' : 'ok',
    });
  }
  if (credit.ok && credit.data) {
    const c = (credit.data as any).count || 0;
    const total = (credit.data as any).total || 0;
    signals.push({
      agent: 'ledger',
      title: c ? `${c} open balance${c === 1 ? '' : 's'}` : 'No open credit',
      detail: c ? naira(total) + ' outstanding' : 'Ledger is clear',
      status: c ? 'alert' : 'ok',
    });
  }

  return { businessName, sales, expenses, lowStock, credit, signals };
}

export const CREW_TOOLS = {
  get_sales_summary: getSalesSummary,
  get_expense_summary: getExpenseSummary,
  list_low_stock: listLowStock,
  list_credit_balances: listCreditBalances,
} as const;

export type CrewToolName = keyof typeof CREW_TOOLS;
