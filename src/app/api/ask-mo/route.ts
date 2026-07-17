import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, businessId, userId } = await request.json();

    if (!message || !businessId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: message, businessId, userId' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      answer: `I received: "${message}". Business: ${businessId}, User: ${userId}`,
      intent: { intent: 'information', confidence: 0.5 },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, businessId, userId } = body;

    if (!action || !businessId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: action, businessId, userId' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Action ${action} executed`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}