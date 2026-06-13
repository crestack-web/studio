import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY || '');

export const model = genAI.getGenerativeModel({ model: 'gemini-pro-latest' });
