import { addDays, nightsBetween, todayISO } from '../format';
import { SOLUTIONS_SUITES } from '../suites';
// TEMP truncated - will replace
export function hydrateHospitality(payload: any): boolean {
  return Boolean(payload?.ok || payload?.businessId);
}
