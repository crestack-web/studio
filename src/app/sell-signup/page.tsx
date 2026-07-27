'use client';

import React, { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { initializeFirebase } from '@/firebase';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import posthog from 'posthog-js';

// ── Tokens ────────────────────────────────────────────────────────────────────
const C = {
  primary: '#0EA5E9', primaryDk: '#0369A1', accent: '#6366F1',
  bg: '#F0F9FF', surface: '#FFFFFF', border: '#E0EFFA',
  text1: '#0C1A2E', text2: '#3D5A7A', text3: '#8AAABF',
  green: '#16A34A', greenBg: '#DCFCE7', red: '#DC2626', redBg: '#FEE2E2',
};
const FONT_DISPLAY = "'Clash Display','Plus Jakarta Sans',sans-serif";
const FONT_BODY = "'Plus Jakarta Sans',system-ui,sans-serif";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Message { id: string; role: 'mo' | 'user'; text: string; }
type GeminiHistory = { role: 'user' | 'model'; parts: [{ text: string }] }[];

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
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2); }
function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 30);
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SellSignupPage() {
  const router = useRouter();

  // Step tracking
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Account
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Step 2: Business
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');

  // Step 3: MO Chat
  const [messages, setMessages] = useState<Message[]>([
    { id: 'mo-intro', role: 'mo', text: "Hey! I'm MO. I'll set up your online store.\n\nTell me about what you sell — products, services, courses, anything. The more detail, the better I can help." }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<WizardSuggestions | null>(null);
  const [history, setHistory] = useState<GeminiHistory>([]);
  const [storeCreated, setStoreCreated] = useState(false);

  // Shared
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');
  const [businessId, setBusinessId] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const addMessage = useCallback((role: 'mo' | 'user', text: string) => {
    setMessages(prev => [...prev, { id: uid(), role, text }]);
  }, []);

  // ── Step 1→2: Create account ──────────────────────────────────────────────
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { auth, firestore } = initializeFirebase();
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: fullName });

      // Create user doc
      const uid_val = cred.user.uid;
      const businessIdVal = `biz_${uid_val.slice(0, 12)}`;

      await setDoc(doc(firestore, 'users', uid_val), {
        displayName: fullName,
        email: email,
        businessId: businessIdVal,
        plan: 'starter',
        moSellAccess: true,
        createdAt: serverTimestamp(),
      });

      // Create business doc
      await setDoc(doc(firestore, 'businesses', businessIdVal), {
        ownerUserId: uid_val,
        businessName: businessName || `${fullName}'s Business`,
        businessType: businessType,
        createdAt: serverTimestamp(),
      });

      setUserId(uid_val);
      setBusinessId(businessIdVal);

      posthog.capture('sell_signup_completed', { step: 1, businessType });

      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2→3: Save business info ──────────────────────────────────────────
  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { firestore } = initializeFirebase();
      await setDoc(doc(firestore, 'businesses', businessId), {
        businessName,
        businessType,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      posthog.capture('sell_signup_completed', { step: 2, businessType });
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Send message to MO ────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return;
    const userText = text.trim();
    setInput('');
    addMessage('user', userText);
    setIsTyping(true);

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
          businessId,
          conversationHistory: history,
        }),
      });

      if (!res.ok) {
        addMessage('mo', "Sorry, I had a hiccup. Try again.");
        setIsTyping(false);
        return;
      }

      const data = await res.json() as { answer: string; suggestions: WizardSuggestions | null };
      addMessage('mo', data.answer);

      if (data.suggestions) {
        setSuggestions(prev => ({
          ...(prev ?? {}),
          ...data.suggestions,
          storeSlug: data.suggestions!.storeSlug || slugify(data.suggestions!.storeName),
        } as WizardSuggestions));
      }

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
  }, [history, isTyping, businessId, addMessage]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // ── Step 3: Create store ──────────────────────────────────────────────────
  const handleCreateStore = async () => {
    if (!suggestions || !businessId) return;
    setLoading(true);
    try {
      const { firestore } = initializeFirebase();
      const configData = {
        storeSlug: suggestions.storeSlug || slugify(suggestions.storeName),
        storeName: suggestions.storeName,
        logoUrl: null,
        primaryColor: suggestions.primaryColor,
        secondaryColor: suggestions.secondaryColor,
        businessCategory: suggestions.businessCategory,
        currency: suggestions.currency || 'NGN',
        contactEmail: email,
        contactPhone: '',
        status: 'draft' as const,
        theme: suggestions.theme || 'luxe',
        tagline: suggestions.tagline,
        storePolicy: suggestions.storePolicy,
        paystackPublicKey: '',
        enabledProductTypes: ['physical'],
        pickupLocations: [],
        customDomain: null,
        customDomainStatus: 'pending' as const,
        customDomainVerifiedAt: null,
        domainPurchaseRecord: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(firestore, 'businesses', businessId, 'store', 'config'), configData);
      await setDoc(doc(firestore, 'storeIndex', configData.storeSlug), {
        businessId, storeName: suggestions.storeName, updatedAt: serverTimestamp(),
      });

      // Create collections
      const { collection, getDocs, setDoc: sd } = await import('firebase/firestore');
      const collectionsRef = collection(firestore, 'businesses', businessId, 'storeCollections');
      for (const name of (suggestions.collectionNames ?? [])) {
        const collSnap = await getDocs(collectionsRef);
        const exists = collSnap.docs.some(d => d.data().title === name);
        if (!exists) {
          await sd(doc(collectionsRef), {
            title: name, description: '', coverImageUrl: null,
            productIds: [], createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
          });
        }
      }

      posthog.capture('sell_signup_completed', { step: 3 });
      setStoreCreated(true);

      // Redirect to subscribe page after short delay
      setTimeout(() => {
        router.replace('/sell-subscribe');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to create store');
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-4" style={{
      background: `linear-gradient(135deg, ${C.bg} 0%, #E0E7FF 100%)`,
      fontFamily: FONT_BODY,
    }}>
      <div style={{ width: '100%', maxWidth: step === 3 ? 800 : 440 }}>

        {/* Step indicators */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
                background: step >= s ? `linear-gradient(135deg, ${C.primary}, ${C.accent})` : C.border,
                color: step >= s ? 'white' : C.text3,
              }}>{s}</div>
              {s < 3 && <div style={{ width: 24, height: 2, background: step > s ? C.primary : C.border, borderRadius: 1 }} />}
            </div>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            STEP 1 — Account
        ════════════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div style={{
            background: C.surface, borderRadius: 20, padding: '32px 28px',
            border: `1px solid ${C.border}`, boxShadow: '0 8px 32px rgba(14,88,140,0.08)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <img src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785078071/mosell_gpzl2q.png" alt="MO Sell" style={{ width: 48, height: 48, objectFit: 'contain', marginBottom: 12 }} />
              <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: C.text1, marginBottom: 4 }}>Create your account</h1>
              <p style={{ fontSize: 14, color: C.text2 }}>Step 1 of 3 — Account info</p>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: C.redBg, color: C.red, fontSize: 13, marginBottom: 16 }}>{error}</div>
            )}

            <form onSubmit={handleCreateAccount} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input
                type="text" placeholder="Full name" required value={fullName}
                onChange={e => setFullName(e.target.value)}
                style={{ padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 14, fontFamily: FONT_BODY, outline: 'none', background: '#F8FBFF' }}
              />
              <input
                type="email" placeholder="Email address" required value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 14, fontFamily: FONT_BODY, outline: 'none', background: '#F8FBFF' }}
              />
              <input
                type="password" placeholder="Password (min 6 characters)" required minLength={6} value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 14, fontFamily: FONT_BODY, outline: 'none', background: '#F8FBFF' }}
              />
              <button type="submit" disabled={loading} style={{
                padding: '13px', borderRadius: 10, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                background: loading ? C.text3 : `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                color: 'white', fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15,
                boxShadow: loading ? 'none' : '0 4px 16px rgba(14,165,233,0.25)',
              }}>
                {loading ? 'Creating account...' : 'Continue →'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: C.text2 }}>
              Already have an account? <a href="/sell-login" style={{ color: C.primary, fontWeight: 600, textDecoration: 'none' }}>Log in</a>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            STEP 2 — Business
        ════════════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div style={{
            background: C.surface, borderRadius: 20, padding: '32px 28px',
            border: `1px solid ${C.border}`, boxShadow: '0 8px 32px rgba(14,88,140,0.08)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: C.text1, marginBottom: 4 }}>About your business</h1>
              <p style={{ fontSize: 14, color: C.text2 }}>Step 2 of 3 — Tell us about what you sell</p>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: C.redBg, color: C.red, fontSize: 13, marginBottom: 16 }}>{error}</div>
            )}

            <form onSubmit={handleSaveBusiness} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input
                type="text" placeholder="Business name" required value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                style={{ padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 14, fontFamily: FONT_BODY, outline: 'none', background: '#F8FBFF' }}
              />
              <select
                required value={businessType}
                onChange={e => setBusinessType(e.target.value)}
                style={{
                  padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`,
                  fontSize: 14, fontFamily: FONT_BODY, outline: 'none', background: '#F8FBFF',
                  color: businessType ? C.text1 : C.text3,
                }}
              >
                <option value="">What do you sell?</option>
                <option value="physical-products">Physical Products</option>
                <option value="digital-products">Digital Products</option>
                <option value="courses">Courses & Education</option>
                <option value="services">Services & Consulting</option>
                <option value="fashion">Fashion & Beauty</option>
                <option value="food">Food & Beverage</option>
                <option value="creator">Creator / Personal Brand</option>
                <option value="other">Other</option>
              </select>
              <button type="submit" disabled={loading} style={{
                padding: '13px', borderRadius: 10, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                background: loading ? C.text3 : `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                color: 'white', fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15,
                boxShadow: loading ? 'none' : '0 4px 16px rgba(14,165,233,0.25)',
              }}>
                {loading ? 'Saving...' : 'Continue to MO →'}
              </button>
            </form>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            STEP 3 — Chat with MO
        ════════════════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div style={{
            background: C.surface, borderRadius: 20,
            border: `1px solid ${C.border}`, boxShadow: '0 8px 32px rgba(14,88,140,0.08)',
            display: 'flex', flexDirection: 'column', height: '70vh', minHeight: 400, maxHeight: 600,
            overflow: 'hidden',
          }}>
            {/* Chat header */}
            <div style={{
              padding: '14px 18px', borderBottom: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1784636144/mo_sell_chat_ucbw3x.png" alt="Mo" width={32} height={32} style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 9 }} />
              <div>
                <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 14, color: C.text1 }}>MO — Store Setup</div>
                <div style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>Step 3 of 3 — Build your store</div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messages.map(msg => (
                <div key={msg.id} style={{
                  display: 'flex', gap: 8, alignItems: 'flex-start',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                }}>
                  {msg.role === 'mo' && (
                    <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1784636144/mo_sell_chat_ucbw3x.png" alt="Mo" width={28} height={28} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                    </div>
                  )}
                  <div style={{
                    maxWidth: '75%', padding: '10px 14px', borderRadius: 14, fontSize: 13, lineHeight: 1.55,
                    ...(msg.role === 'mo'
                      ? { background: '#F8FBFF', color: C.text1, border: `1px solid ${C.border}`, borderTopLeftRadius: 4 }
                      : { background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`, color: 'white', borderTopRightRadius: 4 }
                    ),
                    whiteSpace: 'pre-wrap',
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1784636144/mo_sell_chat_ucbw3x.png" alt="Mo" width={28} height={28} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                  </div>
                  <div style={{ padding: '10px 14px', borderRadius: 14, background: '#F8FBFF', border: `1px solid ${C.border}`, display: 'flex', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.text3, animation: 'dotPulse 1.2s infinite' }} />
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.text3, animation: 'dotPulse 1.2s 0.2s infinite' }} />
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.text3, animation: 'dotPulse 1.2s 0.4s infinite' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '12px 18px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 8 }}>
              <textarea
                ref={inputRef}
                placeholder="Tell MO about your store..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={isTyping}
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`,
                  fontSize: 13, fontFamily: FONT_BODY, outline: 'none', resize: 'none',
                  background: '#F8FBFF', lineHeight: 1.5,
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isTyping}
                style={{
                  width: 40, height: 40, borderRadius: 10, border: 'none', flexShrink: 0,
                  background: (!input.trim() || isTyping) ? C.border : `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                  color: 'white', cursor: (!input.trim() || isTyping) ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>

            {/* Store created state */}
            {storeCreated && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.95)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
                borderRadius: 20,
              }}>
                <div style={{ fontSize: 48 }}>🎉</div>
                <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 20, color: C.text1 }}>Your store is ready!</div>
                <p style={{ fontSize: 14, color: C.text2 }}>Redirecting you to complete setup...</p>
              </div>
            )}

            {/* Create store button */}
            {suggestions && !storeCreated && (
              <div style={{ padding: '12px 18px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleCreateStore}
                  disabled={loading}
                  style={{
                    padding: '10px 20px', borderRadius: 10, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                    background: loading ? C.text3 : C.green,
                    color: 'white', fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 13,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {loading ? 'Creating...' : 'Create my store'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: C.text3 }}>
          © {new Date().getFullYear()} Busmo · MO Sell
        </div>
      </div>

      <style>{`
        @keyframes dotPulse {
          0%, 100% { opacity: 0.4; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
