import { POST as recordSalePost } from '../../sales/record/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Staff-facing alias for the shared sale writer */
export async function POST(request: Request) {
  return recordSalePost(request as any);
}
