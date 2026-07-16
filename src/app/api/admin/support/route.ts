// src/app/api/admin/support/route.ts
// Update imports to use SupportChatWidget instead of ChatwootWidget
import { NextRequest } from 'next/server';
import SupportChatWidget from '@/components/SupportChatWidget';

export async function POST(request: NextRequest) {
  
  return new Response('Support chat widget updated to use our own implementation');
}