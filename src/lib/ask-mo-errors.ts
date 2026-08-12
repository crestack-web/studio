/**
 * Unified Error Reporting Layer for Ask MO
 * Provides precise error identification and reporting across the entire pipeline
 */

export enum ErrorSource {
  MOBILE_CLIENT = 'MOBILE_CLIENT',
  AUTHENTICATION = 'AUTHENTICATION',
  FIRESTORE = 'FIRESTORE',
  RATE_LIMITING = 'RATE_LIMITING',
  REQUEST_QUEUE = 'REQUEST_QUEUE',
  MISTRAL_API = 'MISTRAL_API',
  STREAMING = 'STREAMING',
  TOKEN_LIMITS = 'TOKEN_LIMITS',
  ENVIRONMENT = 'ENVIRONMENT',
  VALIDATION = 'VALIDATION',
}

export enum ErrorCode {
  // Mobile Client Errors
  CLIENT_NETWORK_ERROR = 'CLIENT_NETWORK_ERROR',
  CLIENT_TIMEOUT = 'CLIENT_TIMEOUT',
  CLIENT_STREAM_PARSE_ERROR = 'CLIENT_STREAM_PARSE_ERROR',
  CLIENT_DUPLICATE_REQUEST = 'CLIENT_DUPLICATE_REQUEST',
  
  // Authentication Errors
  AUTH_USER_NOT_FOUND = 'AUTH_USER_NOT_FOUND',
  AUTH_USER_SUSPENDED = 'AUTH_USER_SUSPENDED',
  AUTH_BUSINESS_NOT_FOUND = 'AUTH_BUSINESS_NOT_FOUND',
  AUTH_UNAUTHORIZED = 'AUTH_UNAUTHORIZED',
  AUTH_DATABASE_NOT_INITIALIZED = 'AUTH_DATABASE_NOT_INITIALIZED',
  
  // Firestore Errors
  FIRESTORE_CONTEXT_LOAD_FAILED = 'FIRESTORE_CONTEXT_LOAD_FAILED',
  FIRESTORE_SALES_QUERY_FAILED = 'FIRESTORE_SALES_QUERY_FAILED',
  FIRESTORE_PRODUCTS_QUERY_FAILED = 'FIRESTORE_PRODUCTS_QUERY_FAILED',
  FIRESTORE_EXPENSES_QUERY_FAILED = 'FIRESTORE_EXPENSES_QUERY_FAILED',
  FIRESTORE_COLLECTION_MISSING = 'FIRESTORE_COLLECTION_MISSING',
  FIRESTORE_TIMEOUT = 'FIRESTORE_TIMEOUT',
  
  // Rate Limiting Errors
  RATE_LIMIT_USER_EXCEEDED = 'RATE_LIMIT_USER_EXCEEDED',
  RATE_LIMIT_BUSINESS_EXCEEDED = 'RATE_LIMIT_BUSINESS_EXCEEDED',
  RATE_LIMIT_IP_EXCEEDED = 'RATE_LIMIT_IP_EXCEEDED',
  
  // Request Queue Errors
  QUEUE_REQUEST_IN_PROGRESS = 'QUEUE_REQUEST_IN_PROGRESS',
  QUEUE_DUPLICATE_REQUEST = 'QUEUE_DUPLICATE_REQUEST',
  QUEUE_TIMEOUT = 'QUEUE_TIMEOUT',
  
  // Mistral API Errors
  MISTRAL_API_KEY_MISSING = 'MISTRAL_API_KEY_MISSING',
  MISTRAL_API_KEY_INVALID = 'MISTRAL_API_KEY_INVALID',
  MISTRAL_MODEL_FAILED = 'MISTRAL_MODEL_FAILED',
  MISTRAL_ALL_MODELS_FAILED = 'MISTRAL_ALL_MODELS_FAILED',
  MISTRAL_NETWORK_ERROR = 'MISTRAL_NETWORK_ERROR',
  MISTRAL_QUOTA_EXCEEDED = 'MISTRAL_QUOTA_EXCEEDED',
  MISTRAL_CONTENT_FILTERED = 'MISTRAL_CONTENT_FILTERED',
  
