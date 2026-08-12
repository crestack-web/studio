// ═══════════════════════════════════════════
//  Mistral AI Service - Centralized AI Provider
//  Single source of intelligence for all Busmo AI features
// ═══════════════════════════════════════════

import { Mistral } from '@mistralai/mistralai';
import { getMistralClient, DEFAULT_MODEL, FALLBACK_MODELS } from '@/ai/mistral';
import { AskMOErrorFactory, ErrorSource, ErrorCode, logError } from '@/lib/ask-mo-errors';

// Configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const RATE_LIMIT_DELAY_MS = 500;
const MAX_TOKEN_LIMIT = 100000; // Conservative token limit
const CONTEXT_TRUNCATION_THRESHOLD = 80000; // Truncate context if it exceeds this

// Error types
class MistralAIError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = 'MistralAIError';
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

// Extract plain text from a Mistral message content (string or content chunks)
function extractText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part: any) => (part && part.type === 'text' ? part.text : ''))
      .join('');
  }
  return '';
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

// Main Mistral AI Service
class MistralAIService {
  private rateLimiter: RateLimiter;
  private client: Mistral;

  constructor() {
    this.rateLimiter = new RateLimiter();
    this.client = getMistralClient();
    console.log('🔍 [MistralAIService] Initializing');
    this.validateEnvironment();
    this.logEnvironmentStatus();
  }

  // Validate environment variables
  private validateEnvironment(): void {
    const apiKey = process.env.MISTRAL_API_KEY;

    if (!apiKey) {
      const error = AskMOErrorFactory.mistralApiKeyMissing();
      logError(error, 'MistralAIService Initialization');
      throw new Error('Mistral API key is missing');
    }

    if (apiKey === 'your-mistral-api-key' || apiKey === 'your-api-key') {
      console.warn('⚠️ [MistralAIService] API key appears to be a placeholder value');
    }

    console.log('✅ [MistralAIService] Environment validation passed');
  }

  // Log environment status
  private logEnvironmentStatus() {
    console.log('🔑 [MistralAIService] Environment Status:');
    console.log('  MISTRAL_API_KEY:', process.env.MISTRAL_API_KEY ? 'PRESENT' : 'MISSING');
    console.log('  NODE_ENV:', process.env.NODE_ENV || 'undefined');
    console.log('  DEFAULT_MODEL:', DEFAULT_MODEL);
    console.log('  FALLBACK_MODELS:', FALLBACK_MODELS.join(', '));
  }

  // Validate request payload
  private validateRequest(request: AIRequest): void {
    console.log('🔍 [MistralAIService] Validating request');

    if (!request.prompt || typeof request.prompt !== 'string') {
      const error = AskMOErrorFactory.invalidInput('Invalid prompt: must be a non-empty string');
      logError(error, 'MistralAIService Request Validation');
      throw error;
    }

    if (request.prompt.trim().length === 0) {
      const error = AskMOErrorFactory.invalidInput('Invalid prompt: cannot be empty or whitespace');
      logError(error, 'MistralAIService Request Validation');
      throw error;
    }

    if (request.prompt.length > 100000) {
      const error = AskMOErrorFactory.messageTooLong(request.prompt.length, 100000);
      logError(error, 'MistralAIService Request Validation');
      throw error;
    }

    if (request.businessData) {
      try {
        const businessDataStr = JSON.stringify(request.businessData);
        if (businessDataStr.length > MAX_TOKEN_LIMIT) {
          console.warn('⚠️ [MistralAIService] Business data exceeds token limit, truncation may occur');
        }
      } catch (e) {
        const error = AskMOErrorFactory.invalidInput('Invalid businessData: cannot be serialized');
        logError(error, 'MistralAIService Request Validation');
        throw error;
      }
    }

    console.log('✅ [MistralAIService] Request validation passed');
  }

