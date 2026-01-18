'use server';

/**
 * @fileOverview An AI agent that provides business insights based on user questions.
 *
 * - getBusinessInsights - A function that handles the business insights process.
 * - GetBusinessInsightsInput - The input type for the getBusinessInsights function.
 * - GetBusinessInsightsOutput - The return type for the getBusinessInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SaleSchema = z.object({
  id: z.string(),
  amount: z.number(),
  paymentType: z.string(),
  source: z.string(),
  timestamp: z.string().describe("The ISO 8601 timestamp of when the sale occurred."),
  productId: z.string().optional(),
});

const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  cost: z.number(),
  quantity: z.number().describe("Current stock level."),
});


const GetBusinessInsightsInputSchema = z.object({
  query: z.string().describe('The question asked by the business owner.'),
  sales: z.array(SaleSchema).describe('List of sales transactions for the business for a recent period.'),
  products: z.array(ProductSchema).describe('List of all products the business sells.'),
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
  prompt: `You are an expert business analyst AI for a small business owner. Your name is Busmo. Your goal is to provide factual, short, and calm answers based *only* on the data provided. You must also be able to provide simple forecasts based on the data.

  - Your answers must be based on the provided sales and product data.
  - All monetary values should be formatted with the currency symbol provided.
  - If you do not have enough data to answer a question, you MUST respond with: "I don’t have enough data yet. Please record more sales or add your products."
  - Do NOT guess or invent numbers.
  - Do NOT give advice unless explicitly asked.
  - When forecasting, clearly state that it's a projection based on past data (e.g., "Based on your sales from the last week, you are on track to...").
  - Keep answers concise and to the point.
  - A product's profit is its price minus its cost. Total profit is the sum of profits from all sales.
  - "Running low" means the stock quantity is 10 or less.

  Data:
  Currency: {{{currency}}}

  Products:
  {{#each products}}
  - ID: {{id}}, Name: {{name}}, Price: {{price}}, Cost: {{cost}}, Stock: {{quantity}}
  {{/each}}

  Sales:
  {{#each sales}}
  - ID: {{id}}, Amount: {{amount}}, Timestamp: {{timestamp}}, Product ID: {{productId}}
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
    // If there's no data, return the standard message.
    if (!input.sales || input.sales.length === 0) {
        return { answer: "I don’t have enough data yet. Please record more sales to get insights." };
    }

    const {output} = await prompt(input);
    return output!;
  }
);
