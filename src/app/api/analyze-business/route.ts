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

    const prompt = `You are a business intelligence assistant for African entrepreneurs using Busmo (a business management platform). Analyze the following business information and provide a structured analysis.

Business Name: ${businessName}
Business Description: ${description}

Provide your analysis in the following JSON format (no markdown, no extra text):
{
  "businessType": "Restaurant|Pharmacy|Retail Store|Supermarket|Salon|Barbershop|Bakery|Catering Business|Hotel|Service Business|Agency|Logistics Company|School|Fashion Store|Electronics Store|Grocery Store|Hardware Store|Other",
  "businessTypeConfidence": 0.0-1.0,
  "operationalNeeds": ["Inventory Management", "Staff Management", "Payroll", "Appointments", "Menu Management", "Ingredient Tracking", "Expiry Tracking", "Client Management", "Project Tracking", "Cash Flow Management", "Sales Tracking", "Expense Tracking", "Credit/Debt Management", "Multi-branch Management", "Supplier Management"],
  "productTypes": ["Dishes", "Ingredients", "Medicines", "Electronics", "Services", "Beauty Products", "Clothing", "Digital Products", "Groceries", "Hardware", "Fashion Items", "Food Items", "Beverages"],
  "recommendedCategories": ["Category 1", "Category 2", "Category 3", "Category 4"],
  "recommendedFeatures": ["Sales Recording", "Inventory Tracking", "Staff Management", "Cash Flow Analysis", "Credit Tracking", "Expense Management", "Multi-branch Support", "Menu Management", "Ingredient Tracking", "Expiry Alerts", "Customer Management", "Supplier Management", "Profit/Loss Reports", "Business Analytics", "Ask MO AI Assistant"]
}

Rules:
- businessType: Choose the most accurate type from the list based on the business description
- businessTypeConfidence: Rate your confidence (0.0-1.0) based on how clearly the business type is defined
- operationalNeeds: Select 3-5 most critical needs from the list that this business type requires
- productTypes: Select 2-4 relevant product types from the list that this business sells/manages
- recommendedCategories: Generate 3-4 specific categories based on the business type (e.g., for restaurant: "Rice Dishes", "Soups & Stews", "Drinks", "Ingredients"; for pharmacy: "Medicines", "Supplements", "Medical Supplies", "Personal Care")
- recommendedFeatures: Select 3-4 most relevant Busmo features for this business type from the list above
- For restaurants: recommend "Menu Management", "Ingredient Tracking", "Expiry Alerts", "Sales Recording"
- For pharmacies: recommend "Inventory Tracking", "Expiry Alerts", "Sales Recording", "Credit Tracking"
- For retail stores: recommend "Sales Recording", "Inventory Tracking", "Cash Flow Analysis", "Staff Management"
- For service businesses: recommend "Staff Management", "Client Management", "Cash Flow Analysis", "Ask MO AI Assistant"
- For multi-location businesses: recommend "Multi-branch Support", "Staff Management", "Inventory Tracking", "Business Analytics"
- Ensure all arrays contain items from the provided lists
- Return ONLY valid JSON, no markdown formatting
- Be specific and accurate based on the actual business description provided`;

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