  // Detect token overflow and truncate context if needed
  private detectAndHandleTokenOverflow(fullPrompt: string): string {
    const promptLength = fullPrompt.length;

    if (promptLength > MAX_TOKEN_LIMIT) {
      console.warn('⚠️ [MistralAIService] Token overflow detected:', {
        promptLength,
        maxLimit: MAX_TOKEN_LIMIT,
        overflow: promptLength - MAX_TOKEN_LIMIT,
      });

      const error = AskMOErrorFactory.tokenLimitExceeded({
        promptLength,
        maxLimit: MAX_TOKEN_LIMIT,
        overflow: promptLength - MAX_TOKEN_LIMIT,
      });
      logError(error, 'MistralAIService Token Detection');

      // Truncate context to fit within limits
      const truncatedPrompt = fullPrompt.substring(0, CONTEXT_TRUNCATION_THRESHOLD);
      console.warn('⚠️ [MistralAIService] Context truncated to fit token limits', {
        originalLength: promptLength,
        truncatedLength: truncatedPrompt.length,
      });

      const truncationError = AskMOErrorFactory.contextTruncated({
        originalLength: promptLength,
        truncatedLength: truncatedPrompt.length,
      });
      logError(truncationError, 'MistralAIService Context Truncation');

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
        console.error(`❌ [MistralAIService] All retry attempts failed for ${context}`);
        throw error;
      }

      // Log retry attempt with full error details
      console.warn(`⚠️ [MistralAIService] Request failed, retrying... (${retries} attempts remaining)`, {
        context,
        delay,
      });
      console.error('❌ [MistralAIService] Retry error details:', this.extractErrorDetails(error));

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

  // Build the messages array for a chat completion request
  private buildMessages(request: AIRequest): { role: 'system' | 'user'; content: string }[] {
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

    const userContent = `${businessDataStr ? `Business data:\n${businessDataStr}\n\n` : ''}User question: ${request.prompt}`;
    const finalUserContent = this.detectAndHandleTokenOverflow(userContent);

    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: finalUserContent },
    ];
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

      const messages = this.buildMessages(request);
      const finalModel = request.model || DEFAULT_MODEL;

      const result = await this.retryWithBackoff(async () => {
        console.log(`🌐 [${requestId}] Sending request to Mistral...`);
        const response = await this.client.chat.complete({
          model: finalModel,
          messages,
        });
        const text = extractText(response.choices?.[0]?.message?.content);
        console.log(`📥 [${requestId}] Mistral response received, size: ${text?.length || 0} characters`);
        return text;
      });

      const text = result || 'No response generated';

      console.log(`✅ [${requestId}] AI Generation successful`);

