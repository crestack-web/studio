'use client';

import { getSupabase } from '@/lib/supabase';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp, Sparkles, Zap, BedDouble, Stethoscope, Briefcase, GraduationCap } from 'lucide-react';
import { useToast } from './primitives';
import { Icon } from './icons';
import { MoIcon } from './MoIcon';
import type { SolutionsSuiteId } from './types';

export type AIMessage = {
  id: string;
  role: 'user' | 'mo';
  text: string;
  actions?: string[];
};

export type AIContext = {
  studentName?: string;
  patientName?: string;
};

export type AIReply = {
  text: string;
  actions?: string[];
};

export function moReply(suiteId: SolutionsSuiteId, prompt: string, context?: AIContext): AIReply {
  const q = prompt.toLowerCase();

  if (suiteId === 'education') {
    if (q.includes('timetable')) {
      return {
        text: `I reviewed the current timetable. I can draft a full first-term timetable for your school in one pass — grouping JSS classes into 45-minute periods, reserving labs for sciences and the library for literature.`,
        actions: ['Create timetable', 'Assign topics', 'Swap a lesson'],
      };
    }
    if (q.includes('topic') || q.includes('subject') || q.includes('teach')) {
      return {
        text: `I can assign teaching topics to the faculty. Tell me the subject and class and I will assign the topic and supporting resources.`,
        actions: ['Assign topic', 'Create lesson plan'],
      };
    }
    if (q.includes('attendance') || q.includes('absent') || q.includes('late')) {
      return {
        text: `Attendance across your school is averaging 92% this term. JSS 3B is the weakest cohort at 89% — a guardian follow-up was booked.`,
        actions: ['Draft attendance notes', 'Escalate guardian follow-up'],
      };
    }
    if (q.includes('fee') || q.includes('payment') || q.includes('finance') || q.includes('balance')) {
      return {
        text: `The fee pipeline shows outstanding balances across the roll, with invoices overdue. I can draft reminders and open the fee register.`,
        actions: ['Draft fee reminder', 'Open fee register'],
      };
    }
    return {
      text: `Here is your live education brief — attendance, fees, enrollment and teacher workload are tracked. Ask me about timetables, topics, attendance, fees or admissions.`,
      actions: ['Create timetable', 'Assign topics', 'Draft fee reminder'],
    };
  }

  if (suiteId === 'healthcare') {
    if (q.includes('patient') || q.includes('condition') || q.includes('diagnosis') || q.includes('clinical')) {
      return {
        text: context?.patientName
          ? `I have opened the clinical context for ${context.patientName}. Combined with the current vitals and history this supports a monitored chronic-care plan with weekly follow-up.`
          : `I can summarise any patient's condition. Open a patient record and I will build a clinical summary — history, vitals, chronic flags and recommended next steps.`,
        actions: ['Summarise patient', 'Draft care-team note'],
      };
    }
    if (q.includes('referral')) {
      return {
        text: `I drafted a referral for the clinic queue. The attending physician should review before the next slot.`,
        actions: ['Send referral', 'Book follow-up'],
      };
    }
    if (q.includes('triage') || q.includes('queue') || q.includes('wait')) {
      return {
        text: `The clinical queue is holding. I recommend adjusting the schedule and notifying affected clinics.`,
        actions: ['Reschedule consult', 'Notify clinics'],
      };
    }
    return {
      text: `Here is the live clinical picture — queue, vitals, chronic conditions and referrals are tracked. Ask me about a patient, referrals, triage or medications.`,
      actions: ['Summarise patient', 'Draft referral'],
    };
  }

  if (suiteId === 'professional') {
    if (q.includes('project') || q.includes('deliver')) {
      return {
        text: `Several projects are at risk this week. I can re-plan delivery: shift milestones, reallocate hours and draft revised invoices from unbilled time.`,
        actions: ['Replan project', 'Draft revised invoice'],
      };
    }
    if (q.includes('invoice') || q.includes('billing') || q.includes('cash')) {
      return {
        text: `There is unbilled work ready to invoice. I can draft the retainer invoice and queue overdue payment chases.`,
        actions: ['Draft invoice', 'Chase overdue'],
      };
    }
    return {
      text: `Here is the live delivery picture — active projects, open tasks and amounts awaiting collection. Ask me about projects, delivery or billing.`,
      actions: ['Replan project', 'Draft invoice'],
    };
  }

  if (suiteId === 'hospitality') {
    if (q.includes('occupanc') || q.includes('arrival') || q.includes('room') || q.includes('attention')) {
      return {
        text: `Occupancy is at 65% with 6 arrivals today. Rooms 305 and 412 need cleaning before inspection. I can re-sequence housekeeping and prep the arrivals kit.`,
        actions: ['Reprioritise housekeeping', 'Prep arrivals'],
      };
    }
    if (q.includes('housekeep')) {
      return {
        text: `Housekeeping has 7 open rooms. I prioritised 305 and 412 for arrivals, then VIP suites. Staff can clear the queue by 14:30 if we hold non-urgent turndowns.`,
        actions: ['Reprioritise housekeeping', 'Notify team'],
      };
    }
    if (q.includes('revenue') || q.includes('cash')) {
      return {
        text: `Today's revenue pulse: rooms on track, F&B slightly behind. Two group invoices are pending — I can draft follow-ups.`,
        actions: ['Draft invoice follow-up', 'Open revenue'],
      };
    }
    return {
      text: `Here is the live hospitality brief — occupancy, arrivals and housekeeping are tracked in real time.`,
      actions: ['Reprioritise housekeeping', 'Prep arrivals'],
    };
  }

  return { text: 'MO is online. Ask me for insights, schedules, clinical context, delivery plans or finance follow-ups.' };
}

