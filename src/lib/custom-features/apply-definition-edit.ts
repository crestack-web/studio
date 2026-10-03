/**
 * Apply owner NL edit requests to an existing draft definition.
 * Controlled vocabulary only — never generates executable code.
 */
import type {
  BusmoFeatureDefinition,
  ComputedValueDef,
  FieldDefinition,
  FieldType,
} from './types';
import { validateFeatureDefinition } from './validate';
import { planBusinessProcess, applySemanticProcessEdit } from './process-planner';
import { businessProcessPlanToDefinition } from './plan-to-definition';

export type ApplyEditResult =
  | { ok: true; definition: BusmoFeatureDefinition; note?: string }
  | { ok: false; message: string };

function slugKey(label: string): string {
  return (
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 40) || 'field'
  );
}

function inferType(label: string): FieldType {
  const pl = label.toLowerCase();
  if (/amount|price|cost|fee|paid|balance|owe|payment|total|value/.test(pl))
    return 'currency';
  if (/weight|kg|quantity|qty|count|number|rate/.test(pl)) return 'number';
  if (/date|day/.test(pl)) return 'date';
  if (/phone|mobile|whatsapp/.test(pl)) return 'phone';
  if (/email/.test(pl)) return 'email';
  if (/note|notes|description|location|address|detail/.test(pl)) return 'textarea';
  if (/status/.test(pl)) return 'status';
  if (/supplier|customer|product|material|staff|worker|driver/.test(pl))
    return 'relation';
  return 'text';
}

function cloneDef(def: BusmoFeatureDefinition): BusmoFeatureDefinition {
  return JSON.parse(JSON.stringify(def)) as BusmoFeatureDefinition;
}

function primaryEntity(def: BusmoFeatureDefinition) {
  return def.entities[0];
}

function ensureFieldOnViews(def: BusmoFeatureDefinition, field: FieldDefinition) {
  for (const v of def.views || []) {
    if (v.type === 'table') {
      v.columns = v.columns || [];
      if (!v.columns.some((c) => c.field === field.key)) {
        v.columns.push({ field: field.key, label: field.label });
      }
    }
    if (v.type === 'form') {
      v.formFields = v.formFields || [];
      if (!v.formFields.includes(field.key)) {
        v.formFields.push(field.key);
      }
    }
    if (
      v.type === 'metrics' &&
      (field.type === 'currency' || field.type === 'number')
    ) {
      v.metricFields = v.metricFields || [];
      if (!v.metricFields.includes(field.key)) {
        v.metricFields.push(field.key);
      }
    }
  }
}

function findField(
  entity: BusmoFeatureDefinition['entities'][0],
  hint: string
): FieldDefinition | undefined {
  const h = hint.toLowerCase().replace(/[^a-z0-9]+/g, '');
  return entity.fields.find((f) => {
    const key = f.key.toLowerCase().replace(/[^a-z0-9]+/g, '');
    const label = f.label.toLowerCase().replace(/[^a-z0-9]+/g, '');
    return key.includes(h) || label.includes(h) || h.includes(key) || h.includes(label);
  });
}

function findFieldKey(
  entity: BusmoFeatureDefinition['entities'][0],
  candidates: string[]
): string | null {
  for (const c of candidates) {
    const f = findField(entity, c);
    if (f) return f.key;
  }
  // fuzzy by regex groups
  for (const f of entity.fields) {
    const blob = `${f.key} ${f.label}`.toLowerCase();
    for (const c of candidates) {
      if (blob.includes(c.toLowerCase())) return f.key;
    }
  }
  return null;
}

function finalize(
  def: BusmoFeatureDefinition,
  note: string
): ApplyEditResult {
  def.status = 'draft';
  const v = validateFeatureDefinition(def);
  if (!v.ok) {
    return {
      ok: false,
      message:
        'That change did not pass Busmo validation. Try a simpler field add/remove, or describe the calculation with two existing fields.',
    };
  }
  return { ok: true, definition: def, note };
}

