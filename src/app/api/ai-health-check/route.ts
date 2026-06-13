import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET(req: NextRequest) {
  const diagnosticReport: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
  };

  // 1. Environment variable loading
  diagnosticReport.environmentVariables = {
    GOOGLE_GENAI_API_KEY: process.env.GOOGLE_GENAI_API_KEY ? 'PRESENT' : 'MISSING',
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? 'PRESENT' : 'MISSING',
    NODE_ENV: process.env.NODE_ENV,
  };

  // 2. API key detection
  const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY;
  diagnosticReport.apiKeyStatus = {
    exists: !!apiKey,
    length: apiKey?.length || 0,
    prefix: apiKey ? apiKey.substring(0, 10) + '...' : 'N/A',
  };

  if (!apiKey) {
    diagnosticReport.error = 'API key is missing';
    return NextResponse.json(diagnosticReport, { status: 500 });
  }

  // 3. Initialize Google AI SDK
  const genAI = new GoogleGenerativeAI(apiKey);
  diagnosticReport.sdk = {
    name: '@google/generative-ai',
    initialized: true,
  };

  // 4. List available models
  try {
    console.log('🔍 Listing available models...');
    const models = await genAI.listModels();
    diagnosticReport.availableModels = models.models.map((m: any) => ({
      name: m.name,
      displayName: m.displayName,
      description: m.description,
      version: m.version,
    }));
    console.log('✅ Available models:', diagnosticReport.availableModels.length);
  } catch (error: any) {
    console.error('❌ Failed to list models:', error);
    diagnosticReport.listModelsError = {
      message: error.message,
      name: error.name,
    };
  }

  // 5. Test prompt to Gemini with first available model
  const testPrompt = 'Hello, this is a test. Please respond with "AI is working".';
  diagnosticReport.testRequest = {
    prompt: testPrompt,
    timestamp: new Date().toISOString(),
  };

  // Try different model names
  const modelNamesToTry = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash-001',
    'gemini-1.5-pro',
    'gemini-1.5-pro-latest',
    'gemini-1.5-pro-001',
    'gemini-pro',
    'gemini-pro-latest',
    'gemini-1.0-pro',
    'gemini-1.0-pro-latest',
    'models/gemini-1.5-flash',
    'models/gemini-1.5-pro',
  ];

  diagnosticReport.modelTests = [];

  for (const modelName of modelNamesToTry) {
    try {
      console.log(`🔍 Testing model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const response = await model.generateContent(testPrompt);
      const responseText = response.response.text();

      diagnosticReport.modelTests.push({
        model: modelName,
        success: true,
        response: responseText,
      });

      console.log(`✅ Model ${modelName} works!`);

      // If we found a working model, use it
      diagnosticReport.workingModel = modelName;
      break;
    } catch (error: any) {
      console.error(`❌ Model ${modelName} failed:`, error.message);
      diagnosticReport.modelTests.push({
        model: modelName,
        success: false,
        error: {
          message: error.message,
          name: error.name,
        },
      });

      // Capture full error response
      if (error.response) {
        diagnosticReport.modelTests[diagnosticReport.modelTests.length - 1].error.response = {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        };
      }
    }
  }

  return NextResponse.json(diagnosticReport, { status: 200 });
}
