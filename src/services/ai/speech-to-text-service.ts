import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY || '');

/**
 * Transcribe audio using Google Cloud Speech-to-Text
 * Supports multiple languages and auto-detection
 */
export async function transcribeAudio(audioBlob: Blob, language: string = 'en'): Promise<string> {
  try {
    // Convert audio blob to base64
    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');

    // Use Gemini Pro Vision for audio transcription
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

    const prompt = `Transcribe this audio message accurately. 
    - If the audio is in ${language}, respond in ${language}
    - Detect the language automatically if unsure
    - Return ONLY the transcription text, no explanations or additional text
    - Handle multiple languages if the speaker switches languages
    - Include punctuation and proper formatting`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Audio,
          mimeType: audioBlob.type || 'audio/webm'
        }
      }
    ]);

    const transcription = result.response.text().trim();
    return transcription;
  } catch (error) {
    console.error('Speech-to-Text error:', error);
    throw new Error('Failed to transcribe audio');
  }
}

/**
 * Detect language from audio transcription
 */
export function detectLanguageFromText(text: string): string {
  // Simple language detection based on common words/phrases
  const languagePatterns = {
    'fr': /\b(le|la|les|un|une|des|et|ou|mais|pour|avec|sur|dans|par|je|tu|il|elle|nous|vous|ils|elles)\b/i,
    'es': /\b(el|la|los|las|un|una|unos|unas|y|o|pero|por|con|en|de|para|yo|tú|él|ella|nosotros|vosotros|ellos|ellas)\b/i,
    'de': /\b(der|die|das|ein|eine|einen|und|oder|aber|für|mit|auf|in|von|zu|ich|du|er|sie|wir|ihr|sie)\b/i,
    'pt': /\b(o|a|os|as|um|uma|uns|umas|e|ou|mas|para|com|em|de|por|eu|tu|ele|ela|nós|vós|eles|elas)\b/i,
    'yo': /\b(ni|wa|o|a|un|una|ati|awa|kini|tun|fun|lor|pẹlu|lọ|sin|lati|mo|iwọ|oun|a|wa)\b/i,
    'ha': /\b(na|ta|da|ga|a|in|sun|zu|su|mu|ke|don|wani|yi|ta|shi|ka|na|za|ci|tafi|yi|zai)\b/i,
    'ig': /\b(na|a|i|o|anyị|ị|ụ|gị|nke|na|n'ụzọ|ka|ma|bụ|ka|ọ bụrụ|n'ime|n'elu|n'okpuru)\b/i,
    'sw': /\b(na|ya|wa|za|la|ku|wao|vya|kwa|kwa|na|kati|juu|chini|nje|ndani|mimi|wewe|yeye|sisi|ninyi|wao)\b/i,
  };

  for (const [lang, pattern] of Object.entries(languagePatterns)) {
    if (pattern.test(text)) {
      return lang;
    }
  }

  return 'en'; // Default to English
}

/**
 * Get language name from code
 */
export function getLanguageName(code: string): string {
  const names: Record<string, string> = {
    'en': 'English',
    'fr': 'French',
    'es': 'Spanish',
    'de': 'German',
    'pt': 'Portuguese',
    'yo': 'Yoruba',
    'ha': 'Hausa',
    'ig': 'Igbo',
    'sw': 'Swahili',
  };
  return names[code] || 'English';
}
