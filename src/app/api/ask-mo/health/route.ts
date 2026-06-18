import { NextResponse } from 'next/server';
import { getEnvironmentStatus } from '@/lib/ask-mo-env-validation';
import { getGoogleAIService } from '@/services/ai/google-ai-service';
import { initializeFirebase } from '@/firebase';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * GET /api/ask-mo/health
 * Health check endpoint for Ask MO pipeline
 */
export async function GET() {
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
    if (admin.apps.length > 0) {
      healthCheck.details.firebaseAdmin = {
        initialized: true,
        appsCount: admin.apps.length,
      };
    } else {
      healthCheck.details.firebaseAdmin = {
        initialized: false,
        appsCount: 0,
      };
    }
  } catch (error) {
    healthCheck.details.firebaseAdmin = {
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Check Firestore Connection
  try {
    if (admin.apps.length > 0) {
      const db = getFirestore();
      // Try a simple query to verify connection
      await db.collection('_health_check').limit(1).get();
      healthCheck.firestore = true;
      healthCheck.details.firestore = {
        connected: true,
      };
    } else {
      healthCheck.firestore = false;
      healthCheck.details.firestore = {
        connected: false,
        error: 'Firebase Admin not initialized',
      };
    }
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
