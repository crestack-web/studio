'use server';

/**
 * @fileOverview An AI agent that generates daily business insights dynamically from real data.
 * This agent analyzes sales patterns, expenses, inventory, credit sales, and customer behavior.
 * It generates insights such as sales increased, inventory running low, branch performance, cash flow changes.
 *
 * - generateBusinessInsights - A function that handles the business insights generation process.
 * - BusinessInsightsInput - The input type for the generateBusinessInsights function.
 * - BusinessInsightsOutput - The return type for the generateBusinessInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BusinessMetricsSchema = z.object({
  salesToday: z.number().describe("Total sales today."),
  salesYesterday: z.number().describe("Total sales yesterday."),
  salesThisWeek: z.number().describe("Total sales this week."),
  salesLastWeek: z.number().describe("Total sales last week."),
  salesThisMonth: z.number().describe("Total sales this month."),
  salesLastMonth: z.number().describe("Total sales last month."),
  profitToday: z.number().describe("Total profit today."),
  profitYesterday: z.number().describe("Total profit yesterday."),
  expensesToday: z.number().describe("Total expenses today."),
  expensesYesterday: z.number().describe("Total expenses yesterday."),
  cashBalanceToday: z.number().describe("Cash balance today."),
  cashBalanceYesterday: z.number().describe("Cash balance yesterday."),
  lowStockCount: z.number().describe("Number of products with low stock."),
  outOfStockCount: z.number().describe("Number of products out of stock."),
  topProductToday: z.string().optional().describe("Top-selling product today."),
  topProductRevenue: z.number().optional().describe("Revenue from top product today."),
  branchComparison: z.string().optional().describe("Branch performance comparison if multi-branch."),
  customerCountToday: z.number().optional().describe("Number of customers today."),
  customerCountYesterday: z.number().optional().describe("Number of customers yesterday."),
  period: z.string().describe("Time period for insights (e.g., 'today', 'this week')."),
});

const BusinessInsightsInputSchema = z.object({
  metrics: BusinessMetricsSchema.describe("Real business metrics for insight generation."),
  currency: z.string().describe('The currency symbol (e.g., ₦, $) for formatting monetary values.'),
  language: z.string().optional().describe("UI language code (e.g., 'en', 'fr')."),
  maxInsights: z.number().optional().describe("Maximum number of insights to generate (default: 5)."),
});

export type BusinessInsightsInput = z.infer<typeof BusinessInsightsInputSchema>;

const InsightSchema = z.object({
  type: z.string().describe("Type of insight: 'positive', 'negative', 'neutral', 'warning'."),
  title: z.string().describe("Short title for the insight."),
  description: z.string().describe("Detailed description of the insight."),
  actionable: z.boolean().describe("Whether the insight requires action."),
  priority: z.string().describe("Priority level: 'high', 'medium', 'low'."),
});

const BusinessInsightsOutputSchema = z.object({
  insights: z.array(InsightSchema).describe("Generated business insights."),
  summary: z.string().describe("Overall summary of business performance."),
  recommendations: z.array(z.string()).describe("Actionable recommendations based on insights."),
});
export type BusinessInsightsOutput = z.infer<typeof BusinessInsightsOutputSchema>;

export async function generateBusinessInsights(input: BusinessInsightsInput): Promise<BusinessInsightsOutput> {
  return businessInsightsFlow(input);
}

function normalizeLanguage(language?: string): 'en' | 'fr' {
  return language === 'fr' ? 'fr' : 'en';
}

function notEnoughDataMessage(language: 'en' | 'fr') {
  return language === 'fr'
    ? "Je n'ai pas encore assez de données pour générer des insights. Enregistre quelques ventes et dépenses et réessaie."
    : "I don't have enough data yet to generate insights. Record some sales and expenses and try again.";
}

function unavailableMessage(language: 'en' | 'fr') {
  return language === 'fr'
    ? "La génération d'insights n'est pas disponible pour le moment. Réessaie bientôt."
    : "Insights generation isn't available right now. Please try again.";
}

const prompt = ai.definePrompt({
  name: 'businessInsightsPrompt',
  input: {schema: BusinessInsightsInputSchema},
  output: {schema: BusinessInsightsOutputSchema},
  prompt: `You are a business intelligence analyst. Generate actionable insights from the provided business metrics.

IMPORTANT RULES (non‑negotiable):
1) ONLY analyze the metrics provided.
2) Do NOT assume missing data. If a section needs data that is not provided, say so plainly.
3) Do NOT hallucinate numbers. Do NOT invent percentages, comparisons, or trends.
4) Do NOT do new calculations. You may restate the provided figures and explain what they mean.
5) Avoid technical jargon. Use simple, everyday language.
6) Keep it professional but human. No fluff, no motivational talk.
7) FORMAT: Output MUST be plain text only. No HTML, no markdown headings, no code blocks.
8) LENGTH: 200–400 words total. Not shorter, not longer.
9) LANGUAGE: If Language is "fr", respond in French. Otherwise respond in English.
10) Generate 3-5 insights maximum. Focus on the most important changes.

Business Metrics:
  - Period: {{{metrics.period}}}
  - Currency: {{{currency}}}
  - Sales Today: {{{metrics.salesToday}}}
  - Sales Yesterday: {{{metrics.salesYesterday}}}
  - Sales This Week: {{{metrics.salesThisWeek}}}
  - Sales Last Week: {{{metrics.salesLastWeek}}}
  - Sales This Month: {{{metrics.salesThisMonth}}}
  - Sales Last Month: {{{metrics.salesLastMonth}}}
  - Profit Today: {{{metrics.profitToday}}}
  - Profit Yesterday: {{{metrics.profitYesterday}}}
  - Expenses Today: {{{metrics.expensesToday}}}
  - Expenses Yesterday: {{{metrics.expensesYesterday}}}
  - Cash Balance Today: {{{metrics.cashBalanceToday}}}
  - Cash Balance Yesterday: {{{metrics.cashBalanceYesterday}}}
  - Low Stock Count: {{{metrics.lowStockCount}}}
  - Out of Stock Count: {{{metrics.outOfStockCount}}}
{{#if metrics.topProductToday}}
  - Top Product Today: {{{metrics.topProductToday}}} ({{{currency}}}{{{metrics.topProductRevenue}}})
{{/if}}
{{#if metrics.branchComparison}}
  - Branch Comparison: {{{metrics.branchComparison}}}
{{/if}}
{{#if metrics.customerCountToday}}
  - Customers Today: {{{metrics.customerCountToday}}}
  - Customers Yesterday: {{{metrics.customerCountYesterday}}}
{{/if}}

  ---

  Owner Request: Generate daily business insights.

  Output Structure:
  For each insight, provide:
  1. Type (positive/negative/neutral/warning)
  2. Title (short, punchy)
  3. Description (what changed and what it means)
  4. Actionable (yes/no)
  5. Priority (high/medium/low)

  Then provide:
  - Overall Summary
  - Actionable Recommendations

  Style guidelines:
  - Be concise and impactful.
  - Focus on significant changes (10%+ difference).
  - Highlight urgent issues (out of stock, cash flow drops).
  - Celebrate wins (sales increases, profit growth).
  - Monetary formatting: include thousands separators. Use the Currency symbol provided.
  - Make insights specific and data-driven.
`,
});

const businessInsightsFlow = ai.defineFlow(
  {
    name: 'businessInsightsFlow',
    inputSchema: BusinessInsightsInputSchema,
    outputSchema: BusinessInsightsOutputSchema,
  },
  async input => {
    const language = normalizeLanguage(input.language);
    const hasApiKey = !!(process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY);
    const lacksData =
      input.metrics.salesToday === 0 &&
      input.metrics.salesYesterday === 0 &&
      input.metrics.salesThisWeek === 0;

    if (lacksData) {
      return {
        insights: [],
        summary: notEnoughDataMessage(language),
        recommendations: [],
      };
    }

    if (!hasApiKey) {
      return {
        insights: [],
        summary: unavailableMessage(language),
        recommendations: [],
      };
    }

    try {
      const {output} = await prompt(input);
      if (output?.summary) {
        return output;
      }
      return {
        insights: [],
        summary: unavailableMessage(language),
        recommendations: [],
      };
    } catch (error: any) {
      console.error("An unexpected error occurred in businessInsightsFlow:", error);
      return {
        insights: [],
        summary: unavailableMessage(language),
        recommendations: [],
      };
    }
  }
);
