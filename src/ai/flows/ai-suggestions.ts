'use server';

/**
 * @fileOverview An AI agent that generates smart suggestions based on real business patterns.
 * This agent analyzes sales patterns, expenses, inventory, credit sales, and customer behavior.
 * It generates suggestions such as follow up with overdue customers, restock products, reduce orders, investigate expenses.
 *
 * - generateAISuggestions - A function that handles the AI suggestions generation process.
 * - AISuggestionsInput - The input type for the generateAISuggestions function.
 * - AISuggestionsOutput - The return type for the generateAISuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BusinessPatternsSchema = z.object({
  salesPatterns: z.object({
    topSellingProducts: z.array(z.object({
      name: z.string(),
      revenue: z.number(),
      quantity: z.number(),
      trend: z.string().optional().describe("Trend: 'up', 'down', 'stable'."),
    })).describe("Top-selling products with trends."),
    decliningProducts: z.array(z.object({
      name: z.string(),
      previousRevenue: z.number(),
      currentRevenue: z.number(),
      declinePercent: z.number(),
    })).optional().describe("Products with declining sales."),
    growingCategories: z.array(z.string()).optional().describe("Product categories with growth."),
  }),
  expensePatterns: z.object({
    topExpenseCategories: z.array(z.object({
      category: z.string(),
      amount: z.number(),
      trend: z.string().optional().describe("Trend: 'up', 'down', 'stable'."),
    })).describe("Top expense categories with trends."),
    risingExpenses: z.array(z.object({
      category: z.string(),
      previousAmount: z.number(),
      currentAmount: z.number(),
      increasePercent: z.number(),
    })).optional().describe("Expense categories with significant increases."),
  }),
  inventoryPatterns: z.object({
    urgentRestock: z.array(z.object({
      name: z.string(),
      stock: z.number(),
      threshold: z.number(),
      dailySales: z.number(),
      daysUntilStockout: z.number(),
    })).describe("Products needing urgent restock."),
    overstockItems: z.array(z.object({
      name: z.string(),
      stock: z.number(),
      estimatedDaysToSell: z.number(),
      value: z.number(),
    })).optional().describe("Products with excessive stock."),
    slowMovingItems: z.array(z.object({
      name: z.string(),
      stock: z.number(),
      daysSinceLastSale: z.number(),
    })).optional().describe("Products not selling quickly."),
  }),
  creditPatterns: z.object({
    overdueCustomers: z.array(z.object({
      name: z.string(),
      amount: z.number(),
      daysOverdue: z.number(),
    })).describe("Customers with overdue payments."),
    highRiskCustomers: z.array(z.object({
      name: z.string(),
      outstandingBalance: z.number(),
      paymentHistory: z.string(),
    })).optional().describe("Customers with high collection risk."),
  }),
  customerPatterns: z.object({
    repeatCustomers: z.number().optional().describe("Number of repeat customers."),
    newCustomers: z.number().optional().describe("Number of new customers."),
    topCustomers: z.array(z.object({
      name: z.string(),
      totalPurchases: z.number(),
    })).optional().describe("Top customers by purchase volume."),
  }),
  period: z.string().describe("Time period for pattern analysis (e.g., 'last 30 days')."),
});

const AISuggestionsInputSchema = z.object({
  patterns: BusinessPatternsSchema.describe("Real business patterns for suggestion generation."),
  currency: z.string().describe('The currency symbol (e.g., ₦, $) for formatting monetary values.'),
  language: z.string().optional().describe("UI language code (e.g., 'en', 'fr')."),
  maxSuggestions: z.number().optional().describe("Maximum number of suggestions to generate (default: 5)."),
});

export type AISuggestionsInput = z.infer<typeof AISuggestionsInputSchema>;

const SuggestionSchema = z.object({
  category: z.string().describe("Category: 'sales', 'expenses', 'inventory', 'credit', 'customers', 'general'."),
  priority: z.string().describe("Priority level: 'high', 'medium', 'low'."),
  title: z.string().describe("Short, actionable title."),
  description: z.string().describe("Detailed explanation of the suggestion."),
  action: z.string().describe("Specific action to take."),
  expectedImpact: z.string().optional().describe("Expected impact of taking the action."),
});

const AISuggestionsOutputSchema = z.object({
  suggestions: z.array(SuggestionSchema).describe("Generated AI suggestions."),
  summary: z.string().describe("Overall summary of business patterns and opportunities."),
});
export type AISuggestionsOutput = z.infer<typeof AISuggestionsOutputSchema>;

export async function generateAISuggestions(input: AISuggestionsInput): Promise<AISuggestionsOutput> {
  return aiSuggestionsFlow(input);
}

function normalizeLanguage(language?: string): 'en' | 'fr' {
  return language === 'fr' ? 'fr' : 'en';
}

function notEnoughDataMessage(language: 'en' | 'fr') {
  return language === 'fr'
    ? "Je n'ai pas encore assez de données pour générer des suggestions. Enregistre quelques ventes et dépenses et réessaie."
    : "I don't have enough data yet to generate suggestions. Record some sales and expenses and try again.";
}

function unavailableMessage(language: 'en' | 'fr') {
  return language === 'fr'
    ? "La génération de suggestions n'est pas disponible pour le moment. Réessaie bientôt."
    : "Suggestions generation isn't available right now. Please try again.";
}

const prompt = ai.definePrompt({
  name: 'aiSuggestionsPrompt',
  input: {schema: AISuggestionsInputSchema},
  output: {schema: AISuggestionsOutputSchema},
  prompt: `You are a business advisor specializing in identifying opportunities and risks. Generate actionable suggestions based on the provided business patterns.

IMPORTANT RULES (non‑negotiable):
1) ONLY analyze the patterns provided.
2) Do NOT assume missing data. If a section needs data that is not provided, say so plainly.
3) Do NOT hallucinate numbers. Do NOT invent percentages, comparisons, or trends.
4) Do NOT do new calculations. You may restate the provided figures and explain what they mean.
5) Avoid technical jargon. Use simple, everyday language.
6) Keep it professional but human. No fluff, no motivational talk.
7) FORMAT: Output MUST be plain text only. No HTML, no markdown headings, no code blocks.
8) LENGTH: 200–400 words total. Not shorter, not longer.
9) LANGUAGE: If Language is "fr", respond in French. Otherwise respond in English.
10) Generate 3-5 suggestions maximum. Focus on high-priority, high-impact actions.

Business Patterns:
  - Period: {{{patterns.period}}}
  - Currency: {{{currency}}}
  - Top Selling Products: {{patterns.salesPatterns.topSellingProducts.length}}
  - Declining Products: {{patterns.salesPatterns.decliningProducts?.length || 0}}
  - Growing Categories: {{patterns.salesPatterns.growingCategories?.length || 0}}
  - Top Expense Categories: {{patterns.expensePatterns.topExpenseCategories.length}}
  - Rising Expenses: {{patterns.expensePatterns.risingExpenses?.length || 0}}
  - Urgent Restock: {{patterns.inventoryPatterns.urgentRestock.length}}
  - Overstock Items: {{patterns.inventoryPatterns.overstockItems?.length || 0}}
  - Slow Moving Items: {{patterns.inventoryPatterns.slowMovingItems?.length || 0}}
  - Overdue Customers: {{patterns.creditPatterns.overdueCustomers.length}}
  - High-Risk Customers: {{patterns.creditPatterns.highRiskCustomers?.length || 0}}
  - Repeat Customers: {{patterns.customerPatterns.repeatCustomers || 0}}
  - New Customers: {{patterns.customerPatterns.newCustomers || 0}}

  ---

  Owner Request: Generate smart business suggestions.

  Output Structure:
  For each suggestion, provide:
  1. Category (sales/expenses/inventory/credit/customers/general)
  2. Priority (high/medium/low)
  3. Title (short, actionable)
  4. Description (what the pattern shows and why it matters)
  5. Action (specific step to take)
  6. Expected Impact (what result to expect)

  Then provide:
  - Overall Summary

  Style guidelines:
  - Be concise and action-oriented.
  - Prioritize urgent issues (out of stock, overdue payments, rising expenses).
  - Focus on high-impact opportunities (growing categories, top products).
  - Make suggestions specific and data-driven.
  - Monetary formatting: include thousands separators. Use the Currency symbol provided.
  - Each suggestion should be immediately actionable.
`,
});

const aiSuggestionsFlow = ai.defineFlow(
  {
    name: 'aiSuggestionsFlow',
    inputSchema: AISuggestionsInputSchema,
    outputSchema: AISuggestionsOutputSchema,
  },
  async input => {
    const language = normalizeLanguage(input.language);
    const hasApiKey = !!(process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY);
    const lacksData =
      input.patterns.salesPatterns.topSellingProducts.length === 0 &&
      input.patterns.inventoryPatterns.urgentRestock.length === 0 &&
      input.patterns.creditPatterns.overdueCustomers.length === 0;

    if (lacksData) {
      return {
        suggestions: [],
        summary: notEnoughDataMessage(language),
      };
    }

    if (!hasApiKey) {
      return {
        suggestions: [],
        summary: unavailableMessage(language),
      };
    }

    try {
      const {output} = await prompt(input);
      if (output?.summary) {
        return output;
      }
      return {
        suggestions: [],
        summary: unavailableMessage(language),
      };
    } catch (error: any) {
      console.error("An unexpected error occurred in aiSuggestionsFlow:", error);
      return {
        suggestions: [],
        summary: unavailableMessage(language),
      };
    }
  }
);
