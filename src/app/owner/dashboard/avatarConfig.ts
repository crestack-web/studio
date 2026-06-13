import type { AvatarOption } from './types';

// ═══════════════════════════════════════════
//  Avatar Options Configuration
//  Static configuration for avatar colors and emojis
// ═══════════════════════════════════════════

export const AVATAR_COLORS: AvatarOption[] = [
  { id: 'c0',  type: 'color', content: 'AU', bg: '#6B3FE7',                                   color: '#fff' },
  { id: 'c1',  type: 'color', content: 'AU', bg: '#16A34A',                                   color: '#fff' },
  { id: 'c2',  type: 'color', content: 'AU', bg: '#2563EB',                                   color: '#fff' },
  { id: 'c3',  type: 'color', content: 'AU', bg: '#DC2626',                                   color: '#fff' },
  { id: 'c4',  type: 'color', content: 'AU', bg: '#D97706',                                   color: '#fff' },
  { id: 'c5',  type: 'color', content: 'AU', bg: '#0D9488',                                   color: '#fff' },
  { id: 'c6',  type: 'color', content: 'AU', bg: '#DB2777',                                   color: '#fff' },
  { id: 'c7',  type: 'color', content: 'AU', bg: '#7C3AED',                                   color: '#fff' },
  { id: 'c8',  type: 'color', content: 'AU', bg: '#0F172A',                                   color: '#fff' },
  { id: 'c9',  type: 'color', content: 'AU', bg: 'linear-gradient(135deg,#6B3FE7,#EC4899)',   color: '#fff' },
  { id: 'c10', type: 'color', content: 'AU', bg: 'linear-gradient(135deg,#16A34A,#0D9488)',   color: '#fff' },
  { id: 'c11', type: 'color', content: 'AU', bg: 'linear-gradient(135deg,#2563EB,#7C3AED)',   color: '#fff' },
];

export const AVATAR_EMOJIS: AvatarOption[] = [
  '😊','🦁','🐯','🦊','🐺','🦋','🌟','🔥','⚡','💎','🚀','🎯','💡','🌿','🎭','🏆','👑','🎨',
].map((emoji, i) => ({
  id: `e${i}`,
  type: 'emoji',
  content: emoji,
  bg: 'var(--bg)',
  color: 'var(--text-1)',
}));
