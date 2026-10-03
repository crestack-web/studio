/**
 * Natural language → BusmoFeatureDefinition.
 * Heuristics handle common scenarios without an LLM (tests / offline).
 * Optional Mistral structured generation when MISTRAL_API_KEY is set and
 * heuristics return "needs_clarification" or "use_llm".
 *
 * Never publishes. Never executes code.
 */
import { randomUUID } from 'crypto';
import type { BusmoFeatureDefinition, FieldDefinition } from './types';
import { validateFeatureDefinition } from './validate';
import { formatFeatureBuilderContextForPrompt } from './builder-context';

export type NlBuildResult =
  | {
      kind: 'definition';
      definition: BusmoFeatureDefinition;
      summary: string;
    }
  | {
      kind: 'clarification';
      question: string;
    }
  | {
      kind: 'unsupported';
      message: string;
    }
  | {
      kind: 'invalid';
      message: string;
      issues?: unknown;
    };

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'custom-feature';
}

function buildDefinition(opts: {
  name: string;
  description: string;
  entityKey: string;
  entityLabel: string;
  fields: FieldDefinition[];
  navLabel?: string;
}): BusmoFeatureDefinition {
  const slug = slugify(opts.name);
  const fieldKeys = opts.fields.map((f) => f.key);
  return {
    id: randomUUID(),
    slug,
    name: opts.name,
    description: opts.description,
    version: 1,
    status: 'draft',
    navLabel: opts.navLabel || opts.name,
    entities: [
      {
        key: opts.entityKey,
        label: opts.entityLabel,
        labelPlural: opts.entityLabel.endsWith('s')
          ? opts.entityLabel
          : `${opts.entityLabel}s`,
        primaryField: opts.fields[0]?.key,
        fields: opts.fields,
      },
    ],
    views: [
      {
        key: 'list',
        type: 'table',
        title: opts.entityLabel.endsWith('s')
          ? opts.entityLabel
          : `${opts.entityLabel}s`,
        entity: opts.entityKey,
        columns: opts.fields.slice(0, 8).map((f) => ({
          field: f.key,
          label: f.label,
        })),
      },
      {
        key: 'create',
        type: 'form',
        title: `New ${opts.entityLabel.toLowerCase()}`,
        entity: opts.entityKey,
        formFields: fieldKeys,
      },
      {
        key: 'summary',
        type: 'metrics',
        title: 'Summary',
        entity: opts.entityKey,
        metricFields: fieldKeys.filter((k) =>
          ['status', 'amount', 'quantity', 'waste', 'cost', 'weightKg', 'amountPaid', 'balance'].includes(k)
        ).length
          ? fieldKeys.filter((k) =>
              ['status', 'amount', 'quantity', 'waste', 'cost', 'weightKg', 'amountPaid', 'balance'].includes(k)
            )
          : fieldKeys.slice(0, 2),
      },
    ],
    actions: [
      { key: 'create', type: 'create', label: `Add ${opts.entityLabel.toLowerCase()}`, entity: opts.entityKey },
      { key: 'update', type: 'update', label: 'Update', entity: opts.entityKey },
      { key: 'delete', type: 'delete', label: 'Delete', entity: opts.entityKey },
    ],
  };
}