/** Add computed expression on an existing or new output field. */
function applyCalculationEdit(
  def: BusmoFeatureDefinition,
  text: string
): ApplyEditResult | null {
  const lower = text.toLowerCase();
  const wantsCalc =
    /calculat|auto[- ]?calc|automat|formula|multiply|times|\*|×|x\s|product of|equals?|should be|make total|total amount|balance|remaining|owe|derived|computed/i.test(
      lower
    );
  if (!wantsCalc) return null;

  const entity = primaryEntity(def);
  if (!entity) return { ok: false, message: 'No entity to edit.' };

  // Pattern: total = a * b  OR  total is kg times price
  const mulMatch =
    text.match(
      /(?:make\s+)?([\w\s]+?)\s*(?:=|equals?|should be|is|as)\s*([\w\s]+?)\s*(?:\*|×|x|times|multiplied by)\s*([\w\s]+)/i
    ) ||
    text.match(
      /([\w\s]+?)\s*(?:\*|×|times|multiplied by)\s*([\w\s]+?)\s*(?:for|as|to get|=)\s*([\w\s]+)/i
    );

  // Balance patterns
  const wantsBalance =
    /balance|remaining|outstanding|what.*(owe|left)|amount left/i.test(lower);
  const wantsTotal =
    /total|value|amount (due|owed)|material value|line total|job cost/i.test(
      lower
    ) || !!mulMatch;

  let note = '';

  if (mulMatch || (wantsTotal && /kg|quantity|qty|price|rate|unit/i.test(lower))) {
    let left = findFieldKey(entity, [
      'quantity_kg',
      'quantity',
      'qty',
      'weight',
      'kg',
      'units',
      'material_cost',
    ]);
    let right = findFieldKey(entity, [
      'price_per_kg',
      'unit_price',
      'price',
      'rate',
      'cost',
      'labour_cost',
      'selling_price',
    ]);

    if (mulMatch) {
      const a = mulMatch[2]?.trim() || mulMatch[1]?.trim();
      const b = mulMatch[3]?.trim() || mulMatch[2]?.trim();
      const outLabel = mulMatch[1]?.trim();
      if (a) left = findFieldKey(entity, [a, slugKey(a)]) || left;
      if (b) right = findFieldKey(entity, [b, slugKey(b)]) || right;
      // Ensure inputs exist
      if (!left && a) {
        const key = slugKey(a);
        const field: FieldDefinition = {
          key,
          label: a.replace(/\b\w/g, (c) => c.toUpperCase()),
          type: inferType(a),
          required: true,
        };
        entity.fields.push(field);
        ensureFieldOnViews(def, field);
        left = key;
      }
      if (!right && b) {
        const key = slugKey(b);
        const field: FieldDefinition = {
          key,
          label: b.replace(/\b\w/g, (c) => c.toUpperCase()),
          type: inferType(b),
          required: true,
        };
        entity.fields.push(field);
        ensureFieldOnViews(def, field);
        right = key;
      }
      void outLabel;
    }

    // Default PET-style if still missing
    if (!left) {
      const field: FieldDefinition = {
        key: 'quantity_kg',
        label: 'Weight (kg)',
        type: 'number',
        required: true,
      };
      entity.fields.push(field);
      ensureFieldOnViews(def, field);
      left = field.key;
    }
    if (!right) {
      const field: FieldDefinition = {
        key: 'price_per_kg',
        label: 'Price per kg',
        type: 'currency',
        required: true,
      };
      entity.fields.push(field);
      ensureFieldOnViews(def, field);
      right = field.key;
    }

    let totalKey =
      findFieldKey(entity, [
        'total_amount',
        'total',
        'amount',
        'job_cost',
        'line_total',
        'value',
      ]) || 'total_amount';
    let totalField = entity.fields.find((f) => f.key === totalKey);
    if (!totalField) {
      totalField = {
        key: totalKey,
        label: 'Total amount',
        type: 'currency',
      };
      entity.fields.push(totalField);
      ensureFieldOnViews(def, totalField);
    }
    const computed: ComputedValueDef = {
      op: 'multiply',
      inputs: [left, right],
    };
    totalField.computed = computed;
    note = `Total is now calculated as ${left} × ${right}.`;
  }

  if (wantsBalance || /subtract|minus|less paid/i.test(lower)) {
    let totalKey =
      findFieldKey(entity, [
        'total_amount',
        'total',
        'agreed_amount',
        'amount',
        'job_cost',
      ]) || null;
    let paidKey =
      findFieldKey(entity, [
        'amount_paid',
        'paid',
        'payment',
        'deposit',
      ]) || null;

    if (!totalKey) {
      const field: FieldDefinition = {
        key: 'total_amount',
        label: 'Total amount',
        type: 'currency',
      };
      entity.fields.push(field);
      ensureFieldOnViews(def, field);
      totalKey = field.key;
    }
    if (!paidKey) {
      const field: FieldDefinition = {
        key: 'amount_paid',
        label: 'Amount paid',
        type: 'currency',
      };
      entity.fields.push(field);
      ensureFieldOnViews(def, field);
      paidKey = field.key;
    }

    let balKey =
      findFieldKey(entity, ['balance', 'outstanding', 'remaining', 'owe']) ||
      'balance';
    let balField = entity.fields.find((f) => f.key === balKey);
    if (!balField) {
      balField = {
        key: balKey,
        label: 'Balance',
        type: 'currency',
      };
      entity.fields.push(balField);
      ensureFieldOnViews(def, balField);
    }
    balField.computed = {
      op: 'subtract',
      inputs: [totalKey, paidKey],
    };
    note = note
      ? `${note} Balance is ${totalKey} − ${paidKey}.`
      : `Balance is calculated as ${totalKey} − ${paidKey}.`;
  }

  // Generic add: material + labour
  if (/material.*labour|labour.*material|cost \+ /.test(lower)) {
    let m = findFieldKey(entity, ['material_cost', 'materials']);
    let l = findFieldKey(entity, ['labour_cost', 'labor', 'labour']);
    if (!m) {
      const f: FieldDefinition = {
        key: 'material_cost',
        label: 'Material cost',
        type: 'currency',
      };
      entity.fields.push(f);
      ensureFieldOnViews(def, f);
      m = f.key;
    }
    if (!l) {
      const f: FieldDefinition = {
        key: 'labour_cost',
        label: 'Labour cost',
        type: 'currency',
      };
      entity.fields.push(f);
      ensureFieldOnViews(def, f);
      l = f.key;
    }
    let out =
      findFieldKey(entity, ['job_cost', 'total_cost', 'total_amount']) ||
      'job_cost';
    let outF = entity.fields.find((f) => f.key === out);
    if (!outF) {
      outF = { key: out, label: 'Job cost', type: 'currency' };
      entity.fields.push(outF);
      ensureFieldOnViews(def, outF);
    }
    outF.computed = { op: 'add', inputs: [m, l] };
    note = `Job cost is calculated as ${m} + ${l}.`;
  }

  if (!note) return null;
  return finalize(def, note);
}

