/**
 * MO App Backend - Main Entry Point
 * Firebase Cloud Functions for AI-powered fintech
 */

import * as functions from 'firebase-functions';

// Import routes
import {
  recordSale,
  addProduct,
  askBusiness,
  health,
} from './routes/aiRoutes';

// Export Cloud Functions
// These will be available at:
// https://<region>-<project-id>.cloudfunctions.net/<functionName>

/**
 * Record a sale using natural language
 * POST https://<region>-<project-id>.cloudfunctions.net/recordSale
 */
export { recordSale };

/**
 * Add a product with AI image analysis
 * POST https://<region>-<project-id>.cloudfunctions.net/addProduct
 */
export { addProduct };

/**
 * Ask business questions (AI-powered insights)
 * POST https://<region>-<project-id>.cloudfunctions.net/askBusiness
 */
export { askBusiness };

/**
 * Health check endpoint
 * GET https://<region>-<project-id>.cloudfunctions.net/health
 */
export { health };

/**
 * Scheduled function to cleanup old data (example)
 * Runs daily at midnight UTC
 */
export const cleanupOldData = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('Running daily cleanup...');
    // Add cleanup logic here
    return null;
  });
