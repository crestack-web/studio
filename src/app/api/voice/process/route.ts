import { NextRequest, NextResponse } from 'next/server';
import { voiceProcessing } from '@/services/voice';
import { getAdminDb } from '@/lib/firebase-admin';
import { type SupportedLanguage } from '@/services/voice';

export async function POST(request: NextRequest) {
  try {
    const adminDb = getAdminDb();
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const businessId = formData.get('businessId') as string;
    const businessCategory = formData.get('businessCategory') as string;
    const languageHint = formData.get('languageHint') as SupportedLanguage | null;

    if (!audioFile || !businessId || !businessCategory) {
      return NextResponse.json(
        { error: 'Missing required fields: audio, businessId, businessCategory' },
        { status: 400 }
      );
    }

    const audioBlob = new Blob([audioFile], { type: audioFile.type });

    const result = await voiceProcessing.processVoiceNote(
      audioBlob,
      userId,
      businessId,
      businessCategory,
      {},
      languageHint || undefined
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to process voice note' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transcript: result.transcript,
      confidenceLevel: result.confidenceLevel,
      detectedLanguage: result.detectedLanguage,
      shouldRequestConfirmation: result.shouldRequestConfirmation,
      voiceSampleId: result.voiceSample?.id
    });

  } catch (error) {
    console.error('Voice processing API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}