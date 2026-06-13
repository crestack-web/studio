'use server';

/**
 * @fileOverview An AI agent that provides credit sales assistance based on real customer data.
 * This agent analyzes outstanding balances, overdue customers, and collection risks.
 * It generates follow-up messages, collection reminders, and recovery recommendations.
 *
 * - analyzeCreditSales - A function that handles the credit sales analysis process.
 * - CreditSalesAssistantInput - The input type for the analyzeCreditSales function.
 * - CreditSalesAssistantOutput - The return type for the analyzeCreditSales function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CustomerDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string().optional(),
  outstandingBalance: z.number(),
  totalCreditSales: z.number(),
  overdueAmount: z.number(),
  daysOverdue: z.number(),
  lastPaymentDate: z.string().optional(),
  lastPurchaseDate: z.string().optional(),
  paymentHistory: z.string().optional().describe("Payment behavior: 'good', 'fair', 'poor'."),
});

const CreditSalesDataSchema = z.object({
  totalCreditSales: z.number().describe("Total credit sales for the period."),
  totalOutstanding: z.number().describe("Total outstanding debt from credit sales."),
  totalOverdue: z.number().describe("Total overdue amount."),
  totalCollected: z.number().describe("Total amount collected from credit sales."),
  collectionRate: z.number().describe("Collection rate as a percentage."),
  overdueCustomers: z.array(CustomerDataSchema).describe("Customers with overdue payments."),
  highRiskCustomers: z.array(CustomerDataSchema).describe("Customers with high collection risk."),
  recentCreditSales: z.number().describe("Credit sales in the last 7 days."),
  period: z.string().describe("Time period for analysis (e.g., 'last 30 days')."),
});

const CreditSalesAssistantInputSchema = z.object({
  creditData: CreditSalesDataSchema.describe("Real credit sales data for analysis."),
  currency: z.string().describe('The currency symbol (e.g., ₦, $) for formatting monetary values.'),
  language: z.string().optional().describe("UI language code (e.g., 'en', 'fr')."),
  focus: z.string().optional().describe("Specific focus area (e.g., 'overdue', 'collection', 'follow-up')."),
});

export type CreditSalesAssistantInput = z.infer<typeof CreditSalesAssistantInputSchema>;

const CreditSalesAssistantOutputSchema = z.object({
  analysis: z.string().describe('The credit sales analysis and recommendations.'),
  followUpMessages: z.array(z.object({
    customerName: z.string(),
    message: z.string(),
    priority: z.string().describe("Priority level: 'high', 'medium', 'low'."),
  })).describe('Personalized follow-up messages for customers.'),
  collectionReminders: z.array(z.string()).describe('Collection reminders for the business owner.'),
  recoveryRecommendations: z.array(z.string()).describe('Strategies for debt recovery.'),
  riskAssessment: z.string().describe('Overall risk assessment of credit sales portfolio.'),
});
export type CreditSalesAssistantOutput = z.infer<typeof CreditSalesAssistantOutputSchema>;

export async function analyzeCreditSales(input: CreditSalesAssistantInput): Promise<CreditSalesAssistantOutput> {
  return creditSalesAssistantFlow(input);
}

function normalizeLanguage(language?: string): 'en' | 'fr' {
  return language === 'fr' ? 'fr' : 'en';
}

function notEnoughDataMessage(language: 'en' | 'fr') {
  return language === 'fr'
    ? "Je n'ai pas encore assez de données de ventes à crédit pour analyser. Enregistre quelques ventes à crédit et réessaie."
    : "I don't have enough credit sales data yet to analyze. Record some credit sales and try again.";
}

function unavailableMessage(language: 'en' | 'fr') {
  return language === 'fr'
    ? "L'assistant ventes à crédit n'est pas disponible pour le moment. Réessaie bientôt."
    : "Credit sales assistant isn't available right now. Please try again.";
}

const prompt = ai.definePrompt({
  name: 'creditSalesAssistantPrompt',
  input: {schema: CreditSalesAssistantInputSchema},
  output: {schema: CreditSalesAssistantOutputSchema},
  prompt: `You are a credit sales and collections specialist. Analyze the provided credit sales data and provide actionable insights for managing customer debt.

IMPORTANT RULES (non‑negotiable):
1) ONLY analyze the credit sales data provided.
2) Do NOT assume missing data. If a section needs data that is not provided, say so plainly.
3) Do NOT hallucinate numbers. Do NOT invent percentages, comparisons, or trends.
4) Do NOT do new calculations. You may restate the provided figures and explain what they mean.
5) Avoid technical jargon. Use simple, everyday language.
6) Keep it professional but human. No fluff, no motivational talk.
7) FORMAT: Output MUST be plain text only. No HTML, no markdown headings, no code blocks.
8) LENGTH: 300–500 words total. Not shorter, not longer.
9) LANGUAGE: If Language is "fr", respond in French. Otherwise respond in English.

Credit Sales Data:
  - Period: {{{creditData.period}}}
  - Currency: {{{currency}}}
  - Total Credit Sales: {{{creditData.totalCreditSales}}}
  - Total Outstanding: {{{creditData.totalOutstanding}}}
  - Total Overdue: {{{creditData.totalOverdue}}}
  - Total Collected: {{{creditData.totalCollected}}}
  - Collection Rate: {{{creditData.collectionRate}}}%
  - Overdue Customers: {{creditData.overdueCustomers.length}}
  - High-Risk Customers: {{creditData.highRiskCustomers.length}}
  - Recent Credit Sales: {{{creditData.recentCreditSales}}}
{{#if focus}}
  - Focus Area: {{{focus}}}
{{/if}}

  ---

  Owner Request: Analyze credit sales health and provide collection recommendations.

  Output Structure:
  1. Credit Sales Health Summary
  2. Outstanding Debt Analysis
  3. Overdue Payment Assessment
  4. Collection Rate Evaluation
  5. Customer Risk Analysis
  6. Follow-Up Messages (personalized for each overdue customer)
  7. Collection Reminders
  8. Recovery Strategies
  9. Risk Assessment
  10. Overall Recommendations

  Style guidelines:
  - Be decision-focused: explain what the numbers mean for what they should do next.
  - Be honest about limits: if you cannot see a trend from the data, say "the data provided does not show a time trend".
  - When you mention totals, clarify they reflect the data provided.
  - Monetary formatting: include thousands separators. Use the Currency symbol provided.
  - If Focus is provided, emphasize that area in your analysis.
  - Prioritize high-risk customers and large overdue amounts.
  - Generate personalized follow-up messages that are professional but firm.
`,
});

const creditSalesAssistantFlow = ai.defineFlow(
  {
    name: 'creditSalesAssistantFlow',
    inputSchema: CreditSalesAssistantInputSchema,
    outputSchema: CreditSalesAssistantOutputSchema,
  },
  async input => {
    const language = normalizeLanguage(input.language);
    const hasApiKey = !!(process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY);
    const lacksData =
      input.creditData.totalCreditSales === 0;

    if (lacksData) {
      return {
        analysis: notEnoughDataMessage(language),
        followUpMessages: [],
        collectionReminders: [],
        recoveryRecommendations: [],
        riskAssessment: 'No data available for assessment.',
      };
    }

    if (!hasApiKey) {
      return {
        analysis: unavailableMessage(language),
        followUpMessages: [],
        collectionReminders: [],
        recoveryRecommendations: [],
        riskAssessment: 'Service unavailable.',
      };
    }

    try {
      const {output} = await prompt(input);
      if (output?.analysis) {
        return output;
      }
      return {
        analysis: unavailableMessage(language),
        followUpMessages: [],
        collectionReminders: [],
        recoveryRecommendations: [],
        riskAssessment: 'Service unavailable.',
      };
    } catch (error: any) {
      console.error("An unexpected error occurred in creditSalesAssistantFlow:", error);
      return {
        analysis: unavailableMessage(language),
        followUpMessages: [],
        collectionReminders: [],
        recoveryRecommendations: [],
        riskAssessment: 'Service unavailable.',
      };
    }
  }
);
