/**
 * Proactive MO nudges — derived from live business numbers (no LLM required).
 * Used on Home and optionally mirrored into the notification inbox.
 */

import type { PageId } from '@/app/owner/dashboard/index';

export type NudgeSeverity = 'critical' | 'warning' | 'positive' | 'info';

export interface MoNudge {
  id: string;
  severity: NudgeSeverity;
  title: string;
  body: string;
  actionLabel: string;
  href: PageId;
}

export interface NudgeInput {
  cashBalance: number;
  salesToday: number;
  expensesToday: number;
  cashRunwayDays: number;
  lowStockCount: number;
  pendingCollections: number;
  supplierOwed: number;
  thinMarginCount: number;
  thinMarginNames: string[];
  formatMoney: (n: number) => string;
  /** Category-native copy + thresholds */
  targetMarginPct?: number;
  deadStockCount?: number;
  categoryNudgeCopy?: {
    thinMargin: string;
    lowStock: string;
    supplier: string;
    quiet: string;
  };
}

export function buildProactiveNudges(input: NudgeInput): MoNudge[] {
  const nudges: MoNudge[] = [];
  const {
    cashBalance,
    salesToday,
    expensesToday,
    cashRunwayDays,
    lowStockCount,
    pendingCollections,
    supplierOwed,
    thinMarginCount,
    thinMarginNames,
    formatMoney,
    targetMarginPct = 30,
    deadStockCount = 0,
    categoryNudgeCopy,
  } = input;

  if (expensesToday > salesToday && expensesToday > 0) {
    nudges.push({
      id: 'cash-out-gt-sales',
      severity: 'critical',
      title: 'Money out is ahead of sales today',
      body: `Out ${formatMoney(expensesToday)} vs sales ${formatMoney(salesToday)}. Check expenses or supplier payments before more stock buys.`,
      actionLabel: 'Open cashflow',
      href: 'cashflow',
    });
  }

  if (cashRunwayDays > 0 && cashRunwayDays < 14) {
    nudges.push({
      id: 'runway-tight',
      severity: 'critical',
      title: `About ${cashRunwayDays} days of cash left`,
      body: `Spendable balance ${formatMoney(cashBalance)}. Slow non-essential buys or collect credit first.`,
      actionLabel: 'Review cash',
      href: 'cashflow',
    });
  }

  if (supplierOwed > 0 && supplierOwed > cashBalance * 0.5) {
    nudges.push({
      id: 'supplier-pressure',
      severity: 'warning',
      title: 'Supplier debt is heavy vs cash',
      body:
        categoryNudgeCopy?.supplier ||
        `You owe suppliers ${formatMoney(supplierOwed)} with ${formatMoney(cashBalance)} on hand. Plan payments — don’t stack more credit blindly.`,
      actionLabel: 'Pay suppliers',
      href: 'cashflow',
    });
  } else if (supplierOwed > 0) {
    nudges.push({
      id: 'supplier-owe',
      severity: 'info',
      title: 'Outstanding supplier credit',
      body: `${formatMoney(supplierOwed)} still owed. Settle soon to keep supply steady.`,
      actionLabel: 'Supplier credit',
      href: 'credit-tracking' as PageId,
    });
  }

  if (thinMarginCount > 0) {
    const names = thinMarginNames.slice(0, 3).join(', ');
    nudges.push({
      id: 'thin-margin',
      severity: 'warning',
      title:
        thinMarginCount === 1
          ? '1 item priced too thin'
          : `${thinMarginCount} items priced too thin`,
      body:
        (categoryNudgeCopy?.thinMargin ||
          `${names || 'Several products'} sit below a healthy ~${targetMarginPct}% margin. Fix price or cost before volume grows losses.`) +
        (names ? ` (${names})` : ''),
      actionLabel: 'Margin calculator',
      href: 'margin-calculator' as PageId,
    });
  }

  if (deadStockCount > 0) {
    nudges.push({
      id: 'dead-stock',
      severity: 'warning',
      title: deadStockCount === 1 ? '1 slow / dead stock line' : `${deadStockCount} slow / dead stock lines`,
      body: 'High on-hand quantity with almost no recent sales. Discount, bundle, or stop reordering.',
      actionLabel: 'Open inventory',
      href: 'inventory',
    });
  }

  if (lowStockCount > 0) {
    nudges.push({
      id: 'low-stock',
      severity: lowStockCount >= 3 ? 'critical' : 'warning',
      title: lowStockCount === 1 ? '1 product low on stock' : `${lowStockCount} products low on stock`,
      body:
        categoryNudgeCopy?.lowStock ||
        'Restock winners first. Use “Can I buy this?” so cash and credit stay in check.',
      actionLabel: 'Can I buy this?',
      href: 'can-i-buy' as PageId,
    });
  }

  if (pendingCollections > 0) {
    nudges.push({
      id: 'collect-credit',
      severity: 'warning',
      title: 'Customer credit to collect',
      body: `${formatMoney(pendingCollections)} sitting with customers. Collecting is cheaper than borrowing.`,
      actionLabel: 'Credit tracking',
      href: 'credit-tracking',
    });
  }

  if (salesToday > 0 && expensesToday === 0 && cashRunwayDays >= 30) {
    nudges.push({
      id: 'healthy-day',
      severity: 'positive',
      title: 'Solid day so far',
      body: `Sales ${formatMoney(salesToday)} with cash runway looking healthy. Good window to restock only what moves.`,
      actionLabel: 'Record another sale',
      href: 'sale',
    });
  }

  if (salesToday === 0 && expensesToday === 0) {
    nudges.push({
      id: 'quiet-start',
      severity: 'info',
      title: 'Quiet start to the day',
      body:
        categoryNudgeCopy?.quiet ||
        'No sales logged yet. A quick sale or stock check keeps the books honest.',
      actionLabel: 'Record sale',
      href: 'sale',
    });
  }

  // Prefer action-heavy first
  const order: Record<NudgeSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
    positive: 3,
  };
  return nudges.sort((a, b) => order[a.severity] - order[b.severity]).slice(0, 5);
}

