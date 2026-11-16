'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import type { IndustryConfig } from '@/lib/industries/types';
import styles from './IndustryShell.module.css';
import { SolutionsDashboard } from '../_design/SolutionsDashboard';

const PATH_SECTION_ALIASES: Record<string, string> = {
  time: 'time-tracking',
};

const HOSPITALITY_PATH_ALIASES: Record<string, string> = {
  settings: 'hotel-settings',
};

function deskPathFor(config: IndustryConfig) {
  if (config.id === 'hospitality') return '/solutions/hospitality/front-desk';
  if (config.id === 'healthcare') return '/solutions/healthcare/desk';
  if (config.id === 'education') return '/solutions/education/front-desk';
  if (config.id === 'professional') return '/solutions/professional/desk';
  return config.dashboardPath;
}

function deskLabel(config: IndustryConfig) {
  if (config.id === 'hospitality') return 'Front desk';
  if (config.id === 'healthcare') return 'Reception';
  if (config.id === 'education') return 'Front office';
  if (config.id === 'professional') return 'Staff workspace';
  return 'Staff desk';
}

function sectionFromPathname(pathname: string, config: IndustryConfig, sectionProp?: string) {
  if (sectionProp && sectionProp !== 'overview') return sectionProp;
  const base = config.dashboardPath.replace(/\/$/, '');
  const rest = (pathname || '').replace(base, '').replace(/^\//, '').split('/')[0] || '';
  if (!rest || rest === 'overview') return undefined;
  if (config.id === 'hospitality' && HOSPITALITY_PATH_ALIASES[rest]) {
    return HOSPITALITY_PATH_ALIASES[rest];
  }
  return PATH_SECTION_ALIASES[rest] || rest;
}

export function IndustryDashboardClient({
  config,
  section: sectionProp,
}: {
  config: IndustryConfig;
  section?: string;
}) {
  const pathname = usePathname() || '';
  const router = useRouter();
  const [displayName, setDisplayName] = useState(config.productName);
  const [userEmail, setUserEmail] = useState('');
  const [authChecked, setAuthChecked] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);

  const section = useMemo(
    () => sectionFromPathname(pathname, config, sectionProp),
    [pathname, config, sectionProp],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await getSupabase().auth.getSession();
        const sess = data.session;
        if (!sess?.access_token) {
          if (!cancelled) {
            setGateError('Sign in required');
            setAuthChecked(true);
            router.replace(config.loginPath);
          }
          return;
        }
        setUserEmail(sess.user.email || '');
        const name =
          (sess.user.user_metadata as any)?.full_name ||
          (sess.user.user_metadata as any)?.name ||
          sess.user.email?.split('@')[0] ||
          config.productName;
        if (!cancelled) setDisplayName(String(name));

        const res = await fetch('/api/industries/session', {
          headers: { Authorization: `Bearer ${sess.access_token}` },
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) {
            setGateError(json.error || 'Could not load your workspace');
            setAuthChecked(true);
          }
          return;
        }
        const s = json.session || {};
        if (!cancelled) {
          if (s.businessName || s.business_name) {
            setDisplayName(String(s.businessName || s.business_name));
          }
          setAuthChecked(true);
        }
      } catch (e: any) {
        if (!cancelled) {
          setGateError(e?.message || 'Session error');
          setAuthChecked(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [config.id, config.productName, config.loginPath, router]);

  const designSection = section || 'overview';

  if (!authChecked) {
    return (
      <div className={styles.boot}>
        <div className={styles.bootCard}>
          <div className={styles.bootPulse} />
          <p>Opening {config.productName}…</p>
        </div>
      </div>
    );
  }

  if (gateError) {
    return (
      <div className={styles.boot}>
        <div className={styles.bootCard}>
          <p className={styles.bootError}>{gateError}</p>
          <Link href={config.loginPath} className={styles.btnPrimary}>
            Sign in again
          </Link>
        </div>
      </div>
    );
  }

  return (
    <SolutionsDashboard
      suiteId={config.id}
      section={designSection}
      basePath={`/solutions/${config.id}/dashboard`}
      user={{ name: displayName, email: userEmail }}
      signOut={() => {
        if (typeof window !== 'undefined') window.location.href = config.loginPath;
      }}
    />
  );
}
