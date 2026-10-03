/**
 * Safe declarative computed values — whitelist operators only.
 * Never evaluates arbitrary JavaScript.
 */

import type { ComputedOperator, ComputedValueDef, FieldDefinition } from './types';

export function evaluateComputed(
  def: ComputedValueDef,
  data: Record<string, unknown>
): number | null {
  const nums = (def.inputs || []).map((k) => {
    const v = data[k];
    if (v == null || v === '') return null;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  });
  if (nums.some((n) => n == null)) return null;
  const values = nums as number[];
  const op: ComputedOperator = def.op;
  if (op === 'multiply') {
    return values.reduce((a, b) => a * b, 1);
  }
  if (op === 'add') {
    return values.reduce((a, b) => a + b, 0);
  }
  if (op === 'subtract') {
    if (values.length < 2) return values[0] ?? null;
    return values.slice(1).reduce((a, b) => a - b, values[0]);
  }
  if (op === 'divide') {
    if (values.length < 2) return values[0] ?? null;
    let out = values[0];
    for (let i = 1; i < values.length; i++) {
      if (values[i] === 0) return null;
      out = out / values[i];
    }
    return out;
  }
  return null;
}

/** Apply all computed fields onto a data object (returns new object). */
export function applyComputedFields(
  fields: FieldDefinition[],
  data: Record<string, unknown>
): Record<string, unknown> {
  const next = { ...data };
  for (const f of fields) {
    if (!f.computed) continue;
    const val = evaluateComputed(f.computed, next);
    if (val != null) {
      // Round currency-like to 2 decimals
      next[f.key] =
        f.type === 'currency' ? Math.round(val * 100) / 100 : val;
    }
  }
  return next;
}
