'use server';

/**
 * @fileOverview An AI agent that provides business insights based on user questions.
 * This agent ONLY explains pre-calculated data. It does not perform any calculations itself.
 *
 * - getBusinessInsights - A function that handles the business insights process.
 * - GetBusinessInsightsInput - The input type for the getBusinessInsights function.
 * - GetBusinessInsightsOutput - The return type for the getBusinessInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProductInsightSchema = z.object({
  id: z.string(),
  name: z.string(),
  quantity: z.number(),
  sales: z.number().optional(),
});

const BusinessInsightsDataSchema = z.object({
    totalSales: z.number().describe("The total sales revenue for the period."),
    totalProfit: z.number().describe("The total net profit for the period (Sales - Cost of Goods)."),
    bestSellingProduct: ProductInsightSchema.optional().describe("The product that has generated the most sales revenue."),
    worstSellingProduct: ProductInsightSchema.optional().describe("The product that has generated the least sales revenue."),
    lowStockProducts: z.array(ProductInsightSchema).describe("A list of products with a stock quantity of 10 or less."),
    salesTodayCount: z.number().describe("The number of individual sales made today."),
    salesTodayTotal: z.number().describe("The total revenue from sales made today."),
    profitToday: z.number().describe("The net profit from sales made today."),
    totalDeposits: z.number().describe("Total cash deposited into the business."),
    totalWithdrawals: z.number().describe("Total cash withdrawn from the business."),
    totalExpenses: z.number().optional().describe("Total expenses for the period."),
    profitMargin: z.number().optional().describe("Net profit margin for the period, as a percentage."),
    cashBalance: z.number().optional().describe("Cash balance (total deposits minus total withdrawals)."),
    dailyAvgExpense: z.number().optional().describe("Average daily expenses for the period."),
    salesDays: z.number().optional().describe("Number of days with sales in the period."),
});

const GetBusinessInsightsInputSchema = z.object({
  query: z.string().describe('The question asked by the business owner.'),
  insights: BusinessInsightsDataSchema.describe("Pre-calculated insights about the business performance."),
  currency: z.string().describe('The currency symbol (e.g., ₦, $) for formatting monetary values.'),
  language: z.string().optional().describe("UI language code (e.g., 'en', 'fr')."),
});
export type GetBusinessInsightsInput = z.infer<typeof GetBusinessInsightsInputSchema>;

const GetBusinessInsightsOutputSchema = z.object({
  answer: z.string().describe('The answer to the business owner question.'),
});
export type GetBusinessInsightsOutput = z.infer<typeof GetBusinessInsightsOutputSchema>;

export async function getBusinessInsights(input: GetBusinessInsightsInput): Promise<GetBusinessInsightsOutput> {
  return getBusinessInsightsFlow(input);
}

function normalizeLanguage(language?: string): 'en' | 'fr' {
  return language === 'fr' ? 'fr' : 'en';
}

function notEnoughDataMessage(language: 'en' | 'fr') {
  return language === 'fr'
    ? "Je n’ai pas encore assez de données pour répondre. Ajoute tes produits, puis enregistre quelques ventes et dépenses (même 3–5) et réessaie."
    : "I don’t have enough data yet to answer that. Add your products, then record a few sales and expenses (even 3–5) and try again.";
}

function unavailableMessage(language: 'en' | 'fr') {
  return language === 'fr'
    ? "Busmo n’est pas disponible pour le moment. Réessaie bientôt."
    : "Busmo isn’t available right now. Please try again.";
}

function sanitizeAnswer(answer: string) {
  return (answer || '').trim();
}

function formatMoney(value: number | undefined, currencySymbol: string) {
  const safeValue = Number.isFinite(value) ? Number(value) : 0;
  const formatted = Math.round(safeValue).toLocaleString();
  return currencySymbol === 'CFA' ? `${formatted} ${currencySymbol}` : `${currencySymbol}${formatted}`;
}

const prompt = ai.definePrompt({
  name: 'getBusinessInsightsPrompt',
  input: {schema: GetBusinessInsightsInputSchema},
  output: {schema: GetBusinessInsightsOutputSchema},
  prompt: `You translate raw business numbers into clear, professional, actionable insights for a business owner. Speak directly to the owner using “you”.

IMPORTANT RULES (non‑negotiable):
1) ONLY analyze the business data provided under “Data”.
2) Do NOT assume missing data. If a section needs data that is not provided, say so plainly.
3) Do NOT hallucinate numbers. Do NOT invent percentages, comparisons, averages, or timelines.
4) Do NOT do new calculations. You may restate the provided figures and explain what they mean.
5) Avoid technical accounting jargon. Use simple, everyday language.
6) Keep it professional but human. No fluff, no motivational talk.
7) FORMAT: Output MUST be plain text only. No HTML, no markdown headings, no code blocks.
   Use the exact section titles shown below, each on its own line.
8) LENGTH: 400–600 words total. Not shorter, not longer.
9) LANGUAGE: If Language is "fr", respond in French. Otherwise respond in English.

REQUIRED RESPONSE STRUCTURE (use these exact titles, in this order):
Business Snapshot
Revenue Analysis
Expense & Profit Analysis
Cash Flow Health
Customer & Subscription Insights
Risk Signals
Growth Opportunities
Recommended Actions

Style guidelines:
- Be decision-focused: explain what the numbers mean for what you should do next.
- Be honest about limits: if you cannot see a trend from the data, say “the data provided does not show a time trend”.
- When you mention totals, clarify they reflect the data provided (recent activity) rather than guaranteed all-time.
- Monetary formatting: include thousands separators. Use the Currency symbol provided. If Currency is “CFA”, put it after the number with a space (e.g., “45,000 CFA”). Otherwise put it before the number (e.g., “₦45,000”).

Data:
  - Language: {{{language}}}
  - Currency: {{{currency}}}
  - Total Sales Revenue: {{{insights.totalSales}}}
  - Total Profit: {{{insights.totalProfit}}}
  - Total Cash Deposits: {{{insights.totalDeposits}}}
  - Total Cash Withdrawals: {{{insights.totalWithdrawals}}}
  - Total Expenses: {{{insights.totalExpenses}}}
  - Profit Margin (%): {{{insights.profitMargin}}}
  - Cash Balance: {{{insights.cashBalance}}}
  - Avg Daily Expense: {{{insights.dailyAvgExpense}}}
  - Sales Days: {{{insights.salesDays}}}
  - Number of Sales Today: {{{insights.salesTodayCount}}}
  - Total Revenue Today: {{{insights.salesTodayTotal}}}
  - Profit Today: {{{insights.profitToday}}}
  - Best Selling Product: {{#if insights.bestSellingProduct}}{{insights.bestSellingProduct.name}} (Sold {{insights.bestSellingProduct.quantity}} units){{else}}None{{/if}}
  - Worst Selling Product: {{#if insights.worstSellingProduct}}{{insights.worstSellingProduct.name}} (Sold {{insights.worstSellingProduct.quantity}} units){{else}}None{{/if}}
  - Products Running Low (10 or less in stock):
    {{#each insights.lowStockProducts}}
    - {{name}} ({{quantity}} left)
    {{else}}
    - None
    {{/each}}

  ---

  Owner Prompt (context, may be ignored if not relevant): {{{query}}}
  `,
});

const getBusinessInsightsFlow = ai.defineFlow(
  {
    name: 'getBusinessInsightsFlow',
    inputSchema: GetBusinessInsightsInputSchema,
    outputSchema: GetBusinessInsightsOutputSchema,
  },
  async input => {
    const language = normalizeLanguage(input.language);
    const hasApiKey = !!(process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY);
    const lacksData =
      input.insights.totalSales === 0 &&
      input.insights.salesTodayCount === 0 &&
      input.insights.totalDeposits === 0 &&
      input.insights.totalWithdrawals === 0 &&
      (input.insights.lowStockProducts?.length || 0) === 0 &&
      !input.insights.bestSellingProduct &&
      !input.insights.worstSellingProduct;

    if (lacksData) {
      return {answer: notEnoughDataMessage(language)};
    }

    if (!hasApiKey) {
      return {answer: unavailableMessage(language)};
    }

    try {
      const {output} = await prompt(input);
      if (output?.answer) {
        return {answer: sanitizeAnswer(output.answer)};
      }
      return {answer: unavailableMessage(language)};
    } catch (error: any) {
      console.error("An unexpected error occurred in getBusinessInsightsFlow:", error);
      return {answer: unavailableMessage(language)};
    }
  }
);