const META: Record<SolutionsSuiteId, { label: string; tagline: string; caps: string[]; greet: string }> = {
  hospitality: {
    label: 'Hospitality',
    tagline: 'Rooms · Housekeeping · Guests · Revenue',
    caps: ["Today's priorities", 'Housekeeping', 'Arrivals', 'Room service', 'Revenue'],
    greet:
      "I'm MO — your AI chief of staff for this hotel. I watch occupancy, housekeeping, arrivals, room service and cash so you can act in seconds.",
  },
  healthcare: {
    label: 'Healthcare',
    tagline: 'Patients · Triage · Visits · Follow-ups',
    caps: ['Triage', 'Patient brief', 'Referrals', 'Follow-ups', 'Clinic load'],
    greet:
      "I'm MO — your AI chief of staff for this clinic. I summarise patients, triage the queue, draft referrals and flag what needs attention.",
  },
  professional: {
    label: 'Professional',
    tagline: 'Clients · Engagements · Billing · Team',
    caps: ['At-risk work', 'Unbilled hours', 'Delivery', 'Clients', 'Cash'],
    greet:
      "I'm MO — your AI chief of staff for this firm. I surface at-risk work, unbilled hours, delivery risks and client follow-ups.",
  },
  education: {
    label: 'Education',
    tagline: 'Classes · Attendance · Fees · Staff',
    caps: ['Timetable', 'Topics', 'Attendance', 'Fees', 'Staff load'],
    greet:
      "I'm MO — your AI chief of staff for this school. I draft timetables, assign topics, track attendance and chase fee follow-ups.",
  },
};

const QUICK: Record<SolutionsSuiteId, { label: string; prompt: string }[]> = {
  hospitality: [
    { label: 'What needs attention?', prompt: 'What needs attention today?' },
    { label: 'Housekeeping', prompt: 'Reprioritise housekeeping' },
    { label: 'Prep arrivals', prompt: 'Prep arrivals' },
    { label: 'Revenue pulse', prompt: 'Give me a revenue pulse for today' },
  ],
  healthcare: [
    { label: 'Patient brief', prompt: 'Summarise patient condition' },
    { label: 'Draft referral', prompt: 'Draft referral' },
    { label: 'Triage queue', prompt: 'Triage the queue' },
  ],
  professional: [
    { label: 'At risk this week', prompt: 'What is at risk this week?' },
    { label: 'Unbilled hours', prompt: 'Draft invoice from unbilled hours' },
    { label: 'Replan delivery', prompt: 'Replan delivery' },
  ],
  education: [
    { label: 'Create timetable', prompt: 'Create timetable' },
    { label: 'Assign topics', prompt: 'Assign topics' },
    { label: 'Attendance', prompt: 'Attendance insights' },
    { label: 'Fee follow-ups', prompt: 'Fee follow-ups' },
  ],
};

function Glyph({ id }: { id: SolutionsSuiteId }) {
  const p = { size: 14, strokeWidth: 2.2 } as const;
  if (id === 'hospitality') return <BedDouble {...p} />;
  if (id === 'healthcare') return <Stethoscope {...p} />;
  if (id === 'professional') return <Briefcase {...p} />;
  return <GraduationCap {...p} />;
}

