import { NextRequest, NextResponse } from 'next/server';
import { voiceProcessing } from '@/services/voice';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { voiceSampleId, correctedTranscript } = body;

    if (!voiceSampleId || !correctedTranscript) {
      return NextResponse.json(
        { error: 'Missing required fields: voiceSampleId, correctedTranscript' },
        { status: 400 }
      );
    }

    const result = await voiceProcessing.updateTranscript(
      voiceSampleId,
      correctedTranscript,
      userId
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update transcript' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Transcript update API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}