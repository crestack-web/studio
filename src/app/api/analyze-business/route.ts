import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAIService } from '@/services/ai/google-ai-service';

/**
 * POST /api/analyze-business
 * Analyze business description using AI to identify:
 * - Business Type (Restaurant, Pharmacy, Retail Store, etc.)
 * - Operational Needs (Inventory, Staff, Payroll, etc.)
 * - Product Types (Dishes, Ingredients, Medicines, etc.)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessName, description } = body;

    if (!businessName || !description) {
      return NextResponse.json(
        { error: 'Business name and description are required' },
        { status: 400 }
      );
    }

    const aiService = getGoogleAIService();

    const prompt = `You are a business intelligence assistant for African entrepreneurs. Analyze the following business information and provide a structured analysis.

Business Name: ${businessName}
Business Description: ${description}

Provide your analysis in the following JSON format (no markdown, no extra text):
{
  "businessType": "Restaurant|Pharmacy|Retail Store|Supermarket|Salon|Barbershop|Bakery|Catering Business|Hotel|Service Business|Agency|Logistics Company|School|Other",
  "businessTypeConfidence": 0.0-1.0,
  "operationalNeeds": ["Inventory Management", "Staff Management", "Payroll", "Appointments", "Menu Management", "Ingredient Tracking", "Expiry Tracking", "Client Management", "Project Tracking"],
  "productTypes": ["Dishes", "Ingredients", "Medicines", "Electronics", "Services", "Beauty Products", "Clothing", "Digital Products"],
  "recommendedCategories": ["Category 1", "Category 2", "Category 3", "Category 4"],
  "recommendedFeatures": ["Feature 1", "Feature 2", "Feature 3", "Feature 4"]
}

Rules:
- businessType: Choose the most accurate type from the list
- operationalNeeds: Select 3-5 relevant needs from the list
- productTypes: Select 2-4 relevant product types from the list
- recommendedCategories: Generate 3-4 specific categories based on the business type (e.g., for restaurant: "Rice Dishes", "Soups", "Drinks", "Ingredients")
- recommendedFeatures: Select 3-4 relevant features to enable (e.g., "Menu Management", "Ingredient Tracking", "Staff Management", "Profit Tracking")
- Ensure all arrays contain items from the provided lists or are specific to the business type
- Return ONLY valid JSON, no markdown formatting`;

    const result = await aiService.generate({ prompt });

    // Parse the AI response
    let analysis;
    try {
      // Extract JSON from the response (AI might wrap it in markdown)
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        analysis = JSON.parse(result.text);
      }
    } catch (error) {
      console.error('Failed to parse AI response:', result.text);
      // Fallback analysis if AI fails
      analysis = {
        businessType: 'Other',
        businessTypeConfidence: 0.5,
        operationalNeeds: ['Inventory Management', 'Staff Management'],
        productTypes: ['Products'],
        recommendedCategories: ['General'],
        recommendedFeatures: ['Inventory', 'Staff Management']
      };
    }

    return NextResponse.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Business analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze business' },
      { status: 500 }
    );
  }
}
