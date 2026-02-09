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

function ensureConciseAnswer(answer: string) {
  const trimmed = (answer || '').trim();
  if (!trimmed) return '';

  const maxChars = 900;
  if (trimmed.length <= maxChars) return trimmed;

  // Prefer keeping a few complete lines (works well for short bullet guidance).
  const lines = trimmed
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);
  const shortLines = lines.slice(0, 6).join('\n');
  if (shortLines.length <= maxChars) return shortLines;

  // Fallback: keep the first few sentences.
  const sentences = trimmed
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);
  const shortSentences = sentences.slice(0, 4).join(' ');
  return shortSentences.length <= maxChars
    ? shortSentences
    : trimmed.slice(0, maxChars).trimEnd();
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
  prompt: `You are an expert business analyst AI for a small business owner. Your name is Busmo.
  
  Your goal is to provide factual, practical, and calm answers by explaining the pre-calculated data provided in the 'Data' section.
  
  CRITICAL RULES:
  0.  LANGUAGE: If Language is "fr", respond in French. Otherwise, respond in English. Always respond in that language.
  1.  The data provided represents RECENT activity and may not be the complete, all-time history of the business. When you mention totals (like total sales or profit), you MUST clarify that it is based on recent data (e.g., "Based on recent activity, your total sales are...").
  2.  You MUST NOT perform any calculations, forecasts, or generate numbers yourself. Your answers must be based *only* on the data provided below.
  2b. FORMAT: Output MUST be plain text only. Do NOT use HTML tags (no <ul>, <li>, <br>, etc.) and do NOT use code blocks. For bullet points, use lines that start with "- ".
  3.  When formatting monetary values, ALWAYS include thousands separators (e.g., 45,000 not 45000). Use the provided currency symbol. If the symbol is "CFA", place it AFTER the number with a space (e.g., 600 CFA). For all other symbols, place them BEFORE the number with no space (e.g., ₦600, $100).
  4.  If the data required to answer the question is 0 or empty, you MUST respond with: "I don’t have enough data yet to answer that. Please record more sales or add your products." For example, if totalSales is 0, you cannot answer questions about sales.
  5.  Do NOT guess or invent numbers.
  6.  If the user asks for advice or "what should I do", provide 2–4 practical next steps that are grounded in the provided data (e.g., low stock list, best/worst product, profit margin, expenses).
  7.  Keep answers helpful but tight:
      - Start with a direct 1–2 sentence answer.
      - Then add up to 4 short bullet points (each one action-oriented) when it improves usefulness.
      - No greetings, no fluff.

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

  User Question: {{{query}}}
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
    const lacksData = input.insights.totalSales === 0 && input.insights.salesTodayCount === 0 && input.insights.totalDeposits === 0 && input.insights.totalWithdrawals === 0;

    if (lacksData) {
      return {answer: notEnoughDataMessage(language)};
    }

    if (!hasApiKey) {
      return {answer: unavailableMessage(language)};
    }

    try {
      const {output} = await prompt(input);
      if (output?.answer) {
        return {answer: ensureConciseAnswer(output.answer)};
      }
      return {answer: unavailableMessage(language)};
    } catch (error: any) {
      console.error("An unexpected error occurred in getBusinessInsightsFlow:", error);
      return {answer: unavailableMessage(language)};
    }
  }
);
