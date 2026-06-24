// ═══════════════════════════════════════════
//  Google AI Service - Centralized AI Provider
//  Single source of intelligence for all Busmo AI features
// ═══════════════════════════════════════════

import { model } from '@/ai/genkit';
import { AskMOErrorFactory, ErrorSource, ErrorCode, logError } from '@/lib/ask-mo-errors';

// Configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const RATE_LIMIT_DELAY_MS = 500;
const DEFAULT_MODEL = 'gemini-pro-latest';
const FALLBACK_MODELS = ['gemini-pro', 'gemini-1.0-pro'];
const MAX_TOKEN_LIMIT = 100000; // Conservative token limit
const CONTEXT_TRUNCATION_THRESHOLD = 80000; // Truncate context if it exceeds this

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
  enableFallback?: boolean;
  signal?: AbortSignal;
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
    console.log('🔍 [GoogleAIService] Initializing');
    this.validateEnvironment();
    this.logEnvironmentStatus();
  }

  // Validate environment variables
  private validateEnvironment(): void {
    const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      const error = AskMOErrorFactory.googleAIKeyMissing();
      logError(error, 'GoogleAIService Initialization');
      throw new Error('Google Gen AI API key is missing');
    }
    
    if (apiKey === 'your-google-ai-api-key' || apiKey === 'your-api-key') {
      console.warn('⚠️ [GoogleAIService] API key appears to be a placeholder value');
    }
    
    console.log('✅ [GoogleAIService] Environment validation passed');
  }

  // Log environment status
  private logEnvironmentStatus() {
    console.log('🔑 [GoogleAIService] Environment Status:');
    console.log('  GOOGLE_GENAI_API_KEY:', process.env.GOOGLE_GENAI_API_KEY ? 'PRESENT' : 'MISSING');
    console.log('  GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? 'PRESENT' : 'MISSING');
    console.log('  NODE_ENV:', process.env.NODE_ENV || 'undefined');
    console.log('  DEFAULT_MODEL:', DEFAULT_MODEL);
    console.log('  FALLBACK_MODELS:', FALLBACK_MODELS.join(', '));
  }

  // Validate request payload
  private validateRequest(request: AIRequest): void {
    console.log('🔍 [GoogleAIService] Validating request');
    
    if (!request.prompt || typeof request.prompt !== 'string') {
      const error = AskMOErrorFactory.invalidInput('Invalid prompt: must be a non-empty string');
      logError(error, 'GoogleAIService Request Validation');
      throw error;
    }

    if (request.prompt.trim().length === 0) {
      const error = AskMOErrorFactory.invalidInput('Invalid prompt: cannot be empty or whitespace');
      logError(error, 'GoogleAIService Request Validation');
      throw error;
    }

    if (request.prompt.length > 100000) {
      const error = AskMOErrorFactory.messageTooLong(request.prompt.length, 100000);
      logError(error, 'GoogleAIService Request Validation');
      throw error;
    }

    if (request.businessData) {
      try {
        const businessDataStr = JSON.stringify(request.businessData);
        if (businessDataStr.length > MAX_TOKEN_LIMIT) {
          console.warn('⚠️ [GoogleAIService] Business data exceeds token limit, truncation may occur');
        }
      } catch (e) {
        const error = AskMOErrorFactory.invalidInput('Invalid businessData: cannot be serialized');
        logError(error, 'GoogleAIService Request Validation');
        throw error;
      }
    }
    
    console.log('✅ [GoogleAIService] Request validation passed');
  }

  // Detect token overflow and truncate context if needed
  private detectAndHandleTokenOverflow(fullPrompt: string): string {
    const promptLength = fullPrompt.length;
    
    if (promptLength > MAX_TOKEN_LIMIT) {
      console.warn('⚠️ [GoogleAIService] Token overflow detected:', {
        promptLength,
        maxLimit: MAX_TOKEN_LIMIT,
        overflow: promptLength - MAX_TOKEN_LIMIT,
      });
      
      const error = AskMOErrorFactory.tokenLimitExceeded({
        promptLength,
        maxLimit: MAX_TOKEN_LIMIT,
        overflow: promptLength - MAX_TOKEN_LIMIT,
      });
      logError(error, 'GoogleAIService Token Detection');
      
      // Truncate context to fit within limits
      const truncatedPrompt = fullPrompt.substring(0, CONTEXT_TRUNCATION_THRESHOLD);
      console.warn('⚠️ [GoogleAIService] Context truncated to fit token limits', {
        originalLength: promptLength,
        truncatedLength: truncatedPrompt.length,
      });
      
      const truncationError = AskMOErrorFactory.contextTruncated({
        originalLength: promptLength,
        truncatedLength: truncatedPrompt.length,
      });
      logError(truncationError, 'GoogleAIService Context Truncation');
      
      return truncatedPrompt;
    }
    
    return fullPrompt;
  }

  // Retry logic with exponential backoff
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    retries = MAX_RETRIES,
    delay = RETRY_DELAY_MS,
    context = 'unknown'
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries <= 0) {
        console.error(`❌ [GoogleAIService] All retry attempts failed for ${context}`);
        throw error;
      }
      
      // Log retry attempt with full error details
      console.warn(`⚠️ [GoogleAIService] Request failed, retrying... (${retries} attempts remaining)`, {
        context,
        delay,
      });
      console.error('❌ [GoogleAIService] Retry error details:', this.extractErrorDetails(error));
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.retryWithBackoff(fn, retries - 1, delay * 2, context);
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

  // Generate streaming AI response with fallback support
  async generateStream(request: AIRequest): Promise<AIStreamResponse> {
    const requestId = `stream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const modelsToTry = request.enableFallback !== false
      ? [request.model || DEFAULT_MODEL, ...FALLBACK_MODELS]
      : [request.model || DEFAULT_MODEL];

    console.log(`🚀 [GoogleAIService] AI Streaming Request`, { requestId });
    console.log(`🔄 [GoogleAIService] Models to try:`, modelsToTry);
    console.log(`📊 [GoogleAIService] Request details:`, {
      promptLength: request.prompt?.length || 0,
      hasContext: !!request.context,
      hasBusinessData: !!request.businessData,
      branchId: request.branchId || 'none',
      enableFallback: request.enableFallback !== false,
      hasSignal: !!request.signal,
    });

    // Check if request was already aborted
    if (request.signal?.aborted) {
      throw new DOMException('Request aborted', 'AbortError');
    }

    for (let modelIndex = 0; modelIndex < modelsToTry.length; modelIndex++) {
      const currentModel = modelsToTry[modelIndex];
      const modelAttemptStart = Date.now();

      try {
        console.log(`🎯 [GoogleAIService] Attempting model: ${currentModel} (${modelIndex + 1}/${modelsToTry.length})`);

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

        // Detect and handle token overflow
        const finalPrompt = this.detectAndHandleTokenOverflow(fullPrompt);

        console.log(`📝 [GoogleAIService] Prompt details for ${currentModel}:`, {
          systemPromptLength: systemPrompt.length,
          businessDataLength: businessDataStr.length,
          fullPromptLength: finalPrompt.length,
          wasTruncated: finalPrompt.length !== fullPrompt.length,
        });

        const result = await this.retryWithBackoff(async () => {
          console.log(`🌐 [GoogleAIService] Calling Gemini API with model: ${currentModel}`);

          // Check abort signal before API call
          if (request.signal?.aborted) {
            throw new DOMException('Request aborted', 'AbortError');
          }

          const response = await model.generateContentStream(finalPrompt);
          return response.stream;
        }, MAX_RETRIES, RETRY_DELAY_MS, `model-${currentModel}`);

        const modelAttemptTime = Date.now() - modelAttemptStart;
        console.log(`✅ [GoogleAIService] Model ${currentModel} succeeded`, { 
          attemptTime: modelAttemptTime,
          attemptNumber: modelIndex + 1,
        });

        const stream = new ReadableStream<string>({
          async start(controller) {
            try {
              let chunkCount = 0;
              let totalChars = 0;
              const streamStart = Date.now();
              
              console.log(`📡 [GoogleAIService] Starting stream for ${currentModel}`);
              
              for await (const chunk of await result) {
                const text = chunk.text();
                if (text) {
                  totalChars += text.length;
                  chunkCount++;
                  controller.enqueue(text);
                  
                  // Log every 10 chunks for debugging
                  if (chunkCount % 10 === 0) {
                    console.log(`📡 [GoogleAIService] Stream progress: ${chunkCount} chunks, ${totalChars} chars`);
                  }
                }
              }
              
              const streamDuration = Date.now() - streamStart;
              console.log(`✅ [GoogleAIService] Streaming completed for ${currentModel}`, {
                totalChunks: chunkCount,
                totalChars,
                streamDuration,
                charsPerSecond: Math.round((totalChars / streamDuration) * 1000),
              });
              
              controller.close();
            } catch (error) {
              console.error(`❌ [GoogleAIService] Stream error for ${currentModel}:`, error);
              const streamError = AskMOErrorFactory.streamInterrupted({ 
                model: currentModel, 
                error: error instanceof Error ? error.message : 'Unknown error' 
              });
              logError(streamError, 'GoogleAIService Streaming');
              controller.error(error);
            }
          },
        });

        console.log(`✅ [GoogleAIService] AI Streaming successful with model: ${currentModel}`, {
          requestId,
          totalAttemptTime: Date.now() - modelAttemptStart,
          modelIndex: modelIndex + 1,
        });

        return {
          stream,
          model: currentModel,
        };
      } catch (error) {
        const modelAttemptTime = Date.now() - modelAttemptStart;
        console.error(`❌ [GoogleAIService] Model ${currentModel} failed`, {
          error: this.extractErrorDetails(error),
          attemptTime: modelAttemptTime,
          attemptNumber: modelIndex + 1,
        });
        
        const modelError = AskMOErrorFactory.modelFailed(currentModel, error);
        logError(modelError, 'GoogleAIService Model Attempt');
        
        if (modelIndex < modelsToTry.length - 1) {
          console.log(`🔄 [GoogleAIService] Trying fallback model...`, {
            currentModel,
            nextModel: modelsToTry[modelIndex + 1],
          });
          continue;
        }
        
        // All models failed
        console.error(`❌ [GoogleAIService] All models failed`, {
          attemptedModels: modelsToTry,
          totalAttempts: modelsToTry.length,
        });
        
        const allModelsError = AskMOErrorFactory.allModelsFailed(modelsToTry);
        logError(allModelsError, 'GoogleAIService All Models Failed');
        
        throw new GoogleAIError(
          process.env.NODE_ENV === 'development' 
            ? `AI Streaming Error: ${this.extractErrorDetails(error).message}` 
            : 'I\'m having trouble accessing AI services right now. Please try again.',
          error
        );
      }
    }
    
    // Should never reach here, but TypeScript needs it
    const unexpectedError = AskMOErrorFactory.fromError(
      new Error('Unexpected error in streaming'), 
      ErrorSource.GEMINI_API, 
      ErrorCode.GEMINI_MODEL_FAILED
    );
    logError(unexpectedError, 'GoogleAIService Unexpected Error');
    throw new GoogleAIError('Unexpected error in streaming');
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
