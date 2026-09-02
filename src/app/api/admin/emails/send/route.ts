import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin/require-admin-api';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { sendTransactionalEmail } from '@/services/email/brevo-service';
import { getAdminEmailTemplate } from '@/lib/admin/email-catalog';
import {
  buildMoSalesAnnouncementHtml,
  wrapBusmoEmailHtml,
} from '@/lib/admin/wrap-admin-email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Recipient = { email: string; name?: string };

function normalizeEmails(input: unknown): Recipient[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input
      .map((r) => {
        if (typeof r === 'string') return { email: r.trim().toLowerCase() };
        return {
          email: String((r as any).email || '')
            .trim()
            .toLowerCase(),
          name: String((r as any).name || '').trim() || undefined,
        };
      })
      .filter((r) => r.email.includes('@'));
  }
  if (typeof input === 'string') {
    return input
      .split(/[\s,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.includes('@'))
      .map((email) => ({ email }));
  }
  return [];
}

async function loadAllUsers(): Promise<Recipient[]> {
  const admin = getSupabaseAdmin();
  const out: Recipient[] = [];
  const page = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await admin
      .from('users')
      .select('email, name, full_name, display_name')
      .not('email', 'is', null)
      .range(from, from + page - 1);
    if (error) throw new Error(error.message);
    const rows = data || [];
    for (const row of rows as any[]) {
      const email = String(row.email || '')
        .trim()
        .toLowerCase();
      if (!email.includes('@')) continue;
      out.push({
        email,
        name: row.name || row.full_name || row.display_name || email.split('@')[0],
      });
    }
    if (rows.length < page) break;
    from += page;
  }
  const seen = new Set<string>();
  return out.filter((r) => {
    if (seen.has(r.email)) return false;
    seen.add(r.email);
    return true;
  });
}

function buildHtml(
  templateId: string,
  recipient: Recipient,
  custom?: { subject?: string; html?: string; bodyHtml?: string }
): { subject: string; html: string } {
  if (templateId === 'mo_sales_announcement') {
    return {
      subject: 'MO Sales is coming — selected businesses go live 15 September 2026',
      html: buildMoSalesAnnouncementHtml(recipient.name),
    };
  }

  if (templateId === 'custom_manual' || templateId === 'custom_mo_draft') {
    const subject = String(custom?.subject || '').trim();
    if (!subject) throw new Error('Subject is required for custom emails');
    let html = String(custom?.html || '').trim();
    if (!html && custom?.bodyHtml) {
      html = wrapBusmoEmailHtml({
        title: subject,
        subtitle: 'A message from Busmo',
        bodyHtml: custom.bodyHtml,
      });
    }
    if (!html) throw new Error('HTML body is required for custom emails');
    return { subject, html };
  }

  // Params-required templates: send a branded notice that full automation needs params
  // Still allow admin to force a simple branded message using optional body
  if (custom?.html || custom?.bodyHtml) {
    const subject = String(custom?.subject || getAdminEmailTemplate(templateId)?.defaultSubject || 'Message from Busmo');
    const html =
      custom.html ||
      wrapBusmoEmailHtml({
        title: subject,
        bodyHtml: custom.bodyHtml || '',
      });
    return { subject, html };
  }

  throw new Error(
    `Template "${templateId}" needs specific parameters. Use Manual email or Write with MO, or provide html/bodyHtml.`
  );
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAdminUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY is not configured on the server' },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const templateId = String(body.templateId || 'custom_manual').trim();
    const audience = String(body.audience || 'single').trim(); // single | list | all_users
    const confirmAll = Boolean(body.confirmAll);
    const dryRun = Boolean(body.dryRun);

    let recipients: Recipient[] = [];
    if (audience === 'all_users') {
      if (!confirmAll) {
        return NextResponse.json(
          { error: 'Sending to all users requires confirmAll: true' },
          { status: 400 }
        );
      }
      recipients = await loadAllUsers();
    } else if (audience === 'list') {
      recipients = normalizeEmails(body.recipients || body.emails);
    } else {
      recipients = normalizeEmails(body.email || body.recipients || body.emails);
    }

    if (!recipients.length) {
      return NextResponse.json({ error: 'No valid recipients' }, { status: 400 });
    }

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        templateId,
        recipientCount: recipients.length,
        sample: recipients.slice(0, 5),
      });
    }

    const results: Array<{ email: string; ok: boolean; id?: string; error?: string }> = [];
    let sent = 0;
    let failed = 0;

    for (const r of recipients) {
      try {
        const { subject, html } = buildHtml(templateId, r, {
          subject: body.subject,
          html: body.html,
          bodyHtml: body.bodyHtml,
        });
        const res = await sendTransactionalEmail({
          to: [{ email: r.email, name: r.name }],
          subject,
          htmlContent: html,
        });
        sent += 1;
        results.push({ email: r.email, ok: true, id: res.id });
        // light rate limit for bulk
        if (recipients.length > 5) {
          await new Promise((r) => setTimeout(r, 350));
        }
      } catch (e: any) {
        failed += 1;
        results.push({ email: r.email, ok: false, error: e?.message || 'send failed' });
      }
    }

    console.log('[admin/emails/send]', {
      by: user.email,
      templateId,
      audience,
      sent,
      failed,
    });

    return NextResponse.json({
      success: failed === 0,
      templateId,
      sent,
      failed,
      total: recipients.length,
      results: results.slice(0, 50),
      truncated: results.length > 50,
    });
  } catch (e: any) {
    console.error('[admin/emails/send]', e);
    return NextResponse.json({ error: e?.message || 'Send failed' }, { status: 500 });
  }
}
