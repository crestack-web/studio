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

const GetBusinessInsightsInputSchema = z.object({
  query: z.string().describe('The question asked by the business owner.'),
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
  prompt: `You are a business assistant. Your goal is to provide factual, short, and calm answers based *only* on the data you have access to.

  - Your answers must be based on historical averages (last 7-30 days).
  - If you do not have enough data to answer a question, you MUST respond with: "I don’t have enough data yet. Please record sales or inventory."
  - Do NOT guess or invent numbers.
  - Do NOT give advice unless explicitly asked.
  - Summarize existing data only. Do not hallucinate insights.

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
    // In the future, we will add tools here to fetch data from Firestore.
    // For now, we simulate the "not enough data" case for all questions.
    const hasEnoughData = false; 

    if (!hasEnoughData) {
        return { answer: "I don’t have enough data yet. Please record sales or inventory." };
    }

    const {output} = await prompt(input);
    return output!;
  }
);