function isUnsupportedCodeRequest(text: string): boolean {
  return /\b(javascript|typescript|sql|react component|execute code|arbitrary code|eval\(|webhook handler|custom css)\b/i.test(
    text
  );
}

/** Deterministic templates for common owner requests. */
export function heuristicNlToDefinition(userMessage: string): NlBuildResult {
  const text = String(userMessage || '').trim();
  if (!text) {
    return {
      kind: 'clarification',
      question: 'What would you like to track? For example: deliveries, jobs, or batches.',
    };
  }

  if (isUnsupportedCodeRequest(text)) {
    return {
      kind: 'unsupported',
      message:
        'The Busmo feature builder supports declarative features (fields, tables, forms) — not arbitrary JavaScript, SQL, or custom code. Describe the records you want to track instead.',
    };
  }

  const lower = text.toLowerCase();

  // PET / recycling suppliers
  if (/pet|recycl|bottle/.test(lower) && /supplier|weight|kg|price|bring|buy/.test(lower)) {
    const def = buildDefinition({
      name: 'PET Supplier Tracker',
      description: 'Record supplier deliveries of PET bottles: weight, price per kg, amount paid and date.',
      entityKey: 'supplier_delivery',
      entityLabel: 'Supplier delivery',
      navLabel: 'PET Suppliers',
      fields: [
        { key: 'supplierName', label: 'Supplier name', type: 'text', required: true },
        { key: 'phone', label: 'Phone number', type: 'phone' },
        { key: 'weightKg', label: 'Weight received (kg)', type: 'number', required: true },
        { key: 'pricePerKg', label: 'Price per kg', type: 'currency', required: true },
        { key: 'amountPaid', label: 'Amount paid', type: 'currency' },
        { key: 'deliveryDate', label: 'Date', type: 'date', required: true },
        { key: 'notes', label: 'Notes', type: 'textarea' },
      ],
    });
    return {
      kind: 'definition',
      definition: def,
      summary:
        'DRAFT CREATED: PET Supplier Tracker. Preview before publishing — not live yet.',
    };
  }

  // Roofing / aluminium jobs
  if (/roof|aluminium|aluminum|job location/.test(lower) && /track|job|customer|need|want|run/.test(lower)) {
    const def = buildDefinition({
      name: 'Roofing Jobs',
      description: 'Track roofing jobs: customer, location, materials, workers, amounts and balance.',
      entityKey: 'roofing_job',
      entityLabel: 'Job',
      navLabel: 'Roofing Jobs',
      fields: [
        { key: 'customerName', label: 'Customer', type: 'text', required: true },
        { key: 'jobLocation', label: 'Job location', type: 'textarea', required: true },
        { key: 'materials', label: 'Materials', type: 'textarea' },
        { key: 'workers', label: 'Workers', type: 'text' },
        { key: 'amountAgreed', label: 'Amount agreed', type: 'currency', required: true },
        { key: 'amountPaid', label: 'Amount paid', type: 'currency' },
        { key: 'balance', label: 'Remaining balance', type: 'currency' },
        {
          key: 'status',
          label: 'Status',
          type: 'status',
          options: ['Quoted', 'In Progress', 'Completed', 'Paid'],
          defaultValue: 'Quoted',
        },
      ],
    });
    return {
      kind: 'definition',
      definition: def,
      summary: 'DRAFT CREATED: Roofing Jobs. Preview before publishing.',
    };
  }

  // Distributor credit / shops
  if (
    (/shop|distributor|credit/.test(lower) && /owe|bought|credit|sell|track|need|want/.test(lower)) ||
    /each shop|still owe/.test(lower)
  ) {
    const def = buildDefinition({
      name: 'Shop Credit Tracker',
      description: 'Track what each shop bought, paid and still owes.',
      entityKey: 'shop_credit',
      entityLabel: 'Credit sale',
      navLabel: 'Shop Credit',
      fields: [
        { key: 'shopName', label: 'Shop name', type: 'text', required: true },
        { key: 'products', label: 'What they bought', type: 'textarea', required: true },
        { key: 'amount', label: 'Amount', type: 'currency', required: true },
        { key: 'amountPaid', label: 'Amount paid', type: 'currency' },
        { key: 'balance', label: 'Still owes', type: 'currency' },
        { key: 'saleDate', label: 'Date', type: 'date' },
        {
          key: 'status',
          label: 'Payment status',
          type: 'status',
          options: ['Unpaid', 'Partial', 'Paid'],
          defaultValue: 'Unpaid',
        },
      ],
    });
    return {
      kind: 'definition',
      definition: def,
      summary: 'DRAFT CREATED: Shop Credit Tracker. Preview before publishing.',
    };
  }

  // Restaurant ingredients / meal cost
  if (/ingredient|meal cost|restaurant/.test(lower) && /track|buy|use|cost|need|want/.test(lower)) {
    const def = buildDefinition({
      name: 'Ingredient & Meal Cost',
      description: 'Track ingredient purchases, usage and cost per meal.',
      entityKey: 'ingredient_log',
      entityLabel: 'Ingredient entry',
      navLabel: 'Ingredients Cost',
      fields: [
        { key: 'ingredientName', label: 'Ingredient', type: 'text', required: true },
        { key: 'quantityBought', label: 'Quantity bought', type: 'number' },
        { key: 'amountPaid', label: 'Amount paid', type: 'currency', required: true },
        { key: 'quantityUsed', label: 'Quantity used', type: 'number' },
        { key: 'mealName', label: 'Meal', type: 'text' },
        { key: 'mealCost', label: 'Cost of meal', type: 'currency' },
        { key: 'entryDate', label: 'Date', type: 'date' },
      ],
    });
    return {
      kind: 'definition',
      definition: def,
      summary: 'DRAFT CREATED: Ingredient & Meal Cost. Preview before publishing.',
    };
  }

  // Delivery tracker
  if (
    /deliver/.test(lower) &&
    (/track|tracker|create|build|want|need/.test(lower) || lower.includes('delivery'))
  ) {
    const def = buildDefinition({
      name: 'Delivery Tracker',
      description: 'Track deliveries with customer, order, driver, status, date and amount.',
      entityKey: 'delivery',
      entityLabel: 'Delivery',
      navLabel: 'Deliveries',
      fields: [
        { key: 'customerName', label: 'Customer', type: 'text', required: true },
        { key: 'orderRef', label: 'Order', type: 'text', required: true },
        { key: 'driverName', label: 'Driver', type: 'text' },
        {
          key: 'status',
          label: 'Status',
          type: 'status',
          required: true,
          options: ['Pending', 'Out for Delivery', 'Delivered', 'Failed'],
          defaultValue: 'Pending',
        },
        { key: 'deliveryDate', label: 'Delivery date', type: 'date' },
        { key: 'amount', label: 'Amount', type: 'currency' },
      ],
    });
    return {
      kind: 'definition',
      definition: def,
      summary:
        'DRAFT CREATED: Delivery Tracker with customer, order, driver, status, delivery date and amount. Preview it before publishing — it is not live yet.',
    };
  }

  // Furniture / customer jobs
  if (
    (/furniture|job/.test(lower) && /track|create|build|want|need|customer/.test(lower)) ||
    /customer jobs?/.test(lower)
  ) {
    const def = buildDefinition({
      name: 'Customer Jobs',
      description: 'Track furniture or workshop jobs from request through completion.',
      entityKey: 'job',
      entityLabel: 'Job',
      navLabel: 'Jobs',
      fields: [
        { key: 'customerName', label: 'Customer', type: 'text', required: true },
        { key: 'jobType', label: 'Job type', type: 'text' },
        { key: 'amount', label: 'Amount', type: 'currency' },
        { key: 'assignedWorker', label: 'Assigned worker', type: 'text' },
        {
          key: 'status',
          label: 'Production status',
          type: 'status',
          required: true,
          options: ['New', 'In Production', 'Ready', 'Delivered'],
          defaultValue: 'New',
        },
      ],
    });
    return {
      kind: 'definition',
      definition: def,
      summary:
        'DRAFT CREATED: Customer Jobs with customer, job type, amount, assigned worker and production status. Preview before publishing.',
    };
  }

  // Food batches / waste
  if (/batch|food batch|quantity produced/.test(lower) || (/waste/.test(lower) && /batch|ingredient/.test(lower))) {
    const def = buildDefinition({
      name: 'Batch Tracking',
      description: 'Track food batches: ingredients, quantity produced and waste.',
      entityKey: 'batch',
      entityLabel: 'Batch',
      navLabel: 'Batches',
      fields: [
        { key: 'batchName', label: 'Batch name', type: 'text', required: true },
        { key: 'ingredients', label: 'Ingredients', type: 'textarea' },
        { key: 'quantityProduced', label: 'Quantity produced', type: 'number', required: true },
        { key: 'waste', label: 'Waste', type: 'number' },
        { key: 'producedAt', label: 'Production date', type: 'date' },
        {
          key: 'status',
          label: 'Status',
          type: 'status',
          options: ['Open', 'Closed'],
          defaultValue: 'Open',
        },
      ],
    });
    return {
      kind: 'definition',
      definition: def,
      summary:
        'DRAFT CREATED: Batch Tracking with ingredients, quantity produced and waste. Preview before publishing.',
    };
  }

  // Vague stock
  if (/\bstock\b/.test(lower) && !/product|supplier|cost|price|quantity/.test(lower)) {
    return {
      kind: 'clarification',
      question:
        'What do you want to track: products and quantities only, or also suppliers, purchase cost and selling price?',
    };
  }

  // Generic "track X" with listed fields after "with"
  const withMatch = text.match(/with\s+(.+)/i);
  if (/track|create|build|feature/.test(lower) && withMatch) {
    const parts = withMatch[1]
      .split(/,| and /i)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 10);
    if (parts.length >= 2) {
      const fields: FieldDefinition[] = parts.map((p) => {
        const key = slugify(p).replace(/-/g, '_') || 'field';
        const pl = p.toLowerCase();
        if (/amount|price|cost|fee/.test(pl)) {
          return { key, label: p, type: 'currency' as const };
        }
        if (/date|day/.test(pl)) return { key, label: p, type: 'date' as const };
        if (/status|state/.test(pl)) {
          return {
            key,
            label: p,
            type: 'status' as const,
            options: ['New', 'In Progress', 'Done'],
          };
        }
        if (/qty|quantity|count|number|weight|kg/.test(pl)) {
          return { key, label: p, type: 'number' as const };
        }
        return { key, label: p, type: 'text' as const };
      });
      const nameGuess =
        text.match(/(?:track|create|build)\s+(?:a\s+)?([a-z0-9\s-]{3,40}?)(?:\s+with|$)/i)?.[1]?.trim() ||
        'Custom Tracker';
      const entityKey = slugify(nameGuess).replace(/-/g, '_') || 'record';
      const def = buildDefinition({
        name: nameGuess.replace(/\b\w/g, (c) => c.toUpperCase()),
        description: `Track ${nameGuess}`,
        entityKey,
        entityLabel: nameGuess.replace(/\b\w/g, (c) => c.toUpperCase()),
        fields,
      });
      return {
        kind: 'definition',
        definition: def,
        summary: `DRAFT CREATED: ${def.name}. Preview it before publishing — it is not live yet.`,
      };
    }
  }

  return {
    kind: 'clarification',
    question:
      'What information do you need to record for each item? (e.g. customer, amount, status, date)',
  };
}