  // Streaming Errors
  STREAM_INTERRUPTED = 'STREAM_INTERRUPTED',
  STREAM_PARSE_ERROR = 'STREAM_PARSE_ERROR',
  STREAM_TIMEOUT = 'STREAM_TIMEOUT',
  
  // Token Limit Errors
  TOKEN_LIMIT_EXCEEDED = 'TOKEN_LIMIT_EXCEEDED',
  CONTEXT_TRUNCATED = 'CONTEXT_TRUNCATED',
  
  // Environment Errors
  ENV_FIREBASE_ADMIN_MISSING = 'ENV_FIREBASE_ADMIN_MISSING',
  ENV_FIREBASE_PROJECT_ID_MISSING = 'ENV_FIREBASE_PROJECT_ID_MISSING',
  ENV_MISTRAL_API_KEY_MISSING = 'ENV_MISTRAL_API_KEY_MISSING',
  
  // Validation Errors
  VALIDATION_INVALID_INPUT = 'VALIDATION_INVALID_INPUT',
  VALIDATION_MESSAGE_TOO_LONG = 'VALIDATION_MESSAGE_TOO_LONG',
  VALIDATION_IMAGE_TOO_LARGE = 'VALIDATION_IMAGE_TOO_LONG',
  VALIDATION_INJECTION_DETECTED = 'VALIDATION_INJECTION_DETECTED',
}

export interface AskMOError {
  source: ErrorSource;
  code: ErrorCode;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  stack?: string;
}

export class AskMOErrorFactory {
  static create(
    source: ErrorSource,
    code: ErrorCode,
    message: string,
    details?: Record<string, any>
  ): AskMOError {
    return {
      source,
      code,
      message,
      details: details || {},
      timestamp: new Date().toISOString(),
    };
  }

  static fromError(error: any, source: ErrorSource, code: ErrorCode): AskMOError {
    return {
      source,
      code,
      message: error.message || 'Unknown error',
      details: {
        originalError: error.name,
        ...(error.response && { response: error.response }),
        ...(error.errorDetails && { errorDetails: error.errorDetails }),
      },
      timestamp: new Date().toISOString(),
      stack: error.stack,
    };
  }

  // Mobile Client Errors
  static networkError(message: string, details?: Record<string, any>): AskMOError {
    return this.create(ErrorSource.MOBILE_CLIENT, ErrorCode.CLIENT_NETWORK_ERROR, message, details);
  }

  static timeout(details?: Record<string, any>): AskMOError {
    return this.create(ErrorSource.MOBILE_CLIENT, ErrorCode.CLIENT_TIMEOUT, 'Request timed out', details);
  }

  static clientStreamParseError(message: string, details?: Record<string, any>): AskMOError {
    return this.create(ErrorSource.MOBILE_CLIENT, ErrorCode.CLIENT_STREAM_PARSE_ERROR, message, details);
  }

  // Authentication Errors
  static userNotFound(userId: string): AskMOError {
    return this.create(ErrorSource.AUTHENTICATION, ErrorCode.AUTH_USER_NOT_FOUND, 'User not found', { userId });
  }

  static userSuspended(userId: string): AskMOError {
    return this.create(ErrorSource.AUTHENTICATION, ErrorCode.AUTH_USER_SUSPENDED, 'User account is suspended', { userId });
  }

  static businessNotFound(businessId: string): AskMOError {
    return this.create(ErrorSource.AUTHENTICATION, ErrorCode.AUTH_BUSINESS_NOT_FOUND, 'Business not found', { businessId });
  }

  static unauthorized(userId: string, businessId: string): AskMOError {
    return this.create(ErrorSource.AUTHENTICATION, ErrorCode.AUTH_UNAUTHORIZED, 'Unauthorized access to business data', { userId, businessId });
  }

  static databaseNotInitialized(): AskMOError {
    return this.create(ErrorSource.AUTHENTICATION, ErrorCode.AUTH_DATABASE_NOT_INITIALIZED, 'Database not initialized');
  }

  // Firestore Errors
  static contextLoadFailed(message: string, details?: Record<string, any>): AskMOError {
    return this.create(ErrorSource.FIRESTORE, ErrorCode.FIRESTORE_CONTEXT_LOAD_FAILED, message, details);
  }

