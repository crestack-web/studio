import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, image, businessId, userId, conversationHistory, userPlan, language, languageName } = body;

    console.log('📡 [Next.js API] Proxying Ask MO request', {
      messageLength: message?.length,
      hasImage: !!image,
      businessId,
    });

    // Call Firebase function
    const firebaseFunctionUrl = 'https://askmo-6kxikgkcjq-uc.a.run.app';
    
    const response = await fetch(firebaseFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        image,
        businessId,
        userId,
        conversationHistory,
        userPlan,
        language,
        languageName,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ [Next.js API] Firebase function error:', errorData);
      return NextResponse.json(
        { error: errorData.error || 'Firebase function error' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ [Next.js API] Firebase function success');

    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ [Next.js API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
