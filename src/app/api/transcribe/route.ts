import { NextRequest, NextResponse } from 'next/server';
import { getMistralClient, STT_MODEL } from '@/ai/mistral';

const MIME_EXTENSIONS: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/mp3': 'mp3',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/wave': 'wav',
  'audio/ogg': 'ogg',
  'audio/mp4': 'm4a',
  'audio/aac': 'aac',
  'audio/flac': 'flac',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { audioBase64, mimeType, language } = body;

    if (!audioBase64) {
      return NextResponse.json({ error: 'Missing audioBase64' }, { status: 400 });
    }

    // Strip the data URI prefix if present (e.g. "data:audio/webm;base64,...")
    const base64Data = audioBase64.includes(',')
      ? audioBase64.split(',')[1]
      : audioBase64;

    const resolvedMimeType = mimeType || 'audio/webm';
    const resolvedLanguage = language || 'en';

    const mistral = getMistralClient();
    const audioBuffer = Buffer.from(base64Data, 'base64');
    const extension = MIME_EXTENSIONS[resolvedMimeType] || 'webm';
    const audioFile = new File([audioBuffer], `audio.${extension}`, { type: resolvedMimeType });

    const result = await mistral.audio.transcriptions.complete({
      model: STT_MODEL,
      file: audioFile,
      language: resolvedLanguage,
    });

    const transcription = result.text?.trim() || '';
    return NextResponse.json({ transcription });
  } catch (error) {
    console.error('[/api/transcribe] Error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
