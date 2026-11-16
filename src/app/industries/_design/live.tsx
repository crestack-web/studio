'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getSupabase } from '@/lib/supabase';
import type { SolutionsSuiteId } from './types';
import { hydrateEducation } from './education/mock';
import { hydrateHealthcare } from './healthcare/mock';
import { hydrateHospitality } from './hospitality/mock';
import { hydrateProfessional } from './professional/mock';

type LiveStatus = 'idle' | 'loading' | 'live' | 'error';

export type MutateResult = {
  ok: boolean;
  error?: string;
  preview?: boolean;
  data?: any;
};

type LiveState = {
  status: LiveStatus;
  version: number;
  error?: string;
  warnings: string[];
  refresh: () => Promise<void>;
  mutate: (body: Record<string, unknown>) => Promise<MutateResult>;
};

const LiveContext = createContext<LiveState>({
  status: 'idle',
  version: 0,
  warnings: [],
  refresh: async () => {},
  mutate: async () => ({ ok: true, preview: true }),
});

export function useSolutionsLive() {
  return useContext(LiveContext);
}

const HYDRATORS: Record<SolutionsSuiteId, (payload: any) => boolean> = {
  education: hydrateEducation,
  healthcare: hydrateHealthcare,
  hospitality: hydrateHospitality,
  professional: hydrateProfessional,
};

export function SolutionsLiveProvider({
  suiteId,
  enabled = true,
  children,
}: {
  suiteId: string;
  enabled?: boolean;
  children: React.ReactNode;
}) {
  const id = (['hospitality', 'healthcare', 'professional', 'education'] as const).includes(
    suiteId as SolutionsSuiteId,
  )
    ? (suiteId as SolutionsSuiteId)
    : null;

  const [status, setStatus] = useState<LiveStatus>(enabled && id ? 'loading' : 'idle');
  const [version, setVersion] = useState(0);
  const [error, setError] = useState<string | undefined>(undefined);
  const [warnings, setWarnings] = useState<string[]>([]);
  const inFlight = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(
    async (silent = false) => {
      if (!enabled || !id || inFlight.current) return;
      inFlight.current = true;
      if (!silent) setStatus((s) => (s === 'live' ? s : 'loading'));
      try {
        const { data } = await getSupabase().auth.getSession();
        const token = data.session?.access_token;
        if (!token) {
          if (mounted.current) {
            setStatus('error');
            setError('Sign in required to load live data.');
          }
          return;
        }
        const res = await fetch(`/api/industries/${id}/workspace`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || `Request failed (${res.status})`);
        const hydrated = HYDRATORS[id](json);
        if (mounted.current) {
          setWarnings(Array.isArray(json?.warnings) ? json.warnings.filter(Boolean) : []);
          setError(undefined);
          setStatus(hydrated || json?.ok || json?.businessId ? 'live' : 'idle');
          setVersion((v) => v + 1);
        }
      } catch (e: any) {
        if (mounted.current) {
          setStatus('error');
          setError(e?.message || 'Could not load live data');
        }
      } finally {
        inFlight.current = false;
      }
    },
    [enabled, id],
  );

  useEffect(() => {
    if (enabled && id) void load();
  }, [enabled, id, load]);

  const refresh = useCallback(async () => {
    await load(true);
  }, [load]);

  const mutate = useCallback(
    async (body: Record<string, unknown>): Promise<MutateResult> => {
      if (!enabled || !id) return { ok: true, preview: true };
      try {
        const { data } = await getSupabase().auth.getSession();
        const token = data.session?.access_token;
        if (!token) return { ok: false, error: 'Sign in required.' };
        const res = await fetch(`/api/industries/${id}/workspace`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json?.ok === false) {
          return { ok: false, error: json?.error || `Request failed (${res.status})` };
        }
        await load(true);
        return { ok: true, data: json };
      } catch (e: any) {
        return { ok: false, error: e?.message || 'Could not save changes' };
      }
    },
    [enabled, id, load],
  );

  const value = useMemo<LiveState>(
    () => ({ status, version, error, warnings, refresh, mutate }),
    [status, version, error, warnings, refresh, mutate],
  );

  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}