function trySemanticEdit(
  current: BusmoFeatureDefinition,
  text: string
): ApplyEditResult | null {
  const semanticHit =
    /don'?t buy|they bring|bring(s)? (the )?bottles|pay later|on credit|don'?t pay immediately|worker|which staff|who handled|technician|location|address|settlement|weekly|end of (the )?week/i.test(
      text
    );
  if (!semanticHit) return null;

  const seedText = [current.name, current.description || '', text].join('\n');
  const planned = planBusinessProcess(seedText, { preferClarification: false });
  if (planned.kind !== 'plan') return null;
  const { plan, note } = applySemanticProcessEdit(planned.plan, text);
  const next = businessProcessPlanToDefinition(plan);
  next.id = current.id;
  next.slug = current.slug;
  next.version = current.version;
  next.status = current.status === 'published' ? 'draft' : current.status;
  next.businessId = current.businessId;

  // Merge computed fields from current that still exist by key
  const curEnt = primaryEntity(current);
  const nextEnt = primaryEntity(next);
  if (curEnt && nextEnt) {
    for (const f of curEnt.fields) {
      if (!f.computed) continue;
      const nf = nextEnt.fields.find((x) => x.key === f.key);
      if (nf) nf.computed = f.computed;
    }
  }

  const v = validateFeatureDefinition(next);
  if (!v.ok) return null;
  return { ok: true, definition: next, note };
}

function parseLabelsToAdd(text: string): string[] {
  const cleaned = text
    .replace(
      /^(please\s+)?(can you\s+)?(also\s+)?(add|include|put|track|need|want)\s+/i,
      ''
    )
    .replace(/\s+field(s)?$/i, '')
    .replace(/\b(a|an|the|my|our)\b/gi, ' ')
    .trim();

  // "add X and Y" / "add X, Y"
  const parts = cleaned
    .split(/\s*(?:,| and | & |\+)\s*/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && s.length < 60)
    .filter((s) => !/^(please|also|field|fields|to|the|feature)$/i.test(s));

  return parts.slice(0, 6);
}

