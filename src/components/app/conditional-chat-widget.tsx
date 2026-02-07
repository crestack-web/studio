'use client';

import { usePathname } from 'next/navigation';
import { ChatWidget } from '@/components/app/chat-widget';

function isChatEnabledPath(pathname: string | null): boolean {
  if (!pathname) return false;

  // Marketplace home page only
  if (pathname === '/market') return true;

  // Welcome page
  if (pathname === '/welcome') return true;

  // Investor pages (entire section)
  if (pathname === '/investor' || pathname.startsWith('/investor/')) return true;

  // Agents pages (admin section)
  if (pathname === '/admin/agents' || pathname.startsWith('/admin/agents/')) return true;

  return false;
}

export function ConditionalChatWidget() {
  const pathname = usePathname();

  if (!isChatEnabledPath(pathname)) return null;

  return <ChatWidget />;
}
