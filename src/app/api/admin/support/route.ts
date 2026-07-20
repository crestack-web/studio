// src/app/api/admin/support/route.ts
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  
  return new Response('Support chat widget updated to use our own implementation');
}