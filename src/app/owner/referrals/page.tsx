'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Copy, Gift, Link2, Percent, Users, CircleDollarSign } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-provider';
import { formatCurrency } from '@/lib/currency';
import { getFunctionUrl } from '@/lib/api';

interface AppUser {
  displayName?: string;
  businessId?: string;
  referralCode?: string;
}

interface ReferralStats {
  balance?: number;
  currentRate?: number;
  paidReferralsCount?: number;
  totalReferralsCount?: number;
}

interface Business {
  currency?: string;
}

export default function ReferralsPage() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user: authUser } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!authUser || !firestore) return null;
    return doc(firestore, `users/${authUser.uid}`);
  }, [authUser, firestore]);
  const { data: userProfile } = useDoc<AppUser>(userProfileRef);

  const referralStatsRef = useMemoFirebase(() => {
    if (!authUser || !firestore) return null;
    return doc(firestore, `users/${authUser.uid}/referralStats/summary`);
  }, [authUser, firestore]);
  const { data: referralStats } = useDoc<ReferralStats>(referralStatsRef);

  const businessRef = useMemoFirebase(() => {
    const businessId = userProfile?.businessId;
    if (!businessId || !firestore) return null;
    return doc(firestore, `businesses/${businessId}`);
  }, [firestore, userProfile?.businessId]);
  const { data: businessData } = useDoc<Business>(businessRef);

  const didEnsureReferralCode = useRef(false);
  useEffect(() => {
    if (!authUser || didEnsureReferralCode.current) return;
    if ((userProfile as any)?.referralCode) return;

    (async () => {
      try {
        const token = await authUser.getIdToken();
        await fetch(getFunctionUrl('ensureReferralCode'), {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });
      } catch {
        // Silent: user can still use the page.
      } finally {
        didEnsureReferralCode.current = true;
      }
    })();
  }, [authUser, userProfile]);

  const handleCopyReferralLink = async () => {
    try {
      if (typeof window === 'undefined') return;
      const code = (userProfile as any)?.referralCode;
      if (!code) {
        toast({
          variant: 'destructive',
          title: t('ownerHome.referralMissingCodeTitle'),
          description: t('ownerHome.referralMissingCodeDesc'),
        });
        return;
      }

      const url = `${window.location.origin}/signup?ref=${encodeURIComponent(String(code))}`;
      await navigator.clipboard.writeText(url);
      toast({
        title: t('ownerHome.referralCopiedTitle'),
        description: t('ownerHome.referralCopiedDesc'),
      });
    } catch {
      toast({
        variant: 'destructive',
        title: t('ownerHome.referralCopyFailedTitle'),
        description: t('ownerHome.referralCopyFailedDesc'),
      });
    }
  };

  const currency = businessData?.currency || 'NGN';

  return (
    <main className="flex-1 p-4 sm:p-6 space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" /> {t('ownerHome.referralTitle')}
          </CardTitle>
          <CardDescription className="text-xs">{t('ownerHome.referralSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border bg-background p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Link2 className="h-4 w-4" /> {t('ownerHome.referralLinkLabel')}
                </p>
                <p className="mt-1 font-semibold truncate">
                  {(userProfile as any)?.referralCode
                    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/signup?ref=${(userProfile as any).referralCode}`
                    : t('ownerHome.needsData')}
                </p>
              </div>
              <Button type="button" variant="secondary" onClick={handleCopyReferralLink} className="shrink-0">
                <Copy className="h-4 w-4 mr-2" /> {t('ownerHome.referralCopyButton')}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-md border bg-background p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Percent className="h-4 w-4 text-primary" /> {t('ownerHome.referralRateLabel')}
              </div>
              <p className="mt-2 text-2xl font-bold leading-none">
                {Math.round(((referralStats?.currentRate ?? 0.3) as number) * 100)}%
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{t('ownerHome.referralRateHint')}</p>
            </div>

            <div className="rounded-md border bg-background p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-4 w-4 text-primary" /> {t('ownerHome.referralPaidUsersLabel')}
              </div>
              <p className="mt-2 text-2xl font-bold leading-none">{referralStats?.paidReferralsCount ?? 0}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t('ownerHome.referralPaidUsersHint')}</p>
            </div>

            <div className="rounded-md border bg-background p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CircleDollarSign className="h-4 w-4 text-primary" /> {t('ownerHome.referralBalanceLabel')}
              </div>
              <p className="mt-2 text-2xl font-bold leading-none">{formatCurrency(referralStats?.balance ?? 0, currency)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t('ownerHome.referralBalanceHint')}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <p className="text-xs text-muted-foreground">{t('ownerHome.referralFootnote')}</p>
        </CardFooter>
      </Card>
    </main>
  );
}
