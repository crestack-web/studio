'use client';

import React, {
  useState, useRef, useEffect, useCallback, KeyboardEvent,
} from 'react';
import { initializeFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';
import { useSell } from '../context/SellContext';
import { suggestTheme } from '@/app/store/themes/registry';
import styles from './StoreSetupWizard.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WizardSuggestions {
  storeName: string;
  storeSlug: string;
  primaryColor: string;
  secondaryColor: string;
  businessCategory: string;
  currency: string;
  tagline: string;
  collectionNames: string[];
  storePolicy: string;
  theme?: string;
  faq: { q: string; a: string }[];
}

interface Message {
  id: string;
  role: 'mo' | 'user';
  text: string;
}

type GeminiHistory = { role: 'user' | 'model'; parts: [{ text: string }] }[];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2);
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 30);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className={styles.msgWrap}>
      <div className={[styles.msgAvatar, styles.msgAvatarMO].join(' ')}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1784636144/mo_sell_chat_ucbw3x.png" alt="Mo" width={30} height={30} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 9 }} />
      </div>
      <div className={styles.typing}>
        <div className={styles.typingDot} />
        <div className={styles.typingDot} />
        <div className={styles.typingDot} />
      </div>
    </div>
  );
}

interface FieldCardProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onRegenerate: () => void;
  multiline?: boolean;
}

