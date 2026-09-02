import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin/require-admin';
import { ADMIN_EMAIL_TEMPLATES } from '@/lib/admin/email-catalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await requireAdminUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  return NextResponse.json({
    templates: ADMIN_EMAIL_TEMPLATES,
    from: process.env.EMAIL_FROM || process.env.RESEND_FROM || 'Busmo <support@busmo.io>',
    resendConfigured: Boolean(process.env.RESEND_API_KEY),
  });
}
