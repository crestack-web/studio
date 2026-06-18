/**
 * Environment Validation for Ask MO
 * Validates all required environment variables at startup
 */

import { AskMOErrorFactory, ErrorSource, logError } from './ask-mo-errors';

export interface EnvironmentValidationResult {
  valid: boolean;
  errors: Array<{
    variable: string;
    message: string;
    source: ErrorSource;
  }>;
  warnings: Array<{
    variable: string;
    message: string;
  }>;
}

export interface EnvironmentStatus {
  firebaseAdmin: boolean;
  firestore: boolean;
  googleAI: boolean;
  timestamp: string;
  details: {
    projectId: boolean;
    privateKey: boolean;
    clientEmail: boolean;
    googleApiKey: boolean;
  };
}

/**
 * Validate all required environment variables for Ask MO
 */
export function validateAskMOEnvironment(): EnvironmentValidationResult {
  const errors: Array<{ variable: string; message: string; source: ErrorSource }> = [];
  const warnings: Array<{ variable: string; message: string }> = [];

  // Firebase Admin Variables
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

  if (!projectId) {
    errors.push({
      variable: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      message: 'Firebase Project ID is missing',
      source: ErrorSource.ENVIRONMENT,
    });
  }

  if (!privateKey) {
    errors.push({
      variable: 'FIREBASE_ADMIN_PRIVATE_KEY',
      message: 'Firebase Admin Private Key is missing',
      source: ErrorSource.ENVIRONMENT,
    });
  } else if (privateKey === '-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n') {
    warnings.push({
      variable: 'FIREBASE_ADMIN_PRIVATE_KEY',
      message: 'Firebase Admin Private Key is using placeholder value',
    });
  }

  if (!clientEmail) {
    errors.push({
      variable: 'FIREBASE_ADMIN_CLIENT_EMAIL',
      message: 'Firebase Admin Client Email is missing',
      source: ErrorSource.ENVIRONMENT,
    });
  } else if (clientEmail.includes('your-project')) {
    warnings.push({
      variable: 'FIREBASE_ADMIN_CLIENT_EMAIL',
      message: 'Firebase Admin Client Email is using placeholder value',
    });
  }

  // Google AI Variables
  const googleApiKey = process.env.GOOGLE_GENAI_API_KEY;

  if (!googleApiKey) {
    errors.push({
      variable: 'GOOGLE_GENAI_API_KEY',
      message: 'Google Gen AI API Key is missing',
      source: ErrorSource.ENVIRONMENT,
    });
  } else if (googleApiKey === 'your-google-ai-api-key') {
    warnings.push({
      variable: 'GOOGLE_GENAI_API_KEY',
      message: 'Google Gen AI API Key is using placeholder value',
    });
  }

  const valid = errors.length === 0;

  if (!valid) {
    console.error('❌ Ask MO Environment Validation Failed:');
    errors.forEach(err => {
      console.error(`  - ${err.variable}: ${err.message}`);
    });
  }

  if (warnings.length > 0) {
    console.warn('⚠️ Ask MO Environment Warnings:');
    warnings.forEach(warn => {
      console.warn(`  - ${warn.variable}: ${warn.message}`);
    });
  }

  if (valid) {
    console.log('✅ Ask MO Environment Validation Passed');
  }

  return { valid, errors, warnings };
}

/**
 * Get current environment status
 */
export function getEnvironmentStatus(): EnvironmentStatus {
  const projectId = !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const privateKey = !!process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const clientEmail = !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const googleApiKey = !!process.env.GOOGLE_GENAI_API_KEY;

  const firebaseAdmin = projectId && privateKey && clientEmail;
  const firestore = firebaseAdmin; // Firestore depends on Firebase Admin
  const googleAI = googleApiKey;

  return {
    firebaseAdmin,
    firestore,
    googleAI,
    timestamp: new Date().toISOString(),
    details: {
      projectId,
      privateKey,
      clientEmail,
      googleApiKey,
    },
  };
}

/**
 * Validate environment and throw error if invalid
 */
export function validateEnvironmentOrThrow(): void {
  const validation = validateAskMOEnvironment();
  
  if (!validation.valid) {
    const error = AskMOErrorFactory.firebaseAdminMissing();
    error.details = { validationErrors: validation.errors };
    logError(error, 'Environment Validation');
    throw new Error(`Ask MO environment validation failed: ${validation.errors.map(e => e.variable).join(', ')}`);
  }
}

/**
 * Log environment status on startup
 */
export function logEnvironmentStartup(): void {
  console.log('🔍 Ask MO Environment Status:');
  console.log('================================');
  
  const status = getEnvironmentStatus();
  
  console.log(`Firebase Admin: ${status.firebaseAdmin ? '✅' : '❌'}`);
  console.log(`  - Project ID: ${status.details.projectId ? '✅' : '❌'}`);
  console.log(`  - Private Key: ${status.details.privateKey ? '✅' : '❌'}`);
  console.log(`  - Client Email: ${status.details.clientEmail ? '✅' : '❌'}`);
  console.log(`Firestore: ${status.firestore ? '✅' : '❌'}`);
  console.log(`Google AI: ${status.googleAI ? '✅' : '❌'}`);
  console.log(`  - API Key: ${status.details.googleApiKey ? '✅' : '❌'}`);
  console.log('================================');
  console.log(`Timestamp: ${status.timestamp}`);
}