function FieldCard({ label, value, onChange, onRegenerate, multiline }: FieldCardProps) {
  return (
    <div className={styles.fieldCard}>
      <div className={styles.fieldHeader}>
        <span className={styles.fieldLabel}>{label}</span>
        <div className={styles.fieldActions}>
          <button className={styles.fieldBtn} onClick={onRegenerate} title="Ask MO to regenerate">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
            </svg>
            Regenerate
          </button>
        </div>
      </div>
      {multiline ? (
        <textarea
          className={styles.fieldInput}
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={3}
        />
      ) : (
        <input
          className={styles.fieldInput}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

// ─── Theme-faithful mini storefront ──────────────────────────────────────────

interface MiniStorefrontProps {
  s: WizardSuggestions;
  logoPreview: string | null;
}

function MiniStorefront({ s, logoPreview }: MiniStorefrontProps) {
  const theme = s.theme || suggestTheme(s.businessCategory);
  const primary   = s.primaryColor;
  const secondary = s.secondaryColor;

  // Theme-specific palette overrides (mirrors ThemedHero + storefront.css themes)
  const palette: Record<string, { bg: string; surface: string; text1: string; text2: string; border: string; ctaBg: string; ctaColor: string; heroBg: string }> = {
    classic: {
      bg: '#F8FAFC', surface: '#fff', text1: '#0F172A', text2: '#475569',
      border: '#E2E8F0', ctaBg: 'rgba(255,255,255,0.22)', ctaColor: '#fff',
      heroBg: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
    },
    luxe: {
      bg: '#0A0A0A', surface: '#111', text1: '#F5F0E8', text2: '#A89878',
      border: '#2A2A2A', ctaBg: 'transparent', ctaColor: '#C9A84C',
      heroBg: '#0A0A0A',
    },
    market: {
      bg: '#FFF7ED', surface: '#fff', text1: '#1C0A00', text2: '#92400E',
      border: '#FDE8D0', ctaBg: '#fff', ctaColor: '#EA580C',
      heroBg: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
    },
    studio: {
      bg: '#FAFAFA', surface: '#fff', text1: '#18181B', text2: '#71717A',
      border: '#E4E4E7', ctaBg: 'transparent', ctaColor: '#18181B',
      heroBg: '#FAFAFA',
    },
    bold: {
      bg: '#09090B', surface: '#111', text1: '#FAFAFA', text2: '#A1A1AA',
      border: '#27272A', ctaBg: '#22C55E', ctaColor: '#09090B',
      heroBg: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
    },
    minimal: {
      bg: '#F8F8F5', surface: '#fff', text1: '#1A1A18', text2: '#71717A',
      border: '#E5E5E0', ctaBg: '#1A1A18', ctaColor: '#F8F8F5',
      heroBg: '#F8F8F5',
    },
  };
  const p = palette[theme] ?? palette.classic;

  // Hero text color — light themes with light hero need dark text
  const heroTextColor = ['studio', 'minimal'].includes(theme) ? p.text1 : '#fff';
  const heroTextShadow = ['studio', 'minimal'].includes(theme) ? 'none' : '0 2px 8px rgba(0,0,0,0.28)';

  // CTA label per theme
  const ctaLabel: Record<string, string> = {
    classic: 'Shop Now →', luxe: 'Explore Collection', market: 'Shop Now →',
    studio: 'View Collection', bold: 'Shop Now →', minimal: 'Shop the Collection',
  };
  const ctaBorder = theme === 'luxe' ? '1px solid #C9A84C' : theme === 'studio' ? `1px solid ${p.text1}` : 'none';

  return (
    <div style={{
      background: p.bg,
      borderRadius: 10,
      overflow: 'hidden',
      border: `1px solid ${p.border}`,
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      fontSize: 13,
      color: p.text1,
      transition: 'all 0.35s ease',
    }}>
      {/* ── Mini Nav ── */}
      <div style={{
        height: 40,
        background: p.surface,
        borderBottom: `1px solid ${p.border}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        gap: 10,
      }}>
        {logoPreview ? (
          <img src={logoPreview} alt="logo" style={{ width: 22, height: 22, borderRadius: 5, objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: 22, height: 22, borderRadius: 5, flexShrink: 0,
            background: `linear-gradient(135deg, ${primary}, ${secondary})`,
          }} />
        )}
        <span style={{ fontWeight: 700, fontSize: 12, color: p.text1, letterSpacing: '-0.01em', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {s.storeName || 'Your Store'}
        </span>
        <div style={{
          padding: '4px 10px', borderRadius: 6,
          background: primary, color: '#fff',
          fontSize: 10, fontWeight: 700,
        }}>
          Cart
        </div>
      </div>

      {/* ── Mini Hero ── */}
      <div style={{
        background: p.heroBg,
        padding: '22px 18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 7,
        transition: 'background 0.4s ease',
        position: 'relative',
      }}>
        {theme === 'luxe' && (
          <p style={{ fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C9A84C', fontWeight: 500 }}>
            Welcome
          </p>
        )}
        {theme === 'market' && (
          <p style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: heroTextColor, opacity: 0.85 }}>
            🛍️ Fresh arrivals daily
          </p>
        )}
        {theme === 'minimal' && (
          <p style={{ fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#71717A', fontWeight: 500 }}>
            Curated Collection
          </p>
        )}
        <h1 style={{
          fontSize: 18,
          fontWeight: 800,
          color: heroTextColor,
          textShadow: heroTextShadow,
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
          margin: 0,
          transition: 'color 0.3s',
        }}>
          {theme === 'classic' ? `Welcome to ${s.storeName || 'Your Store'}` : (s.storeName || 'Your Store')}
        </h1>
        {s.tagline && (
          <p style={{ fontSize: 11, color: heroTextColor, opacity: 0.85, margin: 0, lineHeight: 1.4, maxWidth: 280, transition: 'opacity 0.3s' }}>
            {s.tagline}
          </p>
        )}
        <div style={{
          display: 'inline-flex', alignItems: 'center',
          marginTop: 6, padding: '5px 14px',
          background: p.ctaBg,
          color: p.ctaColor,
          border: ctaBorder,
          borderRadius: theme === 'market' ? 100 : 6,
          fontWeight: 700, fontSize: 10,
          width: 'fit-content',
          backdropFilter: theme === 'classic' ? 'blur(4px)' : undefined,
        }}>
          {ctaLabel[theme] ?? 'Shop Now →'}
        </div>
      </div>

      {/* ── Mini Collections strip ── */}
      {s.collectionNames.length > 0 && (
        <div style={{ padding: '14px 14px 4px', background: p.bg }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: p.text2, marginBottom: 8 }}>
            Collections
          </p>
          <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 10 }}>
            {s.collectionNames.map((name, i) => (
              <div key={i} style={{
                flexShrink: 0,
                borderRadius: 8,
                overflow: 'hidden',
                border: `1px solid ${p.border}`,
                background: p.surface,
                minWidth: 70,
              }}>
                <div style={{
                  height: 38,
                  background: `linear-gradient(135deg, ${primary}55, ${secondary}55)`,
                }} />
                <div style={{ padding: '5px 8px' }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 9, color: p.text1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Mini product grid placeholder ── */}
      <div style={{ padding: '10px 14px 14px', background: p.bg }}>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: p.text2, marginBottom: 8 }}>
          All Products
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ borderRadius: 8, overflow: 'hidden', background: p.surface, border: `1px solid ${p.border}` }}>
              <div style={{ height: 50, background: `${p.border}` }} />
              <div style={{ padding: '5px 7px' }}>
                <div style={{ height: 7, borderRadius: 3, background: p.border, marginBottom: 4 }} />
                <div style={{ height: 7, width: '60%', borderRadius: 3, background: primary + '40' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Mini footer ── */}
      <div style={{
        borderTop: `1px solid ${p.border}`,
        padding: '8px 14px',
        background: p.surface,
        textAlign: 'center',
        fontSize: 9,
        color: p.text2,
      }}>
        © {new Date().getFullYear()} {s.storeName || 'Your Store'} · Powered by Busmo
      </div>
    </div>
  );
}

// ─── Preview panel ───────────────────────────────────────────────────────────

interface PreviewProps {
  suggestions: WizardSuggestions;
  setSuggestions: React.Dispatch<React.SetStateAction<WizardSuggestions | null>>;
  onRegenerate: (field: string) => void;
  logoPreview: string | null;
}

function PreviewPanel({ suggestions: s, setSuggestions, onRegenerate, logoPreview }: PreviewProps) {
  const update = (key: keyof WizardSuggestions, value: unknown) =>
    setSuggestions(prev => prev ? { ...prev, [key]: value } : prev);

  const theme = s.theme || suggestTheme(s.businessCategory);

  return (
    <div className={styles.preview}>

      {/* ── Live store preview label + badge ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p className={styles.previewLabel} style={{ margin: 0 }}>Live preview</p>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          fontSize: '0.7rem', fontWeight: 600, color: 'var(--sell-primary)',
          background: 'var(--sell-primary-lt)', borderRadius: 100,
          padding: '2px 9px',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: 'var(--sell-primary)',
            animation: 'sellPulse 1.4s ease-in-out infinite',
          }} />
          {theme.charAt(0).toUpperCase() + theme.slice(1)} theme
        </div>
      </div>

      {/* ── The actual storefront mini-preview ── */}
      <div className={styles.storeMiniWrap}>
        {/* Browser chrome */}
        <div className={styles.browserBar}>
          <div className={styles.browserDots}>
            <span /><span /><span />
          </div>
          <div className={styles.browserUrl}>
            busmo.io/store/<strong>{s.storeSlug}</strong>
          </div>
        </div>
        <div className={styles.browserViewport}>
          <MiniStorefront s={s} logoPreview={logoPreview} />
        </div>
      </div>

      {/* ── Editable fields ── */}
      <FieldCard
        label="Store Name"
        value={s.storeName}
        onChange={v => { update('storeName', v); update('storeSlug', slugify(v)); }}
        onRegenerate={() => onRegenerate('Change the store name to something different')}
      />

      <FieldCard
        label="Tagline"
        value={s.tagline}
        onChange={v => update('tagline', v)}
        onRegenerate={() => onRegenerate('Give me a new tagline for the store')}
      />

      {/* Colors */}
      <div className={styles.fieldCard}>
        <div className={styles.fieldHeader}>
          <span className={styles.fieldLabel}>Brand Colors</span>
          <button className={styles.fieldBtn} onClick={() => onRegenerate('Suggest a different color palette for my store')}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
            </svg>
            Regenerate
          </button>
        </div>
        <div style={{ padding: '10px 14px', display: 'flex', gap: 14, alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--sell-text-2)', cursor: 'pointer' }}>
            <input
              type="color"
              value={s.primaryColor}
              onChange={e => update('primaryColor', e.target.value)}
              style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--sell-border)', cursor: 'pointer', padding: 2 }}
            />
            Primary
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--sell-text-2)', cursor: 'pointer' }}>
            <input
              type="color"
              value={s.secondaryColor}
              onChange={e => update('secondaryColor', e.target.value)}
              style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--sell-border)', cursor: 'pointer', padding: 2 }}
            />
            Secondary
          </label>
        </div>
      </div>

      {/* Collections */}
      <div>
        <p className={styles.previewLabel}>Collections</p>
        <div className={styles.chipList}>
          {s.collectionNames.map((name, i) => (
            <span key={i} className={styles.chip}>{name}</span>
          ))}
          <button
            className={[styles.chip, styles.fieldBtn].join(' ')}
            style={{ background: 'none', border: '1px dashed var(--sell-border)' }}
            onClick={() => onRegenerate('Suggest different collection names for my store')}
          >
            ↻ New ideas
          </button>
        </div>
      </div>

      {/* Store policy */}
      <FieldCard
        label="Store Policy"
        value={s.storePolicy}
        onChange={v => update('storePolicy', v)}
        onRegenerate={() => onRegenerate('Rewrite the store returns policy')}
        multiline
      />
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

interface Props {
  onClose?: () => void;
}

const OPENING_MESSAGE: Message = {
  id: 'mo-intro',
  role: 'mo',
  text: "Hey! I'm MO. I'll set up your online store in a few minutes.\n\nFirst — what do you sell?",
};

export function StoreSetupWizard({ onClose }: Props) {
  const { user, refreshStoreConfig, navigateTo, showToast } = useSell();

  const [messages, setMessages]           = useState<Message[]>([OPENING_MESSAGE]);
  const [input, setInput]                 = useState('');
  const [isTyping, setIsTyping]           = useState(false);
  const [suggestions, setSuggestions]     = useState<WizardSuggestions | null>(null);
  const [saving, setSaving]               = useState(false);
  const [history, setHistory]             = useState<GeminiHistory>([]);
  const [wizardLogoFile, setWizardLogoFile] = useState<File | null>(null);
  const [wizardLogoPreview, setWizardLogoPreview] = useState<string | null>(null);
  const [wizardLogoUrl, setWizardLogoUrl] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const addMessage = useCallback((role: 'mo' | 'user', text: string) => {
    setMessages(prev => [...prev, { id: uid(), role, text }]);
  }, []);

  // ── Send message to wizard API ─────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userText = text.trim();
    setInput('');
    addMessage('user', userText);
    setIsTyping(true);

    // Build Gemini-format history
    const newHistory: GeminiHistory = [
      ...history,
      { role: 'user', parts: [{ text: userText }] },
    ];

    try {
      const res = await fetch('/api/sell/wizard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          businessId: user?.businessId,
          conversationHistory: history, // send history BEFORE this message
        }),
      });

      if (!res.ok) {
        let errMsg = "Sorry, I had a hiccup. Try sending that again.";
        try {
          const errData = await res.json() as { error?: string; details?: string };
          if (res.status === 503) {
            errMsg = "I'm not reachable right now — the AI service isn't configured. Check that GOOGLE_GENAI_API_KEY is set and restart the dev server.";
          } else if (errData.details) {
            errMsg = `Something went wrong: ${errData.details}`;
          }
        } catch { /* JSON parse failed — use default */ }
        addMessage('mo', errMsg);
        return;
      }
      const data = await res.json() as { answer: string; suggestions: WizardSuggestions | null };

      addMessage('mo', data.answer);

      // Update suggestions if MO returned new ones
      if (data.suggestions) {
        setSuggestions(prev => ({
          ...(prev ?? {}),
          ...data.suggestions,
          // Ensure slug is always in sync with name
          storeSlug: data.suggestions!.storeSlug || slugify(data.suggestions!.storeName),
        } as WizardSuggestions));
      }

      // Append assistant turn to history
      setHistory([
        ...newHistory,
        { role: 'model', parts: [{ text: data.answer }] },
      ]);
    } catch {
      addMessage('mo', "Network error — check your connection and try again.");
    } finally {
      setIsTyping(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [history, isTyping, user?.businessId, addMessage]);

  // Ask MO to change a specific field
  const handleRegenerate = useCallback((prompt: string) => {
    sendMessage(prompt);
  }, [sendMessage]);

  // Handle textarea enter
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // ── Save store config to Firestore ─────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!suggestions || !user?.businessId) return;
    setSaving(true);
    try {
      const { firestore } = initializeFirebase();

      // Upload logo if one was selected — capture URL directly (don't rely on state)
      let resolvedLogoUrl = wizardLogoUrl;
      if (wizardLogoFile) {
        const { storage } = initializeFirebase();
        const { ref: storageRef, uploadBytes, getDownloadURL } = await import('firebase/storage');
        const imgRef = storageRef(storage, `stores/${user.businessId}/logo_${Date.now()}`);
        await uploadBytes(imgRef, wizardLogoFile);
        resolvedLogoUrl = await getDownloadURL(imgRef);
        setWizardLogoUrl(resolvedLogoUrl);
      }

      // Check slug uniqueness (best-effort — server-side enforcement is in the wizard API)
      let slug = suggestions.storeSlug || slugify(suggestions.storeName);
      // Simple collision check: append businessId suffix if blank
      if (!slug) slug = slugify(suggestions.storeName + '-' + user.businessId.slice(0, 4));

      const configData = {
        storeSlug:        slug,
        storeName:        suggestions.storeName,
        logoUrl:          resolvedLogoUrl,
        primaryColor:     suggestions.primaryColor,
        secondaryColor:   suggestions.secondaryColor,
        businessCategory: suggestions.businessCategory,
        currency:         suggestions.currency || 'NGN',
        contactEmail:     user.email || '',
        contactPhone:     '',
        status:           'draft' as const,
        theme:            (suggestions.theme as any) || suggestTheme(suggestions.businessCategory),
        tagline:          suggestions.tagline,
        storePolicy:      suggestions.storePolicy,
        paystackPublicKey:'',
        enabledProductTypes: ['physical'],
        pickupLocations:  [],
        customDomain:     null,
        customDomainStatus: 'pending' as const,
        customDomainVerifiedAt: null,
        domainPurchaseRecord: null,
        createdAt:        serverTimestamp(),
        updatedAt:        serverTimestamp(),
      };

      // Write store/config
      await setDoc(
        doc(firestore, 'businesses', user.businessId, 'store', 'config'),
        configData
      );

      // Write storeIndex for O(1) slug → businessId lookup (avoids collectionGroup dependency)
      await setDoc(
        doc(firestore, 'storeIndex', slug),
        { businessId: user.businessId, storeName: suggestions.storeName, updatedAt: serverTimestamp() }
      );

      // Create collections
      const collectionsRef = collection(
        firestore, 'businesses', user.businessId, 'storeCollections'
      );
      for (const name of (suggestions.collectionNames ?? [])) {
        const collSnap = await getDocs(collectionsRef);
        const exists = collSnap.docs.some(d => d.data().title === name);
        if (!exists) {
          await setDoc(doc(collectionsRef), {
            title: name, description: '', coverImageUrl: null,
            productIds: [], createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
          });
        }
      }

      await refreshStoreConfig();
      showToast('Store created! Welcome to MO Sell 🎉', 'success');
      navigateTo('overview');
    } catch (err) {
      console.error('[wizard] Save error:', err);
      showToast('Failed to save. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  }, [suggestions, user, wizardLogoFile, wizardLogoUrl, refreshStoreConfig, showToast, navigateTo]);

  // ─── Render ────────────────────────────────────────────────────────────────
  const userInitial = user?.avatarContent ?? 'U';

  return (
    <div className={styles.overlay}>
      {/* ── Top bar ── */}
      <div className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <div className={styles.topbarLogo}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1784636144/mo_sell_chat_ucbw3x.png" alt="Mo" width={32} height={32} style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 9 }} />
          </div>
          <div>
            <div className={styles.topbarTitle}>Store Setup</div>
            <div className={styles.topbarSub}>MO will guide you through everything</div>
          </div>
        </div>
        {onClose && (
          <button className={styles.topbarClose} onClick={onClose} aria-label="Close wizard">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* ── Body ── */}
      <div className={styles.body}>

        {/* LEFT: Chat */}
        <div className={styles.chatPanel}>
          <div className={styles.messages}>
            {messages.map(msg => (
              <div
                key={msg.id}
                className={[styles.msgWrap, msg.role === 'user' ? styles.msgWrapUser : ''].join(' ')}
              >
                <div className={[
                  styles.msgAvatar,
                  msg.role === 'mo' ? styles.msgAvatarMO : styles.msgAvatarUser,
                ].join(' ')}>
                  {msg.role === 'mo' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1784636144/mo_sell_chat_ucbw3x.png" alt="Mo" width={30} height={30} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 9 }} />
                  ) : (
                    <span>{userInitial}</span>
                  )}
                </div>
                <div className={[
                  styles.bubble,
                  msg.role === 'mo' ? styles.bubbleMO : styles.bubbleUser,
                ].join(' ')}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className={styles.inputRow}>
            <div className={styles.inputWrap}>
              <textarea
                ref={inputRef}
                className={styles.input}
                placeholder="Type your message… (Enter to send)"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={isTyping}
              />
              <button
                className={styles.sendBtn}
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isTyping}
                aria-label="Send"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Preview */}
        {suggestions ? (
          <PreviewPanel
            suggestions={suggestions}
            setSuggestions={setSuggestions}
            onRegenerate={handleRegenerate}
            logoPreview={wizardLogoPreview}
          />
        ) : (
          <div className={styles.preview}>
            <div className={styles.previewEmpty}>
              <div className={styles.previewEmptyIcon}>✨</div>
              <p className={styles.previewEmptyTitle}>Your store preview</p>
              <p className={styles.previewEmptySub}>
                Tell MO what you sell and your store will appear here automatically.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom bar ── */}
      <div className={styles.bottomBar}>
        <div className={styles.bottomBarLeft}>
          {/* Logo upload */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 5 * 1024 * 1024) { showToast('Image must be under 5MB', 'error'); return; }
                setWizardLogoFile(file);
                const reader = new FileReader();
                reader.onloadend = () => setWizardLogoPreview(reader.result as string);
                reader.readAsDataURL(file);
              }}
            />
            {wizardLogoPreview ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <img
                  src={wizardLogoPreview}
                  alt="Logo preview"
                  style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--sell-border)' }}
                />
                <button
                  className={styles.btnSecondary}
                  style={{ fontSize: '0.75rem', padding: '5px 10px' }}
                  onClick={() => logoInputRef.current?.click()}
                >
                  Change logo
                </button>
              </div>
            ) : (
              <button
                className={styles.btnSecondary}
                style={{ fontSize: '0.78rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={() => logoInputRef.current?.click()}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Add logo (optional)
              </button>
            )}
            {suggestions
              ? 'Looking good? Edit anything or keep chatting with MO.'
              : 'Chat with MO to get started.'}
          </div>
        </div>
        <div className={styles.bottomBarRight}>
          {saving ? (
            <div className={styles.saving}>
              <div className={styles.savingSpinner} />
              Creating your store…
            </div>
          ) : (
            <>
              {onClose && (
                <button
                  className={styles.btnSecondary}
                  onClick={onClose}
                  title="Skip setup and go to dashboard — you can finish this later in Settings"
                >
                  Skip for now
                </button>
              )}
              <button
                className={styles.btnPrimary}
                onClick={handleSave}
                disabled={!suggestions || saving}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Create my store
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
