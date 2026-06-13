'use server';

/**
 * @fileOverview An AI agent that provides inventory intelligence based on real inventory data.
 * This agent analyzes fast-moving products, slow-moving products, dead stock, low inventory, and overstock situations.
 * It provides recommendations such as restock urgently, reduce ordering, bundle products, and create promotions.
 *
 * - analyzeInventory - A function that handles the inventory analysis process.
 * - InventoryIntelligenceInput - The input type for the analyzeInventory function.
 * - InventoryIntelligenceOutput - The return type for the analyzeInventory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProductDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  stock: z.number(),
  costPrice: z.number(),
  sellingPrice: z.number(),
  lowStockThreshold: z.number(),
  totalSold: z.number(),
  lastSoldDate: z.string().optional(),
  daysSinceLastSale: z.number().optional(),
  category: z.string().optional(),
});

const InventoryDataSchema = z.object({
  totalProducts: z.number().describe("Total number of products in inventory."),
  totalInventoryValue: z.number().describe("Total value of inventory (stock × cost price)."),
  lowStockProducts: z.array(ProductDataSchema).describe("Products with stock below threshold."),
  outOfStockProducts: z.array(ProductDataSchema).describe("Products with zero stock."),
  fastMovingProducts: z.array(ProductDataSchema).describe("Products with high sales velocity."),
  slowMovingProducts: z.array(ProductDataSchema).describe("Products with low sales velocity."),
  deadStockProducts: z.array(ProductDataSchema).describe("Products not sold in 30+ days."),
  overstockProducts: z.array(ProductDataSchema).describe("Products with excessive stock."),
  period: z.string().describe("Time period for analysis (e.g., 'last 30 days')."),
});

const InventoryIntelligenceInputSchema = z.object({
  inventoryData: InventoryDataSchema.describe("Real inventory data for analysis."),
  currency: z.string().describe('The currency symbol (e.g., ₦, $) for formatting monetary values.'),
  language: z.string().optional().describe("UI language code (e.g., 'en', 'fr')."),
  focus: z.string().optional().describe("Specific focus area (e.g., 'restock', 'dead stock', 'overstock')."),
});

export type InventoryIntelligenceInput = z.infer<typeof InventoryIntelligenceInputSchema>;

const InventoryIntelligenceOutputSchema = z.object({
  analysis: z.string().describe('The inventory analysis and recommendations.'),
  urgentActions: z.array(z.string()).describe('Urgent actions needed (e.g., restock immediately).'),
  restockRecommendations: z.array(z.string()).describe('Products to restock and quantities.'),
  reductionRecommendations: z.array(z.string()).describe('Products to reduce ordering for.'),
  promotionOpportunities: z.array(z.string()).describe('Products suitable for promotions or bundles.'),
  deadStockActions: z.array(z.string()).describe('Actions for dead stock clearance.'),
});
export type InventoryIntelligenceOutput = z.infer<typeof InventoryIntelligenceOutputSchema>;

export async function analyzeInventory(input: InventoryIntelligenceInput): Promise<InventoryIntelligenceOutput> {
  return inventoryIntelligenceFlow(input);
}

function normalizeLanguage(language?: string): 'en' | 'fr' {
  return language === 'fr' ? 'fr' : 'en';
}

function notEnoughDataMessage(language: 'en' | 'fr') {
  return language === 'fr'
    ? "Je n'ai pas encore assez de données d'inventaire pour analyser. Ajoute tes produits et enregistre quelques ventes et réessaie."
    : "I don't have enough inventory data yet to analyze. Add your products and record some sales and try again.";
}

function unavailableMessage(language: 'en' | 'fr') {
  return language === 'fr'
    ? "L'analyse d'inventaire n'est pas disponible pour le moment. Réessaie bientôt."
    : "Inventory analysis isn't available right now. Please try again.";
}

const prompt = ai.definePrompt({
  name: 'inventoryIntelligencePrompt',
  input: {schema: InventoryIntelligenceInputSchema},
  output: {schema: InventoryIntelligenceOutputSchema},
  prompt: `You are an inventory management specialist. Analyze the provided inventory data and provide actionable insights for optimizing stock levels.

IMPORTANT RULES (non‑negotiable):
1) ONLY analyze the inventory data provided.
2) Do NOT assume missing data. If a section needs data that is not provided, say so plainly.
3) Do NOT hallucinate numbers. Do NOT invent percentages, comparisons, or trends.
4) Do NOT do new calculations. You may restate the provided figures and explain what they mean.
5) Avoid technical jargon. Use simple, everyday language.
6) Keep it professional but human. No fluff, no motivational talk.
7) FORMAT: Output MUST be plain text only. No HTML, no markdown headings, no code blocks.
8) LENGTH: 300–500 words total. Not shorter, not longer.
9) LANGUAGE: If Language is "fr", respond in French. Otherwise respond in English.

Inventory Data:
  - Period: {{{inventoryData.period}}}
  - Currency: {{{currency}}}
  - Total Products: {{{inventoryData.totalProducts}}}
  - Total Inventory Value: {{{inventoryData.totalInventoryValue}}}
  - Low Stock Products: {{inventoryData.lowStockProducts.length}}
  - Out of Stock Products: {{inventoryData.outOfStockProducts.length}}
  - Fast Moving Products: {{inventoryData.fastMovingProducts.length}}
  - Slow Moving Products: {{inventoryData.slowMovingProducts.length}}
  - Dead Stock Products: {{inventoryData.deadStockProducts.length}}
  - Overstock Products: {{inventoryData.overstockProducts.length}}
{{#if focus}}
  - Focus Area: {{{focus}}}
{{/if}}

  ---

  Owner Request: Analyze inventory health and provide recommendations.

  Output Structure:
  1. Inventory Health Summary
  2. Stock Level Analysis
  3. Fast-Moving Products
  4. Slow-Moving Products
  5. Dead Stock Assessment
  6. Overstock Evaluation
  7. Urgent Restock Needs
  8. Reduction Opportunities
  9. Promotion & Bundle Opportunities
  10. Dead Stock Clearance Actions
  11. Overall Recommendations

  Style guidelines:
  - Be decision-focused: explain what the numbers mean for what they should do next.
  - Be honest about limits: if you cannot see a trend from the data, say "the data provided does not show a time trend".
  - When you mention totals, clarify they reflect the data provided.
  - Monetary formatting: include thousands separators. Use the Currency symbol provided.
  - If Focus is provided, emphasize that area in your analysis.
  - Prioritize urgent actions (out of stock, critical low stock) over optimization.
`,
});

const inventoryIntelligenceFlow = ai.defineFlow(
  {
    name: 'inventoryIntelligenceFlow',
    inputSchema: InventoryIntelligenceInputSchema,
    outputSchema: InventoryIntelligenceOutputSchema,
  },
  async input => {
    const language = normalizeLanguage(input.language);
    const hasApiKey = !!(process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY);
    const lacksData =
      input.inventoryData.totalProducts === 0;

    if (lacksData) {
      return {
        analysis: notEnoughDataMessage(language),
        urgentActions: [],
        restockRecommendations: [],
        reductionRecommendations: [],
        promotionOpportunities: [],
        deadStockActions: [],
      };
    }

    if (!hasApiKey) {
      return {
        analysis: unavailableMessage(language),
        urgentActions: [],
        restockRecommendations: [],
        reductionRecommendations: [],
        promotionOpportunities: [],
        deadStockActions: [],
      };
    }

    try {
      const {output} = await prompt(input);
      if (output?.analysis) {
        return output;
      }
      return {
        analysis: unavailableMessage(language),
        urgentActions: [],
        restockRecommendations: [],
        reductionRecommendations: [],
        promotionOpportunities: [],
        deadStockActions: [],
      };
    } catch (error: any) {
      console.error("An unexpected error occurred in inventoryIntelligenceFlow:", error);
      return {
        analysis: unavailableMessage(language),
        urgentActions: [],
        restockRecommendations: [],
        reductionRecommendations: [],
        promotionOpportunities: [],
        deadStockActions: [],
      };
    }
  }
);