  static salesQueryFailed(details?: Record<string, any>): AskMOError {
    return this.create(ErrorSource.FIRESTORE, ErrorCode.FIRESTORE_SALES_QUERY_FAILED, 'Sales query failed', details);
  }

  static productsQueryFailed(details?: Record<string, any>): AskMOError {
    return this.create(ErrorSource.FIRESTORE, ErrorCode.FIRESTORE_PRODUCTS_QUERY_FAILED, 'Products query failed', details);
  }

  static expensesQueryFailed(details?: Record<string, any>): AskMOError {
    return this.create(ErrorSource.FIRESTORE, ErrorCode.FIRESTORE_EXPENSES_QUERY_FAILED, 'Expenses query failed', details);
  }

  static firestoreCollectionMissing(collection: string): AskMOError {
    return this.create(ErrorSource.FIRESTORE, ErrorCode.FIRESTORE_COLLECTION_MISSING, `Collection missing: ${collection}`, { collection });
  }

  static firestoreTimeout(collection: string): AskMOError {
    return this.create(ErrorSource.FIRESTORE, ErrorCode.FIRESTORE_TIMEOUT, `Firestore query timeout: ${collection}`, { collection });
  }

  // Rate Limiting Errors
  static rateLimitUserExceeded(retryAfter: number): AskMOError {
    return this.create(ErrorSource.RATE_LIMITING, ErrorCode.RATE_LIMIT_USER_EXCEEDED, 'User rate limit exceeded', { retryAfter });
  }

  static rateLimitBusinessExceeded(retryAfter: number): AskMOError {
    return this.create(ErrorSource.RATE_LIMITING, ErrorCode.RATE_LIMIT_BUSINESS_EXCEEDED, 'Business rate limit exceeded', { retryAfter });
  }

  static rateLimitIpExceeded(retryAfter: number): AskMOError {
    return this.create(ErrorSource.RATE_LIMITING, ErrorCode.RATE_LIMIT_IP_EXCEEDED, 'IP rate limit exceeded', { retryAfter });
  }

  // Request Queue Errors
  static requestInProgress(): AskMOError {
    return this.create(ErrorSource.REQUEST_QUEUE, ErrorCode.QUEUE_REQUEST_IN_PROGRESS, 'Request already in progress');
  }

  static duplicateRequest(): AskMOError {
    return this.create(ErrorSource.REQUEST_QUEUE, ErrorCode.QUEUE_DUPLICATE_REQUEST, 'Duplicate request detected');
  }

  static queueTimeout(): AskMOError {
    return this.create(ErrorSource.REQUEST_QUEUE, ErrorCode.QUEUE_TIMEOUT, 'Request queue timeout');
  }

  // Mistral API Errors
  static apiKeyMissing(): AskMOError {
    return this.create(ErrorSource.MISTRAL_API, ErrorCode.MISTRAL_API_KEY_MISSING, 'Mistral API key is missing');
  }

  static apiKeyInvalid(): AskMOError {
    return this.create(ErrorSource.MISTRAL_API, ErrorCode.MISTRAL_API_KEY_INVALID, 'Mistral API key is invalid');
  }

  static modelFailed(model: string, error: any): AskMOError {
    return this.create(ErrorSource.MISTRAL_API, ErrorCode.MISTRAL_MODEL_FAILED, `Model failed: ${model}`, { model, error: error.message });
  }

  static allModelsFailed(attemptedModels: string[]): AskMOError {
    return this.create(ErrorSource.MISTRAL_API, ErrorCode.MISTRAL_ALL_MODELS_FAILED, 'All Mistral models failed', { attemptedModels });
  }

  static mistralNetworkError(error: any): AskMOError {
    return this.create(ErrorSource.MISTRAL_API, ErrorCode.MISTRAL_NETWORK_ERROR, 'Mistral API network error', { error: error.message });
  }

  static quotaExceeded(): AskMOError {
    return this.create(ErrorSource.MISTRAL_API, ErrorCode.MISTRAL_QUOTA_EXCEEDED, 'Mistral API quota exceeded');
  }

  static contentFiltered(): AskMOError {
    return this.create(ErrorSource.MISTRAL_API, ErrorCode.MISTRAL_CONTENT_FILTERED, 'Content was filtered by Mistral safety filters');
  }

