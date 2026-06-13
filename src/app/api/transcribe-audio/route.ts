import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/transcribe-audio
 * Transcribe audio using OpenAI Whisper API
 * Supports multiple languages including African languages
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { audio, language = 'en' } = body;

    if (!audio) {
      return NextResponse.json(
        { error: 'Audio data is required' },
        { status: 400 }
      );
    }

    // Map app language codes to Whisper language codes
    const langMap: Record<string, string> = {
      'en': 'en',
      'fr': 'fr',
      'ha': 'ha', // Hausa
      'sw': 'sw', // Swahili
      'yo': 'yo', // Yoruba
      'ig': 'ig', // Igbo
      'am': 'am', // Amharic
      'ar': 'ar', // Arabic
      'zu': 'zu', // Zulu
      'af': 'af', // Afrikaans
    };

    const whisperLang = langMap[language] || 'en';

    // Get OpenAI API key from environment
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      console.warn('OpenAI API key not configured, using mock transcription');
      // Return mock transcription for testing
      return NextResponse.json({
        transcription: '🎤 Voice message (API not configured)',
      });
    }

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audio, 'base64');

    // Create a File object for the API
    const audioFile = new File([audioBuffer], 'audio.webm', { type: 'audio/webm' });

    // Create FormData for the API request
    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('model', 'whisper-1');
    formData.append('language', whisperLang);

    // Call OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI Whisper API Error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Transcription service error' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const transcription = data.text;

    if (!transcription) {
      return NextResponse.json({
        transcription: '🎤 Voice message (no transcription available)',
      });
    }

    console.log('✅ Transcription successful:', transcription.substring(0, 100));

    return NextResponse.json({
      transcription,
    });

  } catch (error: any) {
    console.error('Transcription API error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
