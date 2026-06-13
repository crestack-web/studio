'use server';

/**
 * @fileOverview An AI agent that provides financial analysis based on real business data.
 * This agent analyzes revenue, expenses, profit, cash flow, credit sales, and debt tracking.
 * It identifies trends, growth, declines, risks, and opportunities, and provides actionable recommendations.
 *
 * - analyzeFinancials - A function that handles the financial analysis process.
 * - FinancialAnalysisInput - The input type for the analyzeFinancials function.
 * - FinancialAnalysisOutput - The return type for the analyzeFinancials function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FinancialDataSchema = z.object({
  revenue: z.number().describe("Total revenue for the period."),
  expenses: z.number().describe("Total expenses for the period."),
  profit: z.number().describe("Net profit for the period (Revenue - Expenses)."),
  profitMargin: z.number().describe("Profit margin as a percentage."),
  cashBalance: z.number().describe("Current cash balance."),
  cashFlow: z.number().describe("Net cash flow for the period."),
  creditSales: z.number().describe("Total credit sales for the period."),
  outstandingDebt: z.number().describe("Total outstanding debt from credit sales."),
  bankBalance: z.number().describe("Current bank balance."),
  reconciledTransactions: z.number().describe("Number of reconciled transactions."),
  unreconciledTransactions: z.number().describe("Number of unreconciled transactions."),
  previousRevenue: z.number().optional().describe("Revenue from previous period for comparison."),
  previousProfit: z.number().optional().describe("Profit from previous period for comparison."),
  previousExpenses: z.number().optional().describe("Expenses from previous period for comparison."),
  period: z.string().describe("Time period for analysis (e.g., 'this month', 'last 30 days')."),
});

const FinancialAnalysisInputSchema = z.object({
  financialData: FinancialDataSchema.describe("Real financial data for analysis."),
  currency: z.string().describe('The currency symbol (e.g., ₦, $) for formatting monetary values.'),
  language: z.string().optional().describe("UI language code (e.g., 'en', 'fr')."),
  focus: z.string().optional().describe("Specific focus area (e.g., 'profit', 'cash flow', 'expenses')."),
});

export type FinancialAnalysisInput = z.infer<typeof FinancialAnalysisInputSchema>;

const FinancialAnalysisOutputSchema = z.object({
  analysis: z.string().describe('The financial analysis and recommendations.'),
  trends: z.array(z.string()).describe('Identified trends (growth, decline, stability).'),
  risks: z.array(z.string()).describe('Identified risks and concerns.'),
  opportunities: z.array(z.string()).describe('Identified opportunities for improvement.'),
  recommendations: z.array(z.string()).describe('Actionable recommendations.'),
});
export type FinancialAnalysisOutput = z.infer<typeof FinancialAnalysisOutputSchema>;

export async function analyzeFinancials(input: FinancialAnalysisInput): Promise<FinancialAnalysisOutput> {
  return financialAnalysisFlow(input);
}

function normalizeLanguage(language?: string): 'en' | 'fr' {
  return language === 'fr' ? 'fr' : 'en';
}

function notEnoughDataMessage(language: 'en' | 'fr') {
  return language === 'fr'
    ? "Je n'ai pas encore assez de données financières pour analyser. Enregistre quelques ventes et dépenses et réessaie."
    : "I don't have enough financial data yet to analyze. Record some sales and expenses and try again.";
}

function unavailableMessage(language: 'en' | 'fr') {
  return language === 'fr'
    ? "L'analyse financière n'est pas disponible pour le moment. Réessaie bientôt."
    : "Financial analysis isn't available right now. Please try again.";
}

const prompt = ai.definePrompt({
  name: 'financialAnalysisPrompt',
  input: {schema: FinancialAnalysisInputSchema},
  output: {schema: FinancialAnalysisOutputSchema},
  prompt: `You are a financial analyst specializing in small business financial health. Analyze the provided financial data and provide actionable insights.

IMPORTANT RULES (non‑negotiable):
1) ONLY analyze the financial data provided.
2) Do NOT assume missing data. If a section needs data that is not provided, say so plainly.
3) Do NOT hallucinate numbers. Do NOT invent percentages, comparisons, or trends.
4) Do NOT do new calculations. You may restate the provided figures and explain what they mean.
5) Avoid technical jargon. Use simple, everyday language.
6) Keep it professional but human. No fluff, no motivational talk.
7) FORMAT: Output MUST be plain text only. No HTML, no markdown headings, no code blocks.
8) LENGTH: 300–500 words total. Not shorter, not longer.
9) LANGUAGE: If Language is "fr", respond in French. Otherwise respond in English.

Financial Data:
  - Period: {{{financialData.period}}}
  - Currency: {{{currency}}}
  - Revenue: {{{financialData.revenue}}}
  - Expenses: {{{financialData.expenses}}}
  - Profit: {{{financialData.profit}}}
  - Profit Margin: {{{financialData.profitMargin}}}%
  - Cash Balance: {{{financialData.cashBalance}}}
  - Cash Flow: {{{financialData.cashFlow}}}
  - Credit Sales: {{{financialData.creditSales}}}
  - Outstanding Debt: {{{financialData.outstandingDebt}}}
  - Bank Balance: {{{financialData.bankBalance}}}
  - Reconciled Transactions: {{{financialData.reconciledTransactions}}}
  - Unreconciled Transactions: {{{financialData.unreconciledTransactions}}}
{{#if financialData.previousRevenue}}
  - Previous Revenue: {{{financialData.previousRevenue}}}
{{/if}}
{{#if financialData.previousProfit}}
  - Previous Profit: {{{financialData.previousProfit}}}
{{/if}}
{{#if financialData.previousExpenses}}
  - Previous Expenses: {{{financialData.previousExpenses}}}
{{/if}}
{{#if focus}}
  - Focus Area: {{{focus}}}
{{/if}}

  ---

  Owner Request: Analyze the financial health and provide recommendations.

  Output Structure:
  1. Financial Health Summary
  2. Revenue Analysis
  3. Expense Analysis
  4. Profitability Assessment
  5. Cash Flow Evaluation
  6. Credit & Debt Review
  7. Bank Reconciliation Status
  8. Key Trends
  9. Risks & Concerns
  10. Opportunities
  11. Actionable Recommendations

  Style guidelines:
  - Be decision-focused: explain what the numbers mean for what they should do next.
  - Be honest about limits: if you cannot see a trend from the data, say "the data provided does not show a time trend".
  - When you mention totals, clarify they reflect the data provided.
  - Monetary formatting: include thousands separators. Use the Currency symbol provided.
  - If Focus is provided, emphasize that area in your analysis.
`,
});

const financialAnalysisFlow = ai.defineFlow(
  {
    name: 'financialAnalysisFlow',
    inputSchema: FinancialAnalysisInputSchema,
    outputSchema: FinancialAnalysisOutputSchema,
  },
  async input => {
    const language = normalizeLanguage(input.language);
    const hasApiKey = !!(process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY);
    const lacksData =
      input.financialData.revenue === 0 &&
      input.financialData.expenses === 0 &&
      input.financialData.profit === 0;

    if (lacksData) {
      return {
        analysis: notEnoughDataMessage(language),
        trends: [],
        risks: [],
        opportunities: [],
        recommendations: [],
      };
    }

    if (!hasApiKey) {
      return {
        analysis: unavailableMessage(language),
        trends: [],
        risks: [],
        opportunities: [],
        recommendations: [],
      };
    }

    try {
      const {output} = await prompt(input);
      if (output?.analysis) {
        return output;
      }
      return {
        analysis: unavailableMessage(language),
        trends: [],
        risks: [],
        opportunities: [],
        recommendations: [],
      };
    } catch (error: any) {
      console.error("An unexpected error occurred in financialAnalysisFlow:", error);
      return {
        analysis: unavailableMessage(language),
        trends: [],
        risks: [],
        opportunities: [],
        recommendations: [],
      };
    }
  }
);