  // Streaming Errors
  static streamInterrupted(details?: Record<string, any>): AskMOError {
    return this.create(ErrorSource.STREAMING, ErrorCode.STREAM_INTERRUPTED, 'Stream was interrupted', details);
  }

  static streamParseError(message: string, details?: Record<string, any>): AskMOError {
    return this.create(ErrorSource.STREAMING, ErrorCode.STREAM_PARSE_ERROR, message, details);
  }

  static streamTimeout(): AskMOError {
    return this.create(ErrorSource.STREAMING, ErrorCode.STREAM_TIMEOUT, 'Stream timeout');
  }

  // Token Limit Errors
  static tokenLimitExceeded(details?: Record<string, any>): AskMOError {
    return this.create(ErrorSource.TOKEN_LIMITS, ErrorCode.TOKEN_LIMIT_EXCEEDED, 'Token limit exceeded', details);
  }

  static contextTruncated(details?: Record<string, any>): AskMOError {
    return this.create(ErrorSource.TOKEN_LIMITS, ErrorCode.CONTEXT_TRUNCATED, 'Context was truncated to fit token limits', details);
  }

  // Environment Errors
  static firebaseAdminMissing(): AskMOError {
    return this.create(ErrorSource.ENVIRONMENT, ErrorCode.ENV_FIREBASE_ADMIN_MISSING, 'Firebase Admin credentials are missing');
  }

  static firebaseProjectIdMissing(): AskMOError {
    return this.create(ErrorSource.ENVIRONMENT, ErrorCode.ENV_FIREBASE_PROJECT_ID_MISSING, 'Firebase Project ID is missing');
  }

  static mistralApiKeyMissing(): AskMOError {
    return this.create(ErrorSource.ENVIRONMENT, ErrorCode.ENV_MISTRAL_API_KEY_MISSING, 'Mistral API key is missing');
  }

  // Validation Errors
  static invalidInput(message: string, details?: Record<string, any>): AskMOError {
    return this.create(ErrorSource.VALIDATION, ErrorCode.VALIDATION_INVALID_INPUT, message, details);
  }

  static messageTooLong(length: number, max: number): AskMOError {
    return this.create(ErrorSource.VALIDATION, ErrorCode.VALIDATION_MESSAGE_TOO_LONG, 'Message too long', { length, max });
  }

  static imageTooLarge(size: number, max: number): AskMOError {
    return this.create(ErrorSource.VALIDATION, ErrorCode.VALIDATION_IMAGE_TOO_LARGE, 'Image too large', { size, max });
  }

  static injectionDetected(type: string): AskMOError {
    return this.create(ErrorSource.VALIDATION, ErrorCode.VALIDATION_INJECTION_DETECTED, `Injection detected: ${type}`, { type });
  }
}

/**
 * Convert AskMOError to HTTP response
 */
export function errorToResponse(error: AskMOError): Response {
  const statusCode = getStatusCodeForError(error);
  
  return new Response(
    JSON.stringify({
      error: error.message,
      code: error.code,
      source: error.source,
      details: error.details,
      timestamp: error.timestamp,
    }),
    {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Get appropriate HTTP status code for error
 */
function getStatusCodeForError(error: AskMOError): number {
  switch (error.source) {
    case ErrorSource.AUTHENTICATION:
      return 401;
    case ErrorSource.VALIDATION:
      return 400;
    case ErrorSource.RATE_LIMITING:
    case ErrorSource.REQUEST_QUEUE:
      return 429;
    case ErrorSource.ENVIRONMENT:
      return 500;
    case ErrorSource.MISTRAL_API:
    case ErrorSource.FIRESTORE:
    case ErrorSource.STREAMING:
    case ErrorSource.TOKEN_LIMITS:
    case ErrorSource.MOBILE_CLIENT:
      return 500;
    default:
      return 500;
  }
}

/**
 * Log error with structured format
 */
export function logError(error: AskMOError, context?: string): void {
  console.error(`[AskMO Error] ${context || 'Unknown context'}`, {
    source: error.source,
    code: error.code,
    message: error.message,
    details: error.details,
    timestamp: error.timestamp,
  });
}
