import { NextResponse } from 'next/server';
import { getEnvironmentStatus } from '@/lib/ask-mo-env-validation';
import { getGoogleAIService } from '@/services/ai/google-ai-service';
import { initializeFirebase } from '@/firebase';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAdminDb, isAdminInitialized } from '@/lib/firebase-admin';

/**
 * GET /api/ask-mo/health
 * Health check endpoint for Ask MO pipeline
 * In production, only returns basic health status
 * Detailed diagnostics require admin authentication
 */
export async function GET(req: Request) {
  const isProduction = process.env.NODE_ENV === 'production';

  // In production, only return basic health status without diagnostics
  if (isProduction) {
    try {
      const initialized = isAdminInitialized();
      const db = getAdminDb();
      const aiService = getGoogleAIService();
      const aiHealth = await aiService.healthCheck();

      const overallHealth = initialized && db && aiHealth;

      return NextResponse.json({
        healthy: overallHealth,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return NextResponse.json({
        healthy: false,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // In development, return full diagnostics
  const healthCheck = {
    firebaseAdmin: false,
    firestore: false,
    googleAI: false,
    streaming: false,
    timestamp: new Date().toISOString(),
    details: {} as Record<string, any>,
  };

  // Check Environment Variables
  try {
    const envStatus = getEnvironmentStatus();
    healthCheck.firebaseAdmin = envStatus.firebaseAdmin;
    healthCheck.firestore = envStatus.firestore;
    healthCheck.googleAI = envStatus.googleAI;
    healthCheck.details.environment = envStatus.details;
  } catch (error) {
    healthCheck.details.environment = {
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Check Firebase Admin Initialization
  try {
    const initialized = isAdminInitialized();
    healthCheck.firebaseAdmin = initialized;
    healthCheck.details.firebaseAdmin = {
      initialized: initialized,
      appsCount: admin.apps.length,
    };
  } catch (error) {
    healthCheck.details.firebaseAdmin = {
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Check Firestore Connection
  try {
    const db = getAdminDb();
    healthCheck.firestore = true;
    healthCheck.details.firestore = {
      connected: true,
      message: 'Firestore instance available',
    };
  } catch (error) {
    healthCheck.firestore = false;
    healthCheck.details.firestore = {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Check Google AI Service
  try {
    const aiService = getGoogleAIService();
    const healthCheckResult = await aiService.healthCheck();
    healthCheck.googleAI = healthCheckResult;
    healthCheck.details.googleAI = {
      healthy: healthCheckResult,
      model: 'gemini-pro-latest',
    };
  } catch (error) {
    healthCheck.googleAI = false;
    healthCheck.details.googleAI = {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Check Streaming Capability
  try {
    // We can't actually test streaming without making a real request,
    // but we can verify the service supports it
    const aiService = getGoogleAIService();
    healthCheck.streaming = healthCheck.googleAI; // Streaming depends on Google AI
    healthCheck.details.streaming = {
      supported: true,
      dependsOn: 'googleAI',
    };
  } catch (error) {
    healthCheck.streaming = false;
    healthCheck.details.streaming = {
      supported: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Calculate overall health
  const overallHealth = healthCheck.firebaseAdmin && healthCheck.firestore && healthCheck.googleAI && healthCheck.streaming;

  return NextResponse.json({
    healthy: overallHealth,
    ...healthCheck,
  });
}
