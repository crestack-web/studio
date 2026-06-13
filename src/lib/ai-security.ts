/**
 * AI Security & Rate Limiting Module
 * Provides authentication, rate limiting, and abuse detection for AI endpoints
 */

import { NextRequest } from 'next/server';
import admin from 'firebase-admin';
import { getFirestore, doc, getDoc, updateDoc, increment, collection, query, where, getDocs, Timestamp, runTransaction, addDoc } from 'firebase-admin/firestore';

// Initialize Firebase Admin for server-side use
let db: ReturnType<typeof getFirestore> | null = null;
try {
  if (!admin.apps.length) {
    const serviceAccount = {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    };
    
    if (serviceAccount.projectId && serviceAccount.privateKey && serviceAccount.clientEmail) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
  }
  db = getFirestore();
} catch (error) {
  console.warn('Firebase Admin not initialized for AI Security:', error);
}

// Rate limiting storage (in-memory for development, should use Redis in production)
const rateLimitStore = new Map<string, {
  count: number;
  resetTime: number;
}>();

// Abuse detection storage
const abuseDetectionStore = new Map<string, {
  violations: number;
  lastViolation: number;
  cooldownUntil: number;
}>();

/**
 * Rate limit configuration
 */
const RATE_LIMITS = {
  USER: {
    PER_MINUTE: 10,
    PER_HOUR: 50,
    PER_DAY: 200,
  },
  BUSINESS: {
    PER_MINUTE: 20,
    PER_HOUR: 100,
    PER_DAY: 500,
  },
  IP: {
    PER_MINUTE: 30,
    PER_HOUR: 150,
    PER_DAY: 1000,
  },
};

/**
 * Check if a request is rate limited
 */
export async function checkRateLimit(
  identifier: string,
  type: 'USER' | 'BUSINESS' | 'IP'
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const now = Date.now();
  const limits = RATE_LIMITS[type];
  
  // Get current rate limit state
  let state = rateLimitStore.get(identifier);
  
  // Reset if expired
  if (!state || state.resetTime < now) {
    state = {
      count: 0,
      resetTime: now + 60000, // 1 minute window
    };
    rateLimitStore.set(identifier, state);
  }
  
  // Check limits
  if (state.count >= limits.PER_MINUTE) {
    return {
      allowed: false,
      retryAfter: Math.ceil((state.resetTime - now) / 1000),
    };
  }
  
  // Increment counter
  state.count++;
  rateLimitStore.set(identifier, state);
  
  return { allowed: true };
}

/**
 * Check for abuse patterns
 */
export function checkAbuse(identifier: string): { allowed: boolean; message?: string } {
  const now = Date.now();
  const state = abuseDetectionStore.get(identifier);
  
  // Check if in cooldown
  if (state && state.cooldownUntil > now) {
    return {
      allowed: false,
      message: `Too many requests. Please try again in ${Math.ceil((state.cooldownUntil - now) / 1000)} seconds.`,
    };
  }
  
  return { allowed: true };
}

/**
 * Record abuse violation
 */
export function recordAbuseViolation(identifier: string, severity: 'low' | 'medium' | 'high') {
  const now = Date.now();
  const state = abuseDetectionStore.get(identifier) || {
    violations: 0,
    lastViolation: 0,
    cooldownUntil: 0,
  };
  
  state.violations++;
  state.lastViolation = now;
  
  // Apply cooldown based on severity and violation count
  const cooldownMultiplier = severity === 'high' ? 3 : severity === 'medium' ? 2 : 1;
  const violationMultiplier = Math.min(state.violations, 10);
  const cooldownDuration = 30000 * cooldownMultiplier * violationMultiplier; // 30s base
  
  state.cooldownUntil = now + cooldownDuration;
  
  abuseDetectionStore.set(identifier, state);
  
  console.warn(`Abuse violation recorded for ${identifier}: severity=${severity}, violations=${state.violations}, cooldown=${cooldownDuration}ms`);
}

/**
 * Validate and authenticate AI request
 */