/**
 * Full pipeline: heuristic first; optional Mistral if still clarifying and key present.
 */
export async function naturalLanguageToFeatureDefinition(
  userMessage: string,
  opts?: { useLlm?: boolean }
): Promise<NlBuildResult> {
  const heuristic = heuristicNlToDefinition(userMessage);
  if (heuristic.kind !== 'clarification' || opts?.useLlm === false) {
    if (heuristic.kind === 'definition') {
      const v = validateFeatureDefinition(heuristic.definition);
      if (!v.ok) {
        return {
          kind: 'invalid',
          message: 'Generated definition failed validation',
          issues: v.issues,
        };
      }
      heuristic.definition.status = 'draft';
    }
    return heuristic;
  }

  if (!process.env.MISTRAL_API_KEY || opts?.useLlm === false) {
    return heuristic;
  }

  try {
    const { getMistralClient, DEFAULT_MODEL } = await import('@/ai/mistral');
    const client = getMistralClient();
    const system = `${formatFeatureBuilderContextForPrompt()}\n\nRespond with JSON only: either {"type":"definition","definition":{...}} or {"type":"clarification","question":"..."} or {"type":"unsupported","message":"..."}.`;
    const res = await client.chat.complete({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userMessage },
      ],
      responseFormat: { type: 'json_object' } as any,
      temperature: 0.2,
    });
    const content =
      typeof res.choices?.[0]?.message?.content === 'string'
        ? res.choices[0].message.content
        : JSON.stringify(res.choices?.[0]?.message?.content ?? '');
    const parsed = JSON.parse(content);
    if (parsed.type === 'clarification') {
      return { kind: 'clarification', question: String(parsed.question || heuristic.question) };
    }
    if (parsed.type === 'unsupported') {
      return {
        kind: 'unsupported',
        message: String(parsed.message || 'Unsupported request'),
      };
    }
    const definition = parsed.definition || parsed;
    definition.status = 'draft';
    if (!definition.id) definition.id = randomUUID();
    if (!definition.version) definition.version = 1;
    const v = validateFeatureDefinition(definition);
    if (!v.ok) {
      return {
        kind: 'invalid',
        message: 'AI definition failed Busmo validation',
        issues: v.issues,
      };
    }
    return {
      kind: 'definition',
      definition,
      summary: `DRAFT CREATED: ${definition.name}. Preview before publishing — not live yet.`,
    };
  } catch (e: any) {
    console.warn('[nl-to-definition] LLM fallback failed', e?.message);
    return heuristic;
  }
}
