'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Send, Sparkles, X } from 'lucide-react';
import { Sheet, useToast } from './primitives';
import { Icon } from './icons';
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
  const who = context?.studentName || context?.patientName;

  if (suiteId === 'education') {
    if (q.includes('timetable') || q.includes('timetable')) {
      return {
        text: `I reviewed the current timetable. I can draft a full first-term timetable for Crescent Academy in one pass — grouping JSS classes into 45-minute periods, reserving labs for sciences and the library for literature.`,
        actions: ['Create timetable', 'Assign topics', 'Swap a lesson'],
      };
    }
    if (q.includes('topic') || q.includes('subject') || q.includes('teach')) {
      return {
        text: `I can assign teaching topics to the faculty. For example I mapped photosynthesis to Mr. Kola Bankole (SS 1 Science) and literary analysis to Mrs. Ify Okafor (SS 2 Arts). Tell me the subject and class and I will assign the topic and supporting resources.`,
        actions: ['Assign topic', 'Create lesson plan'],
      };
    }
    if (q.includes('attendance') || q.includes('absent') || q.includes('late')) {
      const avg = 92;
      return {
        text: `Attendance across Crescent Academy is averaging ${avg}% this term. JSS 3B is the weakest cohort at 89%, and Samuel Adeyinka (Primary 6) accounts for repeated absences — a guardian follow-up was booked.`,
        actions: ['Draft attendance notes', 'Escalate guardian follow-up'],
      };
    }
    if (q.includes('fee') || q.includes('payment') || q.includes('finance') || q.includes('balance')) {
      return {
        text: `The fee pipeline shows ₦${Math.round(1_840_000).toLocaleString()} outstanding across the roll, with 2 invoices overdue. Collection is at ${Math.round(
          (1_540_000 / Math.max(1, 1_840_000)) * 100,
        )}% of billed tuition.`,
        actions: ['Draft fee reminder', 'Open fee register'],
      };
    }
    if (q.includes('enroll') || q.includes('admission') || q.includes('application')) {
      return {
        text: `There are ${14} open applications in the admissions pipeline, with 2 offers outstanding. Zara Bello’s enrolment into SS 1 Science is confirmed and funded.`,
        actions: ['Draft offer letter', 'Review applications'],
      };
    }
    if (q.includes('report') || q.includes('insight')) {
      return {
        text: `I have prepared the weekly education digest: attendance trending up, fees 4% behind target, and 2 enrollment offers awaiting signatures.`,
        actions: ['Schedule report', 'Email digest'],
      };
    }
    return {
      text: `Here is your live education brief for Crescent Academy — attendance, fees, enrollment and teacher workload are all tracked. Ask me about timetables, topics, attendance, fees or admissions.`,
      actions: ['Create timetable', 'Assign topics', 'Draft fee reminder'],
    };
  }

  if (suiteId === 'healthcare') {
    if (q.includes('patient') || q.includes('condition') || q.includes('diagnosis') || q.includes('clinical')) {
      return {
        text: context?.patientName
          ? `I have opened the clinical context for ${context.patientName}. Combined with the current vitals and history this supports a monitored chronic-care plan with weekly follow-up. I recommend flagging the care team and logging the encounter as a chronic-care touchpoint.`
          : `I can summarise any patient’s condition. Open a patient record and I will build a clinical summary — history, vitals, chronic flags and recommended next steps — then draft the care-team note.`,
        actions: ['Summarise patient', 'Draft care-team note', 'Log chronic-care touchpoint'],
      };
    }
    if (q.includes('referral')) {
      return {
        text: `I drafted a cardiology referral for the Lagos clinic queue: stable chest pain, troponin within limits, echo scheduled, GP follow-up in 2 weeks. The attending physician should review before the 15:30 slot.`,
        actions: ['Send referral', 'Book echo'],
      };
    }
    if (q.includes('triage') || q.includes('queue') || q.includes('wait')) {
      return {
        text: `The clinical queue is holding at 12 patients. Cardiology is running ~22 minutes behind — I recommend moving Dr. Lawal’s 15:30 virtual consult earlier and notifying the neurology clinic of the overlap.`,
        actions: ['Reschedule consult', 'Notify clinics'],
      };
    }
    if (q.includes('medication') || q.includes('prescribe') || q.includes('rx')) {
      return {
        text: `Medication changes should always route through the attending clinician. I drafted the follow-up medication list for the chronic-care cohort; the physician must sign off before it is applied.`,
        actions: ['Draft medication list', 'Escalate to physician'],
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
        text: `Three Northwind Studio projects are at risk this week. I can re-plan delivery: shift design milestones, reallocate engineering hours and draft revised invoices from unbilled time.`,
        actions: ['Replan project', 'Draft revised invoice'],
      };
    }
    if (q.includes('invoice') || q.includes('billing') || q.includes('cash')) {
      return {
        text: `Northwind has ₦7.9M ready to invoice from unbilled hours. I can draft the retainer invoice and queue the overdue payment chase.`,
        actions: ['Draft invoice', 'Chase overdue'],
      };
    }
    return {
      text: `Here is the live delivery picture — 6 active projects, 15 open tasks and ₦7.9M awaiting collection. Ask me about projects, delivery or billing.`,
      actions: ['Replan project', 'Draft invoice'],
    };
  }

  if (suiteId === 'hospitality') {
    if (q.includes('occupanc') || q.includes('arrival') || q.includes('room')) {
      return {
        text: `Occupancy is at 65% with 6 arrivals today. Rooms 305 and 412 need cleaning before inspection. I can re-sequence housekeeping and prep the arrivals kit.`,
        actions: ['Reprioritise housekeeping', 'Prep arrivals'],
      };
    }
    return {
      text: `Here is the live hospitality brief — occupancy, arrivals and housekeeping are tracked in real time.`,
      actions: ['Reprioritise housekeeping'],
    };
  }

  return { text: 'MO is online across all suites. Ask me for insights, schedules, clinical context, delivery plans or finance follow-ups.' };
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
  const { toast } = useToast();
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'mo-greet',
      role: 'mo',
      text: `I’m MO, the AI chief of staff for this ${suiteId} workspace. I can draft timetables, assign teaching topics, summarise clinical context, replan delivery and surface finance follow-ups.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setMessages([
        {
          id: 'mo-greet',
          role: 'mo',
          text: `I’m MO, the AI chief of staff for this ${suiteId} workspace. I can draft timetables, assign teaching topics, summarise clinical context, replan delivery and surface finance follow-ups.`,
        },
      ]);
      setInput('');
    }
  }, [open, suiteId]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const send = (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || busy) return;
    setBusy(true);
    setInput('');
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', text }]);
    const reply = moReply(suiteId, text, context);
    window.setTimeout(() => {
      setMessages((prev) => [...prev, { id: `m-${Date.now()}`, role: 'mo', text: reply.text, actions: reply.actions }]);
      setBusy(false);
      for (const action of reply.actions || []) {
        // Demo actions: surface them as toasts until the action APIs land.
        void action;
      }
    }, 550);
  };

  const quickPrompts: Record<SolutionsSuiteId, string[]> = {
    hospitality: ['What needs attention today?', 'Reprioritise housekeeping', 'Prep arrivals'],
    healthcare: ['Summarise patient condition', 'Draft referral', 'Triage the queue'],
    professional: ['What is at risk this week?', 'Draft invoice from unbilled hours', 'Replan delivery'],
    education: ['Create timetable', 'Assign topics', 'Attendance insights', 'Fee follow-ups'],
  };

  return (
    <>
      <div ref={listRef} className="sol-ai-list">
        {messages.map((m) => (
          <div key={m.id} className={`sol-ai-msg ${m.role}`}>
            <span className="sol-ai-avatar">{m.role === 'mo' ? <Icon name="mo" size={14} /> : <Icon name="user" size={14} />}</span>
            <div>
              <div className="sol-ai-bubble">{m.text}</div>
              {m.actions && m.actions.length ? (
                <div className="sol-ai-actions">
                  {m.actions.map((a) => (
                    <button
                      key={a}
                      type="button"
                      className="sol-chip"
                      onClick={() => {
                        toast(`${a} — coming online with the AI action queue.`);
                      }}
                    >
                      <Sparkles size={12} aria-hidden /> {a}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ))}
        {busy ? (
          <div className="sol-ai-msg mo">
            <span className="sol-ai-avatar">
              <Icon name="mo" size={14} />
            </span>
            <div className="sol-ai-bubble">MO is thinking…</div>
          </div>
        ) : null}
      </div>

      <div className="sol-ai-quick">
        {(quickPrompts[suiteId] || []).map((p) => (
          <button key={p} type="button" className="sol-chip" onClick={() => send(p)}>
            <Sparkles size={12} aria-hidden /> {p}
          </button>
        ))}
      </div>

      <form
        className="sol-ai-composer"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          className="sol-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask MO anything…"
          aria-label="Ask MO"
        />
        <button type="submit" className="sol-btn sol-btn-primary sol-btn-sm" aria-label="Send to MO">
          <Send size={14} aria-hidden />
        </button>
      </form>
      <style>{`
        .sol-ai-list { display: flex; flex-direction: column; gap: 12px; }
        .sol-ai-msg { display: flex; gap: 10px; align-items: flex-start; }
        .sol-ai-msg.user { flex-direction: row-reverse; }
        .sol-ai-avatar { width: 26px; height: 26px; border-radius: 8px; background: var(--sol-accent-soft); color: var(--sol-accent); display: inline-flex; align-items: center; justify-content: center; flex: none; }
        .sol-ai-bubble { background: var(--sol-surface-2); border: 1px solid var(--sol-border); border-radius: 12px; padding: 10px 12px; font-size: 12.5px; line-height: 1.55; max-width: 100%; }
        .sol-ai-msg.user .sol-ai-bubble { background: var(--sol-accent-soft); border-color: var(--sol-accent-border); }
        .sol-ai-actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
        .sol-ai-quick { display: flex; flex-wrap: wrap; gap: 6px; }
        .sol-ai-composer { display: flex; gap: 8px; align-items: center; }
      `}</style>
    </>
  );
}
