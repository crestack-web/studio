// ═══════════════════════════════════════════
//  Google AI Service - Centralized AI Provider
//  Single source of intelligence for all Busmo AI features
// ═══════════════════════════════════════════

import { model } from '@/ai/genkit';

// Configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const RATE_LIMIT_DELAY_MS = 500;
const DEFAULT_MODEL = 'gemini-pro-latest';

// Error types
class GoogleAIError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = 'GoogleAIError';
  }
}

// Request/Response types
export interface AIRequest {
  prompt: string;
  context?: string;
  businessData?: Record<string, unknown>;
  branchId?: string;
  model?: string;
  stream?: boolean;
}

export interface AIResponse {
  text: string;
  model: string;
}

export interface AIStreamResponse {
  stream: ReadableStream<string>;
  model: string;
}

// Rate limiting tracker
class RateLimiter {
  private lastRequestTime = 0;
  private minDelay = RATE_LIMIT_DELAY_MS;

  async wait(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minDelay) {
      await new Promise(resolve => setTimeout(resolve, this.minDelay - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();
  }
}

// Main Google AI Service
class GoogleAIService {
  private rateLimiter: RateLimiter;

  constructor() {
    this.rateLimiter = new RateLimiter();
    console.log('🔍 GoogleAIService initialized');
    this.logEnvironmentStatus();
  }

  // Log environment status
  private logEnvironmentStatus() {
    console.log('🔑 Environment Status:');
    console.log('  GOOGLE_GENAI_API_KEY:', process.env.GOOGLE_GENAI_API_KEY ? 'PRESENT' : 'MISSING');
    console.log('  GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? 'PRESENT' : 'MISSING');
    console.log('  NODE_ENV:', process.env.NODE_ENV || 'undefined');
  }

  // Validate request payload
  private validateRequest(request: AIRequest): void {
    if (!request.prompt || typeof request.prompt !== 'string') {
      throw new Error('Invalid prompt: must be a non-empty string');
    }

    if (request.prompt.trim().length === 0) {
      throw new Error('Invalid prompt: cannot be empty or whitespace');
    }

    if (request.prompt.length > 100000) {
      throw new Error('Invalid prompt: exceeds maximum length of 100000 characters');
    }

    if (request.businessData) {
      try {
        JSON.stringify(request.businessData);
      } catch (e) {
        throw new Error('Invalid businessData: cannot be serialized');
      }
    }
  }

  // Retry logic with exponential backoff
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    retries = MAX_RETRIES,
    delay = RETRY_DELAY_MS
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries <= 0) {
        throw error;
      }
      
      // Log retry attempt with full error details
      console.warn(`Google AI request failed, retrying... (${retries} attempts remaining)`);
      console.error('Retry error details:', this.extractErrorDetails(error));
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.retryWithBackoff(fn, retries - 1, delay * 2);
    }
  }

  // Extract detailed error information
  private extractErrorDetails(error: any): any {
    const details: any = {
      name: error.name,
      message: error.message,
    };

    if (error.response) {
      details.response = {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers,
      };
    }

    if (error.errorDetails) {
      details.errorDetails = error.errorDetails;
    }

    if (process.env.NODE_ENV === 'development') {
      details.stack = error.stack;
    }

    return details;
  }

  // Build system prompt based on context
  private buildSystemPrompt(context?: string, businessData?: Record<string, unknown>, branchId?: string): string {
    let systemPrompt = `You are Busmo AI, an intelligent business advisor for retail and small business owners.

Your role is to:
- Analyze real business data and provide actionable insights
- Answer questions about sales, expenses, inventory, and cash flow
- Identify trends, risks, and opportunities
- Provide specific, data-driven recommendations
- Be conversational, helpful, and context-aware

Important rules:
- NEVER invent or fake data. If data is missing, say "I couldn't find enough data for this period."
- Use the actual business data provided to give accurate answers
- Be specific with numbers and percentages when available
- Suggest concrete actions based on the analysis
- Avoid robotic phrases like "Based on the provided information"
- Speak naturally like a business advisor would
`;

    if (branchId) {
      systemPrompt += `\nCurrent context: Branch ID ${branchId}. Provide branch-specific insights and comparisons when relevant.\n`;
    }

    if (context) {
      systemPrompt += `\n${context}\n`;
    }

    return systemPrompt;
  }

