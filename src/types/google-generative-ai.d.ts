declare module '@google/generative-ai' {
  export class GoogleGenerativeAI {
    constructor(apiKey: string);
    getGenerativeModel(options: {
      model: string;
      systemInstruction?: string | { role: string; parts: { text: string }[] };
    }): GenerativeModel;
  }

  export interface GenerativeModel {
    generateContent(input: string | { contents: unknown[] } | unknown[]): Promise<GenerateContentResult>;
    generateContentStream(input: string | { contents: unknown[] } | unknown[]): Promise<GenerateContentStreamResult>;
    startChat(options?: { history?: unknown[] }): ChatSession;
  }

  export interface GenerateContentResult {
    response: {
      text(): string;
    };
  }

  export interface GenerateContentStreamResult {
    stream: AsyncIterable<{ text(): string }>;
  }

  export interface ChatSession {
    sendMessage(input: string | (Record<string, unknown>)[]): Promise<GenerateContentResult>;
    history: unknown[];
  }
}