export async function validateAIRequest(req: NextRequest, body?: any): Promise<{
  valid: boolean;
  userId?: string;
  businessId?: string;
  error?: string;
}> {
  try {
    // Use provided body or parse from request
    const requestBody = body || await req.json();
    const { userId, businessId } = requestBody;
    
    // Validate required fields
    if (!userId) {
      return { valid: false, error: 'User ID is required' };
    }
    
    if (!businessId) {
      return { valid: false, error: 'Business ID is required' };
    }
    
    // Validate user exists and is authenticated
    if (!db) {
      return { valid: false, error: 'Database not initialized' };
    }
    
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return { valid: false, error: 'User not found' };
    }
    
    const userData = userDoc.data();
    
    // Check if user is active
    if (userData.status === 'suspended' || userData.status === 'banned') {
      return { valid: false, error: 'User account is suspended' };
    }
    
    // Verify business ownership or staff access
    const businessDoc = await getDoc(doc(db, 'businesses', businessId));
    if (!businessDoc.exists()) {
      return { valid: false, error: 'Business not found' };
    }
    
    const businessData = businessDoc.data();
    
    // Check if user owns the business or is staff
    if (businessData.ownerId !== userId) {
      // Check if user is staff
      const staffQuery = query(
        collection(db, 'businesses', businessId, 'staff'),
        where('userId', '==', userId),
        where('active', '==', true)
      );
      const staffSnapshot = await getDocs(staffQuery);
      
      if (staffSnapshot.empty) {
        return { valid: false, error: 'Unauthorized access to business data' };
      }
    }
    
    return {
      valid: true,
      userId,
      businessId,
    };
  } catch (error) {
    console.error('AI request validation error:', error);
    return { valid: false, error: 'Validation failed' };
  }
}

/**
 * Check and deduct MO credits
 */
export async function checkAndDeductCredits(
  userId: string,
  businessId: string,
  estimatedTokens: number
): Promise<{ allowed: boolean; creditsRemaining?: number; error?: string }> {
  if (!db) {
    return { allowed: false, error: 'Database not initialized' };
  }
  
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return { allowed: false, error: 'User not found' };
    }
    
    const userData = userDoc.data();
    const creditsRemaining = userData.moCreditsRemaining || 0;
    
    // Estimate cost (simplified - should use actual token pricing)
    const estimatedCost = Math.ceil(estimatedTokens / 1000); // Rough estimate
    
    if (creditsRemaining < estimatedCost) {
      return {
        allowed: false,
        creditsRemaining,
        error: 'Insufficient MO credits',
      };
    }
    
    // Deduct credits
    await updateDoc(doc(db, 'users', userId), {
      moCreditsRemaining: increment(-estimatedCost),
      moCreditsUsed: increment(estimatedCost),
    });
    
    // Log usage
    await addDoc(collection(db, 'users', userId, 'mo_usage'), {
      businessId,
      tokensUsed: estimatedTokens,
      cost: estimatedCost,
      timestamp: Timestamp.now(),
    });
    
    return {
      allowed: true,
      creditsRemaining: creditsRemaining - estimatedCost,
    };
  } catch (error) {
    console.error('Credit deduction error:', error);
    return { allowed: false, error: 'Failed to check credits' };
  }
}

/**
 * Get client IP address
 */
export function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

/**
 * Validate input to prevent injection and abuse
 */
export function validateInput(message?: string, image?: string): { valid: boolean; error?: string } {
  if (!message && !image) {
    return { valid: false, error: 'Message or image is required' };
  }
  
  if (message) {
    // Check length
    if (message.length > 10000) {
      return { valid: false, error: 'Message too long (max 10000 characters)' };
    }
    
    // Check for potential injection patterns
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /data:/i,
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(message)) {
        return { valid: false, error: 'Invalid message content' };
      }
    }
  }
  
  if (image) {
    // Check image size (base64 length)
    if (image.length > 5000000) { // ~5MB
      return { valid: false, error: 'Image too large (max 5MB)' };
    }
  }
  
  return { valid: true };
}

/**
 * Sanitize business context to reduce token usage
 */
export function sanitizeBusinessContext(context: any): any {
  const sanitized: any = {};
  
  // Only include essential fields
  const essentialFields = [
    'businessName',
    'businessCategory',
    'totalSales',
    'todaySales',
    'totalProfit',
    'todayProfit',
    'transactionCount',
    'totalProducts',
    'lowStockProducts',
    'outOfStockProducts',
    'deadStockProducts',
    'topProducts',
    'recentSales',
    'profitMargin',
    'cashBalance',
    'cashRunway',
  ];
  
  for (const field of essentialFields) {
    if (context[field] !== undefined) {
      // Limit array sizes
      if (Array.isArray(context[field])) {
        sanitized[field] = context[field].slice(0, 5);
      } else {
        sanitized[field] = context[field];
      }
    }
  }
  
  return sanitized;
}