  // Sanitize business data before sending to AI
  private sanitizeBusinessData(data: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Only include necessary data types
      if (value === null || value === undefined) continue;
      
      // Convert complex objects to strings if needed
      if (typeof value === 'object') {
        sanitized[key] = JSON.stringify(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  // Generate AI response (non-streaming)
  async generate(request: AIRequest): Promise<AIResponse> {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🚀 [${requestId}] AI Generation Request`);
    console.log(`📝 [${requestId}] Prompt length: ${request.prompt?.length || 0} characters`);
    console.log(`📊 [${requestId}] Has business data: ${!!request.businessData}`);
    console.log(`🌿 [${requestId}] Branch ID: ${request.branchId || 'none'}`);
    console.log(`🤖 [${requestId}] Model: ${request.model || DEFAULT_MODEL}`);

    try {
      // Validate request
      this.validateRequest(request);
      console.log(`✅ [${requestId}] Request validation passed`);

      await this.rateLimiter.wait();

      const systemPrompt = this.buildSystemPrompt(
        request.context,
        request.businessData,
        request.branchId
      );

      let businessDataStr = '';
      if (request.businessData) {
        const sanitizedData = this.sanitizeBusinessData(request.businessData);
        businessDataStr = JSON.stringify(sanitizedData, null, 2);
        console.log(`📦 [${requestId}] Business data size: ${businessDataStr.length} characters`);
      }

      const fullPrompt = `${systemPrompt}\n\n${businessDataStr ? `Business data:\n${businessDataStr}\n\n` : ''}User question: ${request.prompt}`;
      console.log(`📤 [${requestId}] Full prompt size: ${fullPrompt.length} characters`);

      const result = await this.retryWithBackoff(async () => {
        console.log(`🌐 [${requestId}] Sending request to Gemini...`);
        const response = await model.generateContent(fullPrompt);
        const text = response.response.text();
        console.log(`📥 [${requestId}] Gemini response received, size: ${text?.length || 0} characters`);
        return text;
      });

      const text = result || 'No response generated';

      console.log(`✅ [${requestId}] AI Generation successful`);

      return {
        text,
        model: request.model || DEFAULT_MODEL,
      };
    } catch (error) {
      console.error(`❌ [${requestId}] AI Generation failed`);
      console.error(`🔍 [${requestId}] Error details:`, this.extractErrorDetails(error));
      
      throw new GoogleAIError(
        process.env.NODE_ENV === 'development' 
          ? `AI Error: ${this.extractErrorDetails(error).message}` 
          : 'I\'m having trouble accessing AI services right now. Please try again.',
        error
      );
    }
  }

  // Generate streaming AI response
  async generateStream(request: AIRequest): Promise<AIStreamResponse> {
    const requestId = `stream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🚀 [${requestId}] AI Streaming Request`);

    try {
      this.validateRequest(request);

      await this.rateLimiter.wait();

      const systemPrompt = this.buildSystemPrompt(
        request.context,
        request.businessData,
        request.branchId
      );

      let businessDataStr = '';
      if (request.businessData) {
        const sanitizedData = this.sanitizeBusinessData(request.businessData);
        businessDataStr = JSON.stringify(sanitizedData, null, 2);
      }

      const fullPrompt = `${systemPrompt}\n\n${businessDataStr ? `Business data:\n${businessDataStr}\n\n` : ''}User question: ${request.prompt}`;

      const result = await this.retryWithBackoff(async () => {
        const response = await model.generateContentStream(fullPrompt);
        return response.stream;
      });

      const stream = new ReadableStream<string>({
        async start(controller) {
          try {
            for await (const chunk of await result) {
              const text = chunk.text();
              if (text) {
                controller.enqueue(text);
              }
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      console.log(`✅ [${requestId}] AI Streaming successful`);

      return {
        stream,
        model: request.model || DEFAULT_MODEL,
      };
    } catch (error) {
      console.error(`❌ [${requestId}] AI Streaming failed`);
      console.error(`🔍 [${requestId}] Error details:`, this.extractErrorDetails(error));
      
      throw new GoogleAIError(
        process.env.NODE_ENV === 'development' 
          ? `AI Streaming Error: ${this.extractErrorDetails(error).message}` 
          : 'I\'m having trouble accessing AI services right now. Please try again.',
        error
      );
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const hasApiKey = !!(process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY);
      console.log('🏥 Google AI Health Check:', hasApiKey ? 'PASS' : 'FAIL');
      return hasApiKey;
    } catch (error) {
      console.error('Google AI health check failed:', error);
      return false;
    }
  }
}

// Singleton instance
let googleAIServiceInstance: GoogleAIService | null = null;

export function getGoogleAIService(): GoogleAIService {
  if (!googleAIServiceInstance) {
    googleAIServiceInstance = new GoogleAIService();
  }
  return googleAIServiceInstance;
}

// Export types
export { GoogleAIService, GoogleAIError };
