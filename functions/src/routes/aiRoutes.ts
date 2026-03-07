/**
 * AI Routes
 * API endpoints for AI-powered features
 */

import * as functions from 'firebase-functions';
import corsPackage from 'cors';
import { z } from 'zod';
import {
  parseSaleIntent,
  analyzeProduct,
  answerBusinessQuestion,
  detectLanguage,
} from '../services/qwenService';
import {
  createSale,
  createProduct,
  getBusinessMetrics,
  getRecentSales,
  getLowStockProducts,
  validateMerchantAccess,
} from '../services/firestoreService';

// CORS configuration
const corsHandler = corsPackage({ origin: true });

// Request validation schemas
const RecordSaleSchema = z.object({
  merchant_id: z.string().min(1),
  user_id: z.string().min(1),
  text: z.string().min(1),
  language: z.string().optional(),
});

const AddProductSchema = z.object({
  merchant_id: z.string().min(1),
  user_id: z.string().min(1),
  name: z.string().min(1),
  price: z.number().positive(),
  imageUrl: z.string().url().optional(),
});

const AskBusinessSchema = z.object({
  merchant_id: z.string().min(1),
  user_id: z.string().min(1),
  question: z.string().min(1),
});

/**
 * POST /recordSale
 * Parse natural language sale and record to Firestore
 */
export const recordSale = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).json({ status: 'error', message: 'Method not allowed' });
      return;
    }

    try {
      // Validate request
      const validation = RecordSaleSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid request',
          errors: validation.error.errors,
        });
        return;
      }

      const { merchant_id, user_id, text, language } = validation.data;

      // Validate access
      const hasAccess = await validateMerchantAccess(merchant_id, user_id);
      if (!hasAccess) {
        res.status(403).json({
          status: 'error',
          message: 'Access denied',
        });
        return;
      }

      // Detect language if not provided
      const detectedLang = language || detectLanguage(text);

      // Parse sale intent using AI
      const saleData = await parseSaleIntent(text, detectedLang);

      // Record sale to Firestore
      const saleId = await createSale(merchant_id, saleData);

      res.json({
        status: 'success',
        data: {
          saleId,
          ...saleData,
        },
        message: 'Sale recorded successfully',
      });
    } catch (error: any) {
      console.error('Record sale error:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to record sale',
      });
    }
  });
});

/**
 * POST /addProduct
 * Analyze product image and create product record
 */
export const addProduct = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).json({ status: 'error', message: 'Method not allowed' });
      return;
    }

    try {
      // Validate request
      const validation = AddProductSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid request',
          errors: validation.error.errors,
        });
        return;
      }

      const { merchant_id, user_id, name, price, imageUrl } = validation.data;

      // Validate access
      const hasAccess = await validateMerchantAccess(merchant_id, user_id);
      if (!hasAccess) {
        res.status(403).json({
          status: 'error',
          message: 'Access denied',
        });
        return;
      }

      // Analyze product using AI (if image provided)
      let productAttributes = {};
      if (imageUrl) {
        productAttributes = await analyzeProduct(imageUrl, name, price);
      }

      // Create product with AI-extracted attributes
      const productId = await createProduct(merchant_id, {
        name,
        price,
        stock: 0, // Default to 0, update manually
        ...productAttributes,
      });

      res.json({
        status: 'success',
        data: {
          productId,
          ...productAttributes,
        },
        message: 'Product added successfully',
      });
    } catch (error: any) {
      console.error('Add product error:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to add product',
      });
    }
  });
});

/**
 * POST /askBusiness
 * Answer business questions using AI + Firestore data
 */
export const askBusiness = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).json({ status: 'error', message: 'Method not allowed' });
      return;
    }

    try {
      // Validate request
      const validation = AskBusinessSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid request',
          errors: validation.error.errors,
        });
        return;
      }

      const { merchant_id, user_id, question } = validation.data;

      // Validate access
      const hasAccess = await validateMerchantAccess(merchant_id, user_id);
      if (!hasAccess) {
        res.status(403).json({
          status: 'error',
          message: 'Access denied',
        });
        return;
      }

      // Get business metrics for context
      const [metrics, recentSales, lowStock] = await Promise.all([
        getBusinessMetrics(merchant_id),
        getRecentSales(merchant_id, 5),
        getLowStockProducts(merchant_id),
      ]);

      // Answer question using AI
      const answer = await answerBusinessQuestion(question, {
        totalSales: metrics.totalSales,
        totalRevenue: metrics.totalRevenue,
        topProducts: metrics.topProducts,
        recentSales: metrics.recentSales,
        period: metrics.period,
      });

      res.json({
        status: 'success',
        data: {
          question,
          ...answer,
          context: {
            lowStockProducts: lowStock.length,
            recentSalesCount: recentSales.length,
          },
        },
        message: 'Business insight generated',
      });
    } catch (error: any) {
      console.error('Ask business error:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to generate insight',
      });
    }
  });
});

/**
 * GET /health
 * Health check endpoint
 */
export const health = functions.https.onRequest((req, res) => {
  corsHandler(req, res, () => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  });
});
