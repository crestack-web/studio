'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from './AppContext';
import { useBranch } from '@/context/BranchContext';
import { getSupabase } from '@/lib/supabase';
import { getCategoryDepth, type CategoryDepthProfile } from '@/lib/categoryDepth';
import { Layers } from 'lucide-react';
import styles from './CategoryDepthStrip.module.css';

export function CategoryDepthStrip() {
  const { navigateTo, user } = useApp();
  const { businessId } = useBranch();
  const [profile, setProfile] = useState<CategoryDepthProfile | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let category = '';
      try {
        const bid = businessId || user?.businessId;
        if (user?.id) {
          const { data } = await getSupabase()
            .from('users')
            .select('category, business_type, metadata')
            .eq('id', user.id)
            .maybeSingle();
          category =
            (data as any)?.category ||
            (data as any)?.business_type ||
            (data as any)?.metadata?.category ||
            '';
        }
        if (bid && !category) {
          const { data: biz } = await getSupabase()
            .from('businesses')
            .select('category, industry, metadata')
            .eq('id', bid)
            .maybeSingle();
          const meta =
            biz?.metadata && typeof biz.metadata === 'object'
              ? (biz.metadata as Record<string, unknown>)
              : {};
          category =
            (biz as any)?.category ||
            (biz as any)?.industry ||
            (meta.category as string) ||
            (meta.selectedCategory as string) ||
            '';
        }
      } catch {
        /* ignore */
      }
      if (!cancelled) setProfile(getCategoryDepth(category));
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId, user?.id, user?.businessId]);

  if (!profile) return null;

  return (
    <div className={styles.wrap}>
      <div className={styles.top}>
        <Layers size={16} className={styles.icon} />
        <div>
          <div className={styles.label}>Set up for {profile.label}</div>
          <p className={styles.promise}>{profile.promise}</p>
        </div>
      </div>
      <div className={styles.actions}>
        {profile.quickActions.map((a) => (
          <button
            key={a.href}
            type="button"
            className={styles.chip}
            onClick={() => navigateTo(a.href as any)}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
