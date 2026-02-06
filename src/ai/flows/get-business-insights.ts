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
});
export type GetBusinessInsightsInput = z.infer<typeof GetBusinessInsightsInputSchema>;

const GetBusinessInsightsOutputSchema = z.object({
  answer: z.string().describe('The answer to the business owner question.'),
});
export type GetBusinessInsightsOutput = z.infer<typeof GetBusinessInsightsOutputSchema>;

export async function getBusinessInsights(input: GetBusinessInsightsInput): Promise<GetBusinessInsightsOutput> {
  return getBusinessInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getBusinessInsightsPrompt',
  input: {schema: GetBusinessInsightsInputSchema},
  output: {schema: GetBusinessInsightsOutputSchema},
  prompt: `You are an expert business analyst AI for a small business owner. Your name is Busmo. 
  
  Your goal is to provide factual, short, and calm answers by explaining the pre-calculated data provided in the 'Data' section.
  
  CRITICAL RULES:
  1.  The data provided represents RECENT activity and may not be the complete, all-time history of the business. When you mention totals (like total sales or profit), you MUST clarify that it is based on recent data (e.g., "Based on recent activity, your total sales are...").
  2.  You MUST NOT perform any calculations, forecasts, or generate numbers yourself. Your answers must be based *only* on the data provided below.
  3.  When formatting monetary values, ALWAYS include thousands separators (e.g., 45,000 not 45000). Use the provided currency symbol. If the symbol is "CFA", place it AFTER the number with a space (e.g., 600 CFA). For all other symbols, place them BEFORE the number with no space (e.g., ₦600, $100).
  4.  If the data required to answer the question is 0 or empty, you MUST respond with: "I don’t have enough data yet to answer that. Please record more sales or add your products." For example, if totalSales is 0, you cannot answer questions about sales.
  5.  Do NOT guess or invent numbers.
  6.  If the user explicitly asks for advice, provide 1–3 practical, data-backed suggestions using only the provided data.
  7.  Keep answers concise and to the point. Use short paragraphs or bullets when helpful.

  Data:
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
    // If there's no data at all, return the standard message.
    if (input.insights.totalSales === 0 && input.insights.salesTodayCount === 0 && input.insights.totalDeposits === 0 && input.insights.totalWithdrawals === 0) {
        return { answer: "I don’t have enough data yet. Please record more sales to get insights." };
    }

    try {
        const {output} = await prompt(input);
        return output!;
    } catch (error: any) {
        if (error.message && error.message.includes('429 Too Many Requests')) {
            return { answer: "I'm experiencing high demand right now. Please try again in a minute." };
        }
        // For other errors, you might want to re-throw or handle them differently.
        console.error("An unexpected error occurred in getBusinessInsightsFlow:", error);
        return { answer: "Sorry, an unexpected error occurred. Please try again later." };
    }
  }
);