export function applyDefinitionEdit(
  current: BusmoFeatureDefinition,
  editMessage: string
): ApplyEditResult {
  const text = String(editMessage || '').trim();
  if (!text) return { ok: false, message: 'What would you like to change?' };

  if (
    /whatsapp\s+automat|send\s+sms|webhook|javascript|typescript|\bsql\b|execute code|react component/i.test(
      text
    )
  ) {
    return {
      ok: false,
      message:
        'I can change fields and calculations in this builder, but not automated WhatsApp/SMS, webhooks, or custom code.',
    };
  }

  // 1) Calculations first
  const calc = applyCalculationEdit(cloneDef(current), text);
  if (calc) return calc;

  // 2) Semantic process edits
  const semantic = trySemanticEdit(current, text);
  if (semantic) return semantic;

  const def = cloneDef(current);
  const entity = primaryEntity(def);
  if (!entity) return { ok: false, message: 'No entity to edit.' };

  // 3) Remove field
  const removeMatch = text.match(
    /(?:remove|delete|drop|hide)\s+(?:the\s+)?(?:field\s+)?["']?([^"']+?)["']?\s*$/i
  );
  if (removeMatch || /(?:remove|delete|drop)\s+/i.test(text)) {
    const label =
      removeMatch?.[1]?.trim() ||
      text
        .replace(/^(please\s+)?(remove|delete|drop|hide)\s+(the\s+)?(field\s+)?/i, '')
        .trim();
    if (label) {
      const before = entity.fields.length;
      entity.fields = entity.fields.filter((f) => {
        const blob = `${f.key} ${f.label}`.toLowerCase();
        return !blob.includes(label.toLowerCase());
      });
      if (entity.fields.length === before) {
        return {
          ok: false,
          message: `I could not find a field matching “${label}”.`,
        };
      }
      for (const v of def.views || []) {
        if (v.columns) {
          v.columns = v.columns.filter(
            (c) => entity.fields.some((f) => f.key === c.field)
          );
        }
        if (v.formFields) {
          v.formFields = v.formFields.filter((k) =>
            entity.fields.some((f) => f.key === k)
          );
        }
        if (v.metricFields) {
          v.metricFields = v.metricFields.filter((k) =>
            entity.fields.some((f) => f.key === k)
          );
        }
      }
      return finalize(def, `Removed “${label}”.`);
    }
  }

  // 4) Rename feature
  const rename = text.match(
    /rename\s+(?:(?:this|the)\s+)?(?:feature|tool)?\s*(?:to\s+)?["']?([^"']+)["']?/i
  );
  if (rename) {
    def.name = rename[1].trim();
    def.navLabel = def.name;
    return finalize(def, `Renamed to ${def.name}`);
  }

  // 5) Add fields (broad)
  const wantsAdd =
    /^(add|include|put|track|need|want|also)\b/i.test(text) ||
    /\badd\b.+\b(field|column)?/i.test(text);
  if (wantsAdd) {
    const labels = parseLabelsToAdd(text);
    if (!labels.length) {
      return {
        ok: false,
        message:
          'Tell me which field to add, e.g. “Add location” or “Add amount paid”.',
      };
    }
    const added: string[] = [];
    for (const label of labels) {
      const key = slugKey(label);
      if (entity.fields.some((f) => f.key === key)) continue;
      const type = inferType(label);
      const field: FieldDefinition = {
        key,
        label: label.replace(/\b\w/g, (c) => c.toUpperCase()),
        type,
      };
      if (type === 'status') {
        field.options = ['Pending', 'In progress', 'Done', 'Cancelled'];
      }
      if (type === 'relation') {
        if (/supplier/i.test(label)) field.relationTarget = 'supplier';
        else if (/customer/i.test(label)) field.relationTarget = 'customer';
        else if (/product|material/i.test(label)) field.relationTarget = 'product';
        else if (/staff|worker/i.test(label)) field.relationTarget = 'staff';
      }
      entity.fields.push(field);
      ensureFieldOnViews(def, field);
      added.push(field.label);
    }
    if (!added.length) {
      return { ok: false, message: 'Those fields are already on the feature.' };
    }
    return finalize(def, `Added ${added.join(', ')}`);
  }

  // 6) Soft fallback: treat free text as "add field" if short
  if (text.length < 40 && !/\?$/.test(text)) {
    const labels = parseLabelsToAdd(`add ${text}`);
    if (labels.length === 1) {
      const label = labels[0];
      const key = slugKey(label);
      if (!entity.fields.some((f) => f.key === key)) {
        const type = inferType(label);
        const field: FieldDefinition = {
          key,
          label: label.replace(/\b\w/g, (c) => c.toUpperCase()),
          type,
        };
        entity.fields.push(field);
        ensureFieldOnViews(def, field);
        return finalize(def, `Added ${field.label}`);
      }
    }
  }

  return {
    ok: false,
    message:
      'I can add or remove fields, rename the tool, or set calculations. Try: “Add location”, “Remove phone”, “Calculate total as kg × price”, or “Auto-calculate balance”.',
  };
}
