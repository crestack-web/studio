import { NextRequest, NextResponse } from 'next/server';
import { sendTransactionalEmail } from '@/services/email/brevo-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, name, planFrom, planTo } = body;

    if (!to || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: to, name' },
        { status: 400 }
      );
    }

    // Hausa welcome email content (sent via Resend)
    const subject = `🎉 Barka da Zuwa Busmo! - An Minku Zuwa Shakarwa (${planTo || 'Standard'}) Plan`;
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Barka da Zuwa Busmo!</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              background-color: #f4f4f4; 
              margin: 0; 
              padding: 0;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: white; 
              border-radius: 12px; 
              overflow: hidden; 
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
              background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); 
              padding: 40px 30px; 
              text-align: center; 
              color: white;
            }
            .header h1 { 
              margin: 0; 
              font-size: 32px; 
              font-weight: 700;
            }
            .header p { 
              margin: 10px 0 0; 
              font-size: 18px; 
              opacity: 0.95;
            }
            .content { 
              padding: 40px 30px; 
              background: #fff;
            }
            .welcome-box {
              background: #F3EFFE;
              padding: 25px;
              border-radius: 12px;
              margin: 25px 0;
              border-left: 4px solid #6B3FE7;
            }
            .welcome-box h2 {
              color: #6B3FE7;
              margin-top: 0;
              font-size: 24px;
            }
            .features {
              background: #f8f9fa;
              border-radius: 8px;
              padding: 25px;
              margin: 25px 0;
            }
            .features h3 {
              color: #6B3FE7;
              margin-top: 0;
              font-size: 20px;
            }
            .features ul {
              list-style: none;
              padding: 0;
              margin: 0;
            }
            .features li {
              padding: 12px 0;
              border-bottom: 1px solid #e9ecef;
              color: #555;
            }
            .features li:last-child {
              border-bottom: none;
            }
            .features li:before {
              content: "✓ ";
              color: #6B3FE7;
              font-weight: bold;
              margin-right: 8px;
            }
            .button { 
              display: inline-block; 
              padding: 16px 40px; 
              background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); 
              color: white; 
              text-decoration: none; 
              border-radius: 8px; 
              font-weight: 600; 
              font-size: 16px; 
              margin: 25px 0;
            }
            .highlight {
              background: #F0FDF4;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #10B981;
            }
            .highlight h3 {
              color: #065F46;
              margin-top: 0;
            }
            .footer { 
              background: #f8f9fa; 
              padding: 30px; 
              text-align: center; 
              font-size: 14px; 
              color: #6c757d; 
              border-top: 1px solid #e9ecef;
            }
            .hausa-text {
              font-size: 16px;
              color: #555;
              margin: 15px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Barka da Zuwa Busmo!</h1>
              <p>An Minku Zuwa Shakarwa (${planTo || 'Standard'}) Plan</p>
            </div>
            <div class="content">
              <p class="hausa-text">Sannu ${name},</p>
              
              <div class="welcome-box">
                <h2>🥳 Murna Muku!</h2>
                <p class="hausa-text">
                  Muna murna domin ka / ki haɗa da Busmo! An haɓaka asusun ka / ki daga 
                  <strong>${planFrom || 'Starter'} Plan</strong> zuwa <strong>${planTo || 'Standard'} Plan</strong>.
                </p>
                <p class="hausa-text">
                  Yanzu kana / kina da damar samun abubuwa masu yawa da za su taimaka 
                  kasuwancin ka / ki ya ci gaba.
                </p>
              </div>

              <div class="highlight">
                <h3>⭐ Abubuwan da Ka / Ki Samu:</h3>
                <p class="hausa-text">Da ${planTo || 'Standard'} Plan, yanzu kana / kina da:</p>
              </div>

              <div class="features">
                <h3>🌟 Dā Mabiyoyin Busmo</h3>
                <ul>
                  <li>Rikodi sayarwa da kuma bin diddigin kaya</li>
                  <li>Nemi MO AI mai zurfin nesa (unlimited messages)</li>
                  <li>Lilami koɗo da kuma kiyaye bayanan kasuwanci</li>
                  <li>Samun rahoto mai zurfi da bayanan kasuwanci</li>
                  <li>Hawakan samun ƙarfin kasuwanci tare da Bukatun Credit</li>
                  <li>Sarrafa ma'aikata da goyon bayansu</li>
                  <li>Adana bayanan kasuwanci tare da Backup</li>
                  <li>Tallafi mussamman mai girma</li>
                </ul>
              </div>

              <div class="hausa-text">
                <strong>Ta yaya za a fara?</strong> Shiga dashboard ɗin ka / ki ka fara 
                rijistar sayarwa, ƙara kayayyaki, da neman MO AI don samun shawara 
                game da kasuwancin ka / ki.
              </div>

              <div style="text-align: center;">
                <a href="https://busmo.io/dashboard" class="button">
                  Shiga Dashboard → 
                </a>
              </div>

              <div class="hausa-text">
                Ina / Ina bukatar taimako? Tuntuɓi ƙungiyar tallafin mu a 
                <a href="mailto:support@busmo.io">support@busmo.io</a> ko kai wa 
                <a href="https://busmo.io/support">shafin tallafi</a>.
              </div>

              <p class="hausa-text" style="margin-top: 30px;">
                <strong>Na gode da zaɓar Busmo!</strong><br>
                Muna godiya da kasancewarmu a cikin nasarar kasuwancin ka / ki.
              </p>

              <p class="hausa-text">
                <strong>Ƙungiyar Busmo</strong><br>
                <em>Mũnin kasuwanci na Afirka</em>
              </p>
            </div>
            <div class="footer">
              <p>&copy; 2026 Busmo. Built for African commerce</p>
              <p style="margin-top: 10px;">
                <a href="https://x.com/busmohq" style="color: #6B3FE7;">@busmohq</a> •
                <a href="https://instagram.com/busmodotio" style="color: #6B3FE7;">@busmodotio</a> •
                <a href="https://tiktok.com/@busmohq" style="color: #6B3FE7;">@busmohq</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

    const result = await sendTransactionalEmail({
      to: [{ email: to, name }],
      subject,
      htmlContent,
      sender: { name: 'Busmo Team', email: 'noreply@busmo.io' },
    });

    console.log('✅ Email sent successfully via Resend:', result.id);

    return NextResponse.json(
      { 
        success: true, 
        messageId: result.id,
        message: 'Email sent successfully'
      },
      { status: 200 }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('❌ Error sending email:', errorMessage);
    return NextResponse.json(
      { 
        error: 'Failed to send email',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
