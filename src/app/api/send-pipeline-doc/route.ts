import { NextRequest, NextResponse } from 'next/server';
import { sendTransactionalEmail } from '@/services/email/brevo-service';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Read the pipeline document
    const filePath = join(process.cwd(), 'DATA_PIPELINE_ANALYSIS.md');
    const documentContent = readFileSync(filePath, 'utf-8');

    // Create HTML email with the document content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
          h2 { color: #34495e; margin-top: 30px; }
          h3 { color: #7f8c8d; }
          .status-working { color: #27ae60; font-weight: bold; }
          .status-partial { color: #f39c12; font-weight: bold; }
          .status-missing { color: #e74c3c; font-weight: bold; }
          pre { background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; }
          code { background: #f8f9fa; padding: 2px 5px; border-radius: 3px; }
          ul { margin: 10px 0; }
          li { margin: 5px 0; }
        </style>
      </head>
      <body>
        <h1>Busmo Data Pipeline Analysis</h1>
        <p>Below is the complete data pipeline analysis document:</p>
        <pre style="white-space: pre-wrap; word-wrap: break-word;">${documentContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
        <p style="margin-top: 30px; color: #7f8c8d; font-size: 12px;">
          This document was generated automatically by Busmo Data Pipeline Analysis System.
        </p>
      </body>
      </html>
    `;

    // Send the email
    await sendTransactionalEmail({
      to: [{ email, name: 'Majnun' }],
      subject: 'Busmo Data Pipeline Analysis Document',
      htmlContent,
      sender: {
        name: 'Busmo Support',
        email: 'support@busmo.io',
      },
    });

    return NextResponse.json({ success: true, message: 'Document sent successfully' });
  } catch (error) {
    console.error('Error sending pipeline document:', error);
    return NextResponse.json({ error: 'Failed to send document' }, { status: 500 });
  }
}