      return {
        text,
        model: finalModel,
      };
    } catch (error) {
      console.error(`❌ [${requestId}] AI Generation failed`);
      console.error(`🔍 [${requestId}] Error details:`, this.extractErrorDetails(error));

      throw new MistralAIError(
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

    console.log(`🚀 [MistralAIService] AI Streaming Request`, { requestId });
    console.log(`🔄 [MistralAIService] Models to try:`, modelsToTry);
    console.log(`📊 [MistralAIService] Request details:`, {
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
        console.log(`🎯 [MistralAIService] Attempting model: ${currentModel} (${modelIndex + 1}/${modelsToTry.length})`);

        this.validateRequest(request);
        await this.rateLimiter.wait();

        const messages = this.buildMessages(request);

        console.log(`📝 [MistralAIService] Prompt details for ${currentModel}:`, {
          systemPromptLength: messages[0].content.length,
          userMessageLength: messages[1].content.length,
        });

        const stream = await this.retryWithBackoff(async () => {
          console.log(`🌐 [MistralAIService] Calling Mistral API with model: ${currentModel}`);

          // Check abort signal before API call
          if (request.signal?.aborted) {
            throw new DOMException('Request aborted', 'AbortError');
          }

          return this.client.chat.stream({
            model: currentModel,
            messages,
            stream: true,
          });
        }, MAX_RETRIES, RETRY_DELAY_MS, `model-${currentModel}`);

        const modelAttemptTime = Date.now() - modelAttemptStart;
        console.log(`✅ [MistralAIService] Model ${currentModel} succeeded`, {
          attemptTime: modelAttemptTime,
          attemptNumber: modelIndex + 1,
        });

        const readableStream = new ReadableStream<string>({
          async start(controller) {
            try {
              let chunkCount = 0;
              let totalChars = 0;
              const streamStart = Date.now();

              console.log(`📡 [MistralAIService] Starting stream for ${currentModel}`);

              for await (const chunk of stream) {
                const delta = chunk.data?.choices?.[0]?.delta?.content;
                const text = extractText(delta);
                if (text) {
                  totalChars += text.length;
                  chunkCount++;
                  controller.enqueue(text);

                  // Log every 10 chunks for debugging
                  if (chunkCount % 10 === 0) {
                    console.log(`📡 [MistralAIService] Stream progress: ${chunkCount} chunks, ${totalChars} chars`);
                  }
                }
              }

              const streamDuration = Date.now() - streamStart;
              console.log(`✅ [MistralAIService] Streaming completed for ${currentModel}`, {
                totalChunks: chunkCount,
                totalChars,
                streamDuration,
                charsPerSecond: Math.round((totalChars / streamDuration) * 1000),
              });

              controller.close();
            } catch (error) {
              console.error(`❌ [MistralAIService] Stream error for ${currentModel}:`, error);
              const streamError = AskMOErrorFactory.streamInterrupted({
                model: currentModel,
                error: error instanceof Error ? error.message : 'Unknown error'
              });
              logError(streamError, 'MistralAIService Streaming');
              controller.error(error);
            }
          },
        });

        console.log(`✅ [MistralAIService] AI Streaming successful with model: ${currentModel}`, {
          requestId,
          totalAttemptTime: Date.now() - modelAttemptStart,
          modelIndex: modelIndex + 1,
        });

        return {
          stream: readableStream,
          model: currentModel,
        };
      } catch (error) {
        const modelAttemptTime = Date.now() - modelAttemptStart;
        console.error(`❌ [MistralAIService] Model ${currentModel} failed`, {
          error: this.extractErrorDetails(error),
          attemptTime: modelAttemptTime,
          attemptNumber: modelIndex + 1,
        });

        const modelError = AskMOErrorFactory.modelFailed(currentModel, error);
        logError(modelError, 'MistralAIService Model Attempt');

        if (modelIndex < modelsToTry.length - 1) {
          console.log(`🔄 [MistralAIService] Trying fallback model...`, {
            currentModel,
            nextModel: modelsToTry[modelIndex + 1],
          });
          continue;
        }

        // All models failed
        console.error(`❌ [MistralAIService] All models failed`, {
          attemptedModels: modelsToTry,
          totalAttempts: modelsToTry.length,
        });

        const allModelsError = AskMOErrorFactory.allModelsFailed(modelsToTry);
        logError(allModelsError, 'MistralAIService All Models Failed');

        throw new MistralAIError(
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
      ErrorSource.MISTRAL_API,
      ErrorCode.MISTRAL_MODEL_FAILED
    );
    logError(unexpectedError, 'MistralAIService Unexpected Error');
    throw new MistralAIError('Unexpected error in streaming');
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const hasApiKey = !!process.env.MISTRAL_API_KEY;
      console.log('🏥 Mistral AI Health Check:', hasApiKey ? 'PASS' : 'FAIL');
      return hasApiKey;
    } catch (error) {
      console.error('Mistral AI health check failed:', error);
      return false;
    }
  }
}

// Singleton instance
let mistralAIServiceInstance: MistralAIService | null = null;

export function getMistralAIService(): MistralAIService {
  if (!mistralAIServiceInstance) {
    mistralAIServiceInstance = new MistralAIService();
  }
  return mistralAIServiceInstance;
}

// Export types
export { MistralAIService, MistralAIError };
