import { Mistral } from '@mistralai/mistralai';

export const DEFAULT_MODEL = 'mistral-large-latest';
export const FALLBACK_MODELS = ['mistral-medium-latest', 'mistral-small-latest'];
export const STT_MODEL = 'voxtral-mini-latest';

export function getMistralClient(): Mistral {
  return new Mistral({ apiKey: process.env.MISTRAL_API_KEY || '' });
}
