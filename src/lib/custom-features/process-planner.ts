/**
 * Business process planner — conversation / NL → BusinessProcessPlan.
 * Reasons about actors, events, calculations, and questions before fields.
 */

import type {
  BusinessProcessPlan,
  ProcessCalculation,
  ProcessFieldHint,
  ProcessPlanResult,
} from './business-process-types';
import { matchBusinessPatterns } from './business-patterns';

const UNSUPPORTED =
  /\b(javascript|typescript|sql|react component|execute code|arbitrary code|eval\(|webhook handler|custom css|deploy to production)\b/i;

function emptyPlan(): BusinessProcessPlan {
  return {
    businessContext: '',
    goal: '',
    actors: [],
    entities: [],
    events: [],
    relationships: [],
    calculations: [],
    statuses: [],
    businessQuestions: [],
    suggestedViews: [],
    suggestedActions: [],
    missingInformation: [],
    assumptions: [],
    confidence: 0.4,
    suggestedName: 'Business Tracker',
    summary: 'Track key records for your business.',
  };
}

function mergePlans(base: BusinessProcessPlan, extra: Partial<BusinessProcessPlan>): BusinessProcessPlan {
  return {
    ...base,
    ...extra,
    actors: extra.actors?.length ? extra.actors : base.actors,
    entities: extra.entities?.length ? extra.entities : base.entities,
    events: extra.events?.length ? extra.events : base.events,
    relationships: extra.relationships?.length ? extra.relationships : base.relationships,
    calculations: extra.calculations?.length ? extra.calculations : base.calculations,
    statuses: extra.statuses?.length ? extra.statuses : base.statuses,
    businessQuestions: extra.businessQuestions?.length
      ? extra.businessQuestions
      : base.businessQuestions,
    suggestedViews: extra.suggestedViews?.length ? extra.suggestedViews : base.suggestedViews,
    suggestedActions: extra.suggestedActions?.length
      ? extra.suggestedActions
      : base.suggestedActions,
    missingInformation: extra.missingInformation ?? base.missingInformation,
    assumptions: [
      ...new Set([...(base.assumptions || []), ...(extra.assumptions || [])]),
    ],
    confidence: Math.max(base.confidence, extra.confidence ?? 0),
    suggestedName: extra.suggestedName || base.suggestedName,
    summary: extra.summary || base.summary,
    patternId: extra.patternId || base.patternId,
    businessContext: extra.businessContext || base.businessContext,
    goal: extra.goal || base.goal,
  };
}

/** Collapse multi-turn builder conversation into one working text + prior plan. */
export function combineConversationContext(
  message: string,
  thread?: Array<{ role: string; text: string }>
): string {
  const latest = String(message || '').trim();
  if (!thread?.length) return latest;
  const prior = thread
    .map((m) => `${m.role === 'user' || m.role === 'Owner' ? 'Owner' : 'MO'}: ${m.text}`)
    .join('\n');
  if (!latest) return prior;
  if (prior.includes(latest)) return prior;
  return `${prior}\nOwner: ${latest}`;
}

function extractPricePerKg(text: string): number | null {
  const m =
    text.match(/(?:₦|ngn|naira)?\s*(\d+(?:[.,]\d+)?)\s*(?:\/|per)\s*kg/i) ||
    text.match(/(\d+(?:[.,]\d+)?)\s*(?:naira|₦)?\s*(?:per|\/)\s*kg/i);
  if (!m) return null;
  return Number(String(m[1]).replace(',', ''));
}

function wantsPaymentTracking(text: string): boolean {
  return /\b(pay|paid|payment|owe|owing|balance|outstanding|credit)\b/i.test(text);
}

function isVagueRequest(text: string): boolean {
  const t = text.toLowerCase().trim();
  if (t.length < 12) return true;
  if (
    /^(build|create|make|i need|help me)\s+(something|a tool|a system|an app)?\s*(for\s+(my\s+)?)?(business|shop)?\.?$/i.test(
      t
    )
  )
    return true;
  if (
    /\b(my\s+)?(roofing|recycling|restaurant|pharmacy|laundry|repair)\s+business\b/i.test(t) &&
    !/\b(track|record|manage|pay|customer|supplier|job|delivery|kg|order)\b/i.test(t)
  ) {
    return true;
  }
  return false;
}

function vagueClarification(text: string): string {
  if (/roof/i.test(text)) {
    return 'What do you mainly want to track: customer jobs, materials and costs, payments, workers, or a mix?';
  }
  if (/recycl|pet|bottle/i.test(text)) {
    return 'When people bring materials, what do you need to record — supplier name, weight (kg), price per kg, and whether you have paid them?';
  }
  if (/restaurant|cafe|food/i.test(text)) {
    return 'What matters most right now: menu costs, ingredient stock, daily sales, or waste?';
  }
  if (/pharmacy|drug/i.test(text)) {
    return 'Do you mainly need expiry tracking, supplier purchases, or credit sales to customers?';
  }
  return 'What do you mainly want to track: customers, suppliers, jobs, payments, deliveries, or stock? (You can say more than one.)';
}

function ensureDefaultViews(plan: BusinessProcessPlan): BusinessProcessPlan {
  if (plan.suggestedViews.length) return plan;
  return {
    ...plan,
    suggestedViews: [
      {
        key: 'overview',
        title: 'Overview',
        type: 'metrics',
        answersQuestion: 'How is this area of the business doing?',
      },
      {
        key: 'list',
        title: 'Records',
        type: 'table',
        answersQuestion: 'What was recorded recently?',
      },
      {
        key: 'add',
        title: 'Add record',
        type: 'form',
        answersQuestion: 'Log a new entry',
      },
    ],
  };
}

function applyLanguageAdjustments(plan: BusinessProcessPlan, text: string): BusinessProcessPlan {
  let next = { ...plan, assumptions: [...plan.assumptions] };
  const price = extractPricePerKg(text);
  if (price != null && next.events[0]) {
    const fields = [...(next.events[0].fieldHints || [])];
    const hasPrice = fields.some((f) => f.key === 'price_per_kg');
    if (!hasPrice) {
      fields.splice(3, 0, {
        key: 'price_per_kg',
        label: 'Price per kg',
        type: 'currency',
        required: true,
      } as ProcessFieldHint);
    }
    next.events = [{ ...next.events[0], fieldHints: fields }];
    if (!next.calculations.some((c) => c.outputField === 'total_amount')) {
      next.calculations = [
        ...next.calculations,
        {
          key: 'total',
          label: 'Total payment',
          formula: 'quantity_kg × price_per_kg',
          inputFields: ['quantity_kg', 'price_per_kg'],
          outputField: 'total_amount',
          confidence: 'high',
        } as ProcessCalculation,
      ];
    }
    next.assumptions.push(
      `Price per kg is about ₦${price.toLocaleString()} when stated by the owner.`
    );
  }

  if (wantsPaymentTracking(text) && next.events[0]) {
    const fields = [...(next.events[0].fieldHints || [])];
    const ensure = (hint: ProcessFieldHint) => {
      if (!fields.some((f) => f.key === hint.key)) fields.push(hint);
    };
    ensure({ key: 'amount_paid', label: 'Amount paid', type: 'currency' });
    ensure({ key: 'balance', label: 'Balance', type: 'currency' });
    ensure({
      key: 'payment_status',
      label: 'Payment status',
      type: 'status',
      options: ['Unpaid', 'Partial', 'Paid'],
    });
    next.events = [{ ...next.events[0], fieldHints: fields }];
    if (!next.calculations.some((c) => c.outputField === 'balance')) {
      next.calculations = [
        ...next.calculations,
        {
          key: 'balance',
          label: 'Balance',
          formula: 'total_or_agreed − amount_paid',
          inputFields: ['amount_paid'],
          outputField: 'balance',
          confidence: 'medium',
        },
      ];
    }
  }

  if (/\bworker|staff|employee|technician\b/i.test(text) && next.events[0]) {
    const fields = [...(next.events[0].fieldHints || [])];
    if (!fields.some((f) => /worker|staff|handled/.test(f.key))) {
      fields.push({ key: 'worker_name', label: 'Worker', type: 'text' });
      next.events = [{ ...next.events[0], fieldHints: fields }];
      if (!next.actors.some((a) => a.role === 'worker' || a.role === 'employee')) {
        next.actors = [...next.actors, { key: 'worker', role: 'worker', label: 'Worker' }];
      }
    }
  }

  return ensureDefaultViews(next);
}

function genericTrackerFromText(text: string): BusinessProcessPlan {
  const plan = emptyPlan();
  plan.businessContext = 'General business tracking';
  plan.goal = 'Track the records the owner described';
  plan.suggestedName = 'Business Tracker';
  plan.summary = 'A simple tracker based on what you described.';
  plan.confidence = 0.45;
  plan.events = [
    {
      key: 'record',
      label: 'Record',
      kind: 'other',
      primary: true,
      relatedEntityKeys: [],
      fieldHints: [
        { key: 'name', label: 'Name / title', type: 'text', required: true },
        { key: 'details', label: 'Details', type: 'textarea' },
        { key: 'amount', label: 'Amount', type: 'currency' },
        {
          key: 'status',
          label: 'Status',
          type: 'status',
          options: ['Open', 'In progress', 'Done'],
        },
        { key: 'date', label: 'Date', type: 'date', required: true },
        { key: 'notes', label: 'Notes', type: 'textarea' },
      ],
    },
  ];
  plan.businessQuestions = [
    'What was recorded recently?',
    'What is still open?',
    'What totals do I have?',
  ];
  plan.suggestedActions = [
    { key: 'create', label: 'Add record', type: 'create' },
    { key: 'update', label: 'Update', type: 'update' },
    { key: 'delete', label: 'Remove', type: 'delete' },
  ];
  plan.missingInformation = [
    'More detail on who is involved and what happens in a typical transaction would improve this tool.',
  ];
  return ensureDefaultViews(plan);
}

/**
 * Build a BusinessProcessPlan from owner language (and optional prior plan).
 */
export function planBusinessProcess(
  userMessage: string,
  opts?: {
    priorPlan?: BusinessProcessPlan | null;
    /** When true, vague asks return clarification instead of a thin plan. */
    preferClarification?: boolean;
  }
): ProcessPlanResult {
  const text = String(userMessage || '').trim();
  if (!text) {
    return {
      kind: 'clarification',
      question:
        'Tell me how you currently handle this part of the business — who is involved and what happens step by step.',
    };
  }

  if (UNSUPPORTED.test(text)) {
    return {
      kind: 'unsupported',
      message:
        'Busmo can build declarative trackers (records, statuses, payments) — not custom code, SQL, or production deploys. Describe the process you want to track.',
    };
  }

  const preferClarify = opts?.preferClarification !== false;
  if (preferClarify && isVagueRequest(text) && !opts?.priorPlan) {
    return {
      kind: 'clarification',
      question: vagueClarification(text),
    };
  }

  const matches = matchBusinessPatterns(text);
  let plan = opts?.priorPlan ? { ...opts.priorPlan } : emptyPlan();

  if (matches.length) {
    // Prefer more specific patterns (pet_recycling before supplier_purchase)
    const ordered = [...matches].sort((a, b) => {
      const rank = (id: string) =>
        id === 'pet_recycling' ? 0 : id === 'service_job' ? 1 : id === 'job_work' ? 2 : 5;
      return rank(a.id) - rank(b.id);
    });
    const seeded = ordered[0].seed({ text });
    plan = mergePlans(plan, seeded as BusinessProcessPlan);
  } else if (!opts?.priorPlan) {
    plan = genericTrackerFromText(text);
  }

  plan = applyLanguageAdjustments(plan, text);

  // If owner only refined process, raise confidence
  if (opts?.priorPlan && matches.length) {
    plan.confidence = Math.min(0.95, plan.confidence + 0.1);
  }

  if (
    plan.missingInformation.length === 0 &&
    plan.confidence < 0.55 &&
    preferClarify &&
    isVagueRequest(text)
  ) {
    return {
      kind: 'clarification',
      question: vagueClarification(text),
      partial: plan,
    };
  }

  return { kind: 'plan', plan };
}

/**
 * Apply a semantic NL edit onto an existing process plan.
 */
export function applySemanticProcessEdit(
  plan: BusinessProcessPlan,
  editMessage: string
): { plan: BusinessProcessPlan; note: string } {
  const text = String(editMessage || '').trim();
  let next = applyLanguageAdjustments({ ...plan, assumptions: [...plan.assumptions] }, text);
  let note = 'Updated the business process model.';

  if (/don'?t buy|they bring|bring(s)? (the )?bottles|come to me/i.test(text)) {
    next = {
      ...next,
      goal: 'Track materials brought in (supplier delivery), not store purchases',
      assumptions: [
        ...next.assumptions,
        'Suppliers bring materials to you (delivery intake), rather than you buying from a shop.',
      ],
    };
    if (next.events[0]) {
      next.events = [
        {
          ...next.events[0],
          label: 'Supplier delivery',
          kind: 'receipt',
        },
      ];
    }
    next.suggestedActions = next.suggestedActions.map((a) =>
      a.type === 'create' ? { ...a, label: 'Record supplier delivery' } : a
    );
    note =
      'Switched to a supplier-delivery model. You’ll log materials brought to you, not shop purchases.';
  }

  if (/don'?t pay immediately|pay later|on credit|not upfront/i.test(text)) {
    next = applyLanguageAdjustments(next, 'payment balance credit outstanding');
    note =
      'Added payment tracking. Busmo will track amount paid and remaining balance.';
  }

  if (/worker|which staff|who handled|technician/i.test(text)) {
    next = applyLanguageAdjustments(next, 'worker staff employee');
    note = 'Added worker tracking so you can see who handled each job.';
  }

  if (/location|address|where they/i.test(text) && next.events[0]) {
    const fields = [...(next.events[0].fieldHints || [])];
    if (!fields.some((f) => f.key === 'location' || f.key === 'address')) {
      fields.push({ key: 'location', label: 'Location', type: 'text' });
      next.events = [{ ...next.events[0], fieldHints: fields }];
      note = 'Added location so you can record where each entry is from.';
    }
  }

  return { plan: next, note };
}
