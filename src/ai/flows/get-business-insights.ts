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
  prompt: `You are a business consultant for African SMEs. Your goal is to provide short, clear answers with key numbers to business owners based on their questions.

  Question: {{{query}}}
  
  Answer in 1-2 lines. No advice unless asked.`,
});

const getBusinessInsightsFlow = ai.defineFlow(
  {
    name: 'getBusinessInsightsFlow',
    inputSchema: GetBusinessInsightsInputSchema,
    outputSchema: GetBusinessInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
