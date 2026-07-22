/**
 * Client-side transcription helper.
 * All actual Gemini API calls happen server-side via POST /api/transcribe
 * so that Buffer, process.env.GOOGLE_GENAI_API_KEY, etc. are never accessed
 * in the browser.
 */

/**
 * Transcribe an audio Blob by sending it to the server-side API route.
 * Supports the same languages as before: en, fr, es, de, pt, yo, ha, ig, sw.
 */
export async function transcribeAudio(audioBlob: Blob, language: string = 'en'): Promise<string> {
  // Convert blob to base64 data URI so we can send it as JSON
  const base64 = await blobToBase64(audioBlob);

  const response = await fetch('/api/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audioBase64: base64,
      mimeType: audioBlob.type || 'audio/webm',
      language,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to transcribe audio');
  }

  const data = await response.json();
  return data.transcription || '';
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Detect language from audio transcription.
 */
export function detectLanguageFromText(text: string): string {
  const languagePatterns: Record<string, RegExp> = {
    fr: /\b(le|la|les|un|une|des|et|ou|mais|pour|avec|sur|dans|par|je|tu|il|elle|nous|vous|ils|elles)\b/i,
    es: /\b(el|la|los|las|un|una|unos|unas|y|o|pero|por|con|en|de|para|yo|tú|él|ella|nosotros|vosotros|ellos|ellas)\b/i,
    de: /\b(der|die|das|ein|eine|einen|und|oder|aber|für|mit|auf|in|von|zu|ich|du|er|sie|wir|ihr)\b/i,
    pt: /\b(o|a|os|as|um|uma|uns|umas|e|ou|mas|para|com|em|de|por|eu|tu|ele|ela|nós|vós|eles|elas)\b/i,
    yo: /\b(ni|wa|o|a|un|una|ati|awa|kini|tun|fun|lor|pẹlu|lọ|sin|lati|mo|iwọ|oun)\b/i,
    ha: /\b(na|ta|da|ga|a|in|sun|zu|su|mu|ke|don|wani|yi|shi|ka|za|ci|tafi)\b/i,
    ig: /\b(na|a|i|o|anyị|ị|ụ|gị|nke|n'ụzọ|ka|ma|bụ|ọ bụrụ|n'ime|n'elu|n'okpuru)\b/i,
    sw: /\b(na|ya|wa|za|la|ku|wao|vya|kwa|kati|juu|chini|nje|ndani|mimi|wewe|yeye|sisi|ninyi)\b/i,
  };

  for (const [lang, pattern] of Object.entries(languagePatterns)) {
    if (pattern.test(text)) {
      return lang;
    }
  }

  return 'en';
}

/**
 * Get language name from code.
 */
export function getLanguageName(code: string): string {
  const names: Record<string, string> = {
    en: 'English',
    fr: 'French',
    es: 'Spanish',
    de: 'German',
    pt: 'Portuguese',
    yo: 'Yoruba',
    ha: 'Hausa',
    ig: 'Igbo',
    sw: 'Swahili',
  };
  return names[code] || 'English';
}