export interface BuyDecisionInput {
  cashBalance: number;
  purchaseAmount: number;
  monthlyBurnEstimate: number;
  supplierOwed: number;
  useCredit: boolean;
}

export interface BuyDecision {
  canBuy: boolean;
  verdict: 'yes' | 'caution' | 'no';
  title: string;
  body: string;
  cashAfter: number;
  runwayAfterDays: number | null;
  tips: string[];
}

export function evaluateCanIBuy(input: BuyDecisionInput): BuyDecision {
  const { cashBalance, purchaseAmount, monthlyBurnEstimate, supplierOwed, useCredit } = input;
  const amount = Math.max(0, purchaseAmount);
  const burnDaily = monthlyBurnEstimate > 0 ? monthlyBurnEstimate / 30 : 0;

  if (amount <= 0) {
    return {
      canBuy: false,
      verdict: 'caution',
      title: 'Enter a purchase amount',
      body: 'Tell MO how much the stock or item costs.',
      cashAfter: cashBalance,
      runwayAfterDays: burnDaily > 0 ? Math.round(cashBalance / burnDaily) : null,
      tips: [],
    };
  }

  if (useCredit) {
    const newOwed = supplierOwed + amount;
    const pressure = cashBalance > 0 ? newOwed / cashBalance : 99;
    if (pressure > 2) {
      return {
        canBuy: false,
        verdict: 'no',
        title: 'Credit buy looks risky',
        body: `Adding ${amount.toLocaleString()} on credit would push supplier debt far above cash on hand. Collect or sell down first.`,
        cashAfter: cashBalance,
        runwayAfterDays: burnDaily > 0 ? Math.round(cashBalance / burnDaily) : null,
        tips: [
          'Negotiate smaller delivery or staggered payment.',
          'Collect customer credit before taking more supplier credit.',
        ],
      };
    }
    return {
      canBuy: true,
      verdict: pressure > 1 ? 'caution' : 'yes',
      title: pressure > 1 ? 'Credit OK with caution' : 'Credit buy looks manageable',
      body: `Cash stays ${cashBalance.toLocaleString()} today; supplier owed rises to about ${newOwed.toLocaleString()}. Plan the repayment date.`,
      cashAfter: cashBalance,
      runwayAfterDays: burnDaily > 0 ? Math.round(cashBalance / burnDaily) : null,
      tips: [
        'Log the purchase as credit so Supplier Credit stays accurate.',
        'Set a reminder before the due date.',
      ],
    };
  }

  const cashAfter = cashBalance - amount;
  const runwayAfter =
    burnDaily > 0 && cashAfter > 0 ? Math.round(cashAfter / burnDaily) : cashAfter <= 0 ? 0 : null;

  if (cashAfter < 0) {
    return {
      canBuy: false,
      verdict: 'no',
      title: 'Not enough cash',
      body: `This purchase needs ${amount.toLocaleString()} but you only have ${cashBalance.toLocaleString()} spendable. Use supplier credit, wait for sales, or buy a smaller quantity.`,
      cashAfter,
      runwayAfterDays: 0,
      tips: [
        'Try “buy on credit” if the supplier allows.',
        'Or open Can I buy this? again after today’s sales land in the till.',
      ],
    };
  }

  if (runwayAfter !== null && runwayAfter < 7) {
    return {
      canBuy: false,
      verdict: 'no',
      title: 'Would leave you too tight',
      body: `After buying, cash would be about ${cashAfter.toLocaleString()} (~${runwayAfter} days runway). That is too thin for comfort.`,
      cashAfter,
      runwayAfterDays: runwayAfter,
      tips: ['Reduce quantity.', 'Split the order.', 'Wait for more sales or collections.'],
    };
  }

  if (runwayAfter !== null && runwayAfter < 14) {
    return {
      canBuy: true,
      verdict: 'caution',
      title: 'You can buy — stay careful',
      body: `Cash after purchase ≈ ${cashAfter.toLocaleString()} (~${runwayAfter} days). Prefer fast-moving items only.`,
      cashAfter,
      runwayAfterDays: runwayAfter,
      tips: ['Avoid slow movers.', 'Confirm the item will sell within two weeks.'],
    };
  }

  return {
    canBuy: true,
    verdict: 'yes',
    title: 'Yes — this looks affordable',
    body: `Cash after purchase ≈ ${cashAfter.toLocaleString()}${
      runwayAfter != null ? ` (~${runwayAfter} days runway)` : ''
    }. Go ahead if the stock moves.`,
    cashAfter,
    runwayAfterDays: runwayAfter,
    tips: ['Record the purchase in Cashflow so balances stay true.'],
  };
}
