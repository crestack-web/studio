import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY || '');

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

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const prompt = `Transcribe this audio message accurately.
- If the audio is in ${resolvedLanguage}, respond in ${resolvedLanguage}
- Detect the language automatically if unsure
- Return ONLY the transcription text, no explanations or additional text
- Handle multiple languages if the speaker switches languages
- Include punctuation and proper formatting`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: resolvedMimeType,
        },
      },
    ]);

    const transcription = result.response.text().trim();
    return NextResponse.json({ transcription });
  } catch (error) {
    console.error('[/api/transcribe] Error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