export function AIDrawer({
  open,
  onClose,
  suiteId,
  context,
}: {
  open: boolean;
  onClose: () => void;
  suiteId: SolutionsSuiteId;
  context?: AIContext;
}) {
  void onClose;
  const { toast } = useToast();
  const meta = META[suiteId];
  const [messages, setMessages] = useState<AIMessage[]>([
    { id: 'mo-greet', role: 'mo', text: meta.greet },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setMessages([{ id: 'mo-greet', role: 'mo', text: META[suiteId].greet }]);
      setInput('');
      window.setTimeout(() => inputRef.current?.focus(), 180);
    }
  }, [open, suiteId]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, busy]);

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || busy) return;
    setBusy(true);
    setInput('');
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', text }]);
    try {
      const { data: sess } = await getSupabase().auth.getSession();
      const token = sess.session?.access_token;
      const res = await fetch('/api/industries/mo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: text,
          industry: suiteId,
          productEdition: suiteId,
          patientContext: context?.patientName
            ? { name: context.patientName, mrn: context.patientId }
            : undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      const replyText =
        (typeof json.reply === 'string' && json.reply.trim()) ||
        (typeof json.error === 'string' && json.error) ||
        moReply(suiteId, text, context).text;
      setMessages((prev) => [
        ...prev,
        { id: `m-${Date.now()}`, role: 'mo', text: replyText },
      ]);
    } catch {
      const fallback = moReply(suiteId, text, context);
      setMessages((prev) => [
        ...prev,
        { id: `m-${Date.now()}`, role: 'mo', text: fallback.text, actions: fallback.actions },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const onlyGreet = messages.length === 1 && messages[0].id === 'mo-greet';
  const quick = useMemo(() => QUICK[suiteId] || [], [suiteId]);

  return (
    <div className="mo-root">
      <div className="mo-hero">
        <div className="mo-hero-avatar">
          <MoIcon size={20} />
        </div>
        <div>
          <div className="mo-hero-title">
            <span>MO</span>
            <span className="mo-pill">
              <Zap size={11} aria-hidden /> Live
            </span>
          </div>
          <p className="mo-hero-sub">AI chief of staff · {meta.label}</p>
          <p className="mo-hero-tag">{meta.tagline}</p>
        </div>
      </div>

      {onlyGreet ? (
        <div className="mo-caps">
          {meta.caps.map((c) => (
            <span key={c} className="mo-cap">
              <Glyph id={suiteId} />
              {c}
            </span>
          ))}
        </div>
      ) : null}

      <div ref={listRef} className="mo-thread">
        {messages.map((m) => (
          <div key={m.id} className={`mo-row ${m.role}`}>
            <span className={`mo-avatar${m.role === 'user' ? ' user' : ''}`}>
              {m.role === 'mo' ? <MoIcon size={11} /> : <Icon name="user" size={14} />}
            </span>
            <div className="mo-col">
              <div className="mo-bubble">{m.text}</div>
              {m.actions?.length ? (
                <div className="mo-actions">
                  {m.actions.map((a) => (
                    <button
                      key={a}
                      type="button"
                      className="mo-action"
                      onClick={() => toast(`${a} — wiring to the action queue next.`)}
                    >
                      <Sparkles size={12} aria-hidden />
                      {a}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ))}
        {busy ? (
          <div className="mo-row mo">
            <span className="mo-avatar">
              <MoIcon size={11} />
            </span>
            <div className="mo-bubble thinking">
              <span className="mo-dot" />
              <span className="mo-dot" />
              <span className="mo-dot" />
            </div>
          </div>
        ) : null}
      </div>

      <div className="mo-quick">
        {quick.map((q) => (
          <button
            key={q.prompt}
            type="button"
            className="mo-quick-btn"
            onClick={() => send(q.prompt)}
            disabled={busy}
          >
            <Sparkles size={12} aria-hidden />
            {q.label}
          </button>
        ))}
      </div>

      <form
        className="mo-composer"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          ref={inputRef}
          className="mo-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask MO anything…"
          aria-label="Ask MO"
          disabled={busy}
        />
        <button type="submit" className="mo-send" aria-label="Send" disabled={busy || !input.trim()}>
          <ArrowUp size={16} strokeWidth={2.6} aria-hidden />
        </button>
      </form>

      <style>{`
        .mo-root{display:flex;flex-direction:column;gap:14px;min-height:min(70vh,640px)}
        .mo-hero{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:14px;background:var(--sol-surface-2);border:none;box-shadow:none}
        .mo-hero-avatar{flex-shrink:0;width:48px;height:48px;border-radius:14px;display:grid;place-items:center;background:#0b1220;border:none;box-shadow:none}
        .mo-hero-title{display:flex;align-items:center;gap:8px;font-size:18px;font-weight:800;letter-spacing:-.03em;color:var(--sol-text)}
        .mo-pill{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:999px;background:var(--sol-accent-soft);color:var(--sol-accent);border:1px solid var(--sol-accent-border);font-size:10px;font-weight:800;letter-spacing:.04em;text-transform:uppercase}
        .mo-hero-sub{margin:3px 0 0;font-size:12.5px;font-weight:700;color:var(--sol-text-2)}
        .mo-hero-tag{margin:4px 0 0;font-size:11.5px;color:var(--sol-text-3);line-height:1.4}
        .mo-caps{display:flex;flex-wrap:wrap;gap:6px}
        .mo-cap{display:inline-flex;align-items:center;gap:6px;padding:7px 10px;border-radius:999px;background:var(--sol-surface);border:1px solid var(--sol-border);color:var(--sol-text-2);font-size:11.5px;font-weight:700}
        .mo-cap svg{color:var(--sol-accent)}
        .mo-thread{flex:1;min-height:160px;max-height:42vh;overflow-y:auto;display:flex;flex-direction:column;gap:12px}
        .mo-row{display:flex;gap:10px;align-items:flex-start}
        .mo-row.user{flex-direction:row-reverse}
        .mo-avatar{width:30px;height:30px;border-radius:10px;display:grid;place-items:center;flex:none;background:#0b1220;border:1px solid rgba(255,255,255,.06)}
        .mo-avatar.user{background:var(--sol-accent-soft);color:var(--sol-accent);border-color:var(--sol-accent-border)}
        .mo-col{min-width:0;max-width:92%}
        .mo-bubble{background:var(--sol-surface);border:1px solid var(--sol-border);border-radius:14px;padding:11px 13px;font-size:13px;line-height:1.55;color:var(--sol-text);box-shadow:var(--sol-shadow-xs)}
        .mo-row.user .mo-bubble{background:var(--sol-accent);border-color:var(--sol-accent);color:var(--sol-accent-contrast)}
        .mo-bubble.thinking{display:inline-flex;align-items:center;gap:5px;padding:12px 14px}
        .mo-dot{width:6px;height:6px;border-radius:999px;background:var(--sol-text-3);animation:mo-bounce 1s infinite ease-in-out}
        .mo-dot:nth-child(2){animation-delay:.15s}
        .mo-dot:nth-child(3){animation-delay:.3s}
        @keyframes mo-bounce{0%,80%,100%{transform:translateY(0);opacity:.45}40%{transform:translateY(-4px);opacity:1}}
        .mo-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
        .mo-action{display:inline-flex;align-items:center;gap:5px;padding:7px 10px;border-radius:999px;border:1px solid var(--sol-accent-border);background:var(--sol-accent-soft);color:var(--sol-accent);font:inherit;font-size:11.5px;font-weight:700;cursor:pointer}
        .mo-quick{display:flex;flex-wrap:wrap;gap:6px}
        .mo-quick-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 11px;border-radius:999px;border:1px solid var(--sol-border);background:var(--sol-surface);color:var(--sol-text-2);font:inherit;font-size:12px;font-weight:700;cursor:pointer}
        .mo-quick-btn:hover:not(:disabled){border-color:var(--sol-accent-border);color:var(--sol-accent);background:var(--sol-accent-soft)}
        .mo-quick-btn:disabled{opacity:.55;cursor:not-allowed}
        .mo-composer{display:flex;align-items:center;gap:8px;padding:6px 4px 6px 8px;border-radius:16px;background:var(--sol-surface-2);border:none;box-shadow:none}
        .mo-input{flex:1;min-width:0;height:40px;padding:0 12px;border:none!important;background:transparent;color:var(--sol-text);font:inherit;font-size:14px;outline:none!important;box-shadow:none!important;-webkit-appearance:none}
        .mo-input::placeholder{color:var(--sol-text-3)}
        .mo-input:focus,.mo-input:focus-visible{outline:none!important;border:none!important;box-shadow:none!important}
        .mo-composer:focus-within{outline:none;box-shadow:none;border:none}
        .mo-send{width:40px;height:40px;border-radius:12px;border:none;display:grid;place-items:center;background:var(--sol-accent);color:var(--sol-accent-contrast);cursor:pointer;flex-shrink:0}
        .mo-send:disabled{opacity:.45;cursor:not-allowed}
      `}</style>
    </div>
  );
}
