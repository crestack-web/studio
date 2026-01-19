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
    lowStockProducts: z.array(ProductInsightSchema).describe("A list of products with a stock quantity of 10 or less."),
    salesTodayCount: z.number().describe("The number of individual sales made today."),
    salesTodayTotal: z.number().describe("The total revenue from sales made today."),
    profitToday: z.number().describe("The net profit from sales made today."),
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
  1.  You MUST NOT perform any calculations, forecasts, or generate numbers yourself. Your answers must be based *only* on the data provided below.
  2.  All monetary values in your answer must be formatted with the currency symbol provided.
  3.  If the data required to answer the question is 0 or empty, you MUST respond with: "I don’t have enough data yet to answer that. Please record more sales or add your products." For example, if totalSales is 0, you cannot answer questions about sales.
  4.  Do NOT guess or invent numbers.
  5.  Do NOT give advice unless explicitly asked.
  6.  Keep answers concise and to the point.

  Data:
  - Currency: {{{currency}}}
  - Total Sales Revenue: {{{insights.totalSales}}}
  - Total Profit: {{{insights.totalProfit}}}
  - Number of Sales Today: {{{insights.salesTodayCount}}}
  - Total Revenue Today: {{{insights.salesTodayTotal}}}
  - Profit Today: {{{insights.profitToday}}}
  - Best Selling Product: {{#if insights.bestSellingProduct}}{{insights.bestSellingProduct.name}} (Sold {{insights.bestSellingProduct.quantity}} units){{else}}None{{/if}}
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
    if (input.insights.totalSales === 0 && input.insights.salesTodayCount === 0) {
        return { answer: "I don’t have enough data yet. Please record more sales to get insights." };
    }

    const {output} = await prompt(input);
    return output!;
  }
);
