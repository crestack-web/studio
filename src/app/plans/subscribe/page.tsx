'use client';

import React, { Suspense, useMemo, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Ticket, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BUSMO_PLANS, formatNaira, getPlanById, type PlanId } from '@/lib/pricing';

const plans = BUSMO_PLANS.map((p) => ({
  id: p.id as PlanId,
  name: p.name,
  monthlyPrice: p.monthlyPrice,
  yearlyPrice: p.yearlyPrice,
}));

interface UserProfile {
  id: string;
  email?: string | null;
  name?: string | null;
  business_id?: string | null;
  businessId?: string | null;
  plan?: string | null;
  subscription_status?: string | null;
  subscriptionStatus?: string | null;
  trial_end_date?: string | null;
  trialEndDate?: string | null;
}

function SubscribePageContent() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscountPct, setAppliedDiscountPct] = useState(0);
  const [isVerifyingCoupon, setIsVerifyingCoupon] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>('starter');

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId) || plans[0],
    [selectedPlanId]
  );

  const originalAmount = useMemo(() => {
    if (!selectedPlan) return 0;
    return billingCycle === 'monthly' ? selectedPlan.monthlyPrice : selectedPlan.yearlyPrice;
  }, [selectedPlan, billingCycle]);

  const finalAmount = useMemo(() => {
    if (appliedDiscountPct <= 0) return originalAmount;
    return Math.max(0, Math.round(originalAmount * (1 - appliedDiscountPct / 100)));
  }, [originalAmount, appliedDiscountPct]);

  const loadProfile = useCallback(async () => {
    try {
      const supabase = getSupabase();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        setIsLoading(false);
        return;
      }
      setAuthUserId(user.id);
      setAuthEmail(user.email ?? null);

      const { data: row } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (row) {
        const p = row as UserProfile;
        setProfile(p);
        const planFromDb = String(p.plan || 'starter').toLowerCase() as PlanId;
        if (plans.some((x) => x.id === planFromDb)) {
          setSelectedPlanId(planFromDb);
        }
      } else {
        setProfile({
          id: user.id,
          email: user.email,
          plan: 'starter',
        });
      }
    } catch (e) {
      console.error('[subscribe] load profile failed', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // After Paystack redirect: verify reference and unlock account
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reference =
      searchParams.get('reference') ||
      searchParams.get('trxref') ||
      null;
    if (!reference) return;

    let cancelled = false;
    (async () => {
      setIsVerifyingPayment(true);
      try {
        const res = await fetch('/api/payments/verify-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference }),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && (data.success || data.plan)) {
          setPaymentSuccess(true);
          toast({
            title: 'Payment successful',
            description: 'Your account is unlocked. Redirecting to dashboard…',
          });
          const url = new URL(window.location.href);
          url.searchParams.delete('reference');
          url.searchParams.delete('trxref');
          url.searchParams.delete('paid');
          window.history.replaceState({}, '', url.pathname + url.search);
          setTimeout(() => {
            router.replace('/owner/home');
          }, 1500);
        } else {
          toast({
            title: 'Verification issue',
            description:
              data.error ||
              'Payment could not be confirmed yet. If you were charged, contact support with your receipt.',
            variant: 'destructive',
          });
        }
      } catch (e: any) {
        console.error('[subscribe] verify failed', e);
        if (!cancelled) {
          toast({
            title: 'Verification failed',
            description: e?.message || 'Could not verify payment. Please try again or contact support.',
            variant: 'destructive',
          });
        }
      } finally {
        if (!cancelled) setIsVerifyingPayment(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, router, toast]);

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      toast({ title: 'Please enter a coupon code.', variant: 'destructive' });
      return;
    }
    setIsVerifyingCoupon(true);
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) {
        if (code === 'BUSMO20' || code === 'TRIAL20') {
          setAppliedDiscountPct(20);
          toast({ title: 'Coupon applied', description: '20% off applied.' });
        } else {
          setAppliedDiscountPct(0);
          toast({
            title: 'Invalid coupon',
            description: 'The coupon code is invalid or expired.',
            variant: 'destructive',
          });
        }
      } else {
        const dtype = String((data as any).discount_type || (data as any).discountType || 'percentage');
        const dval = Number((data as any).discount_value ?? (data as any).discountValue ?? 0);
        if (dtype === 'percentage' || dtype === 'percent') {
          setAppliedDiscountPct(Math.min(100, Math.max(0, dval)));
          toast({ title: 'Coupon applied', description: `${dval}% off applied.` });
        } else {
          const pct = originalAmount > 0 ? Math.min(100, (dval / originalAmount) * 100) : 0;
          setAppliedDiscountPct(pct);
          toast({ title: 'Coupon applied', description: 'Discount applied.' });
        }
      }
    } catch {
      if (code === 'BUSMO20' || code === 'TRIAL20') {
        setAppliedDiscountPct(20);
        toast({ title: 'Coupon applied', description: '20% off applied.' });
      } else {
        setAppliedDiscountPct(0);
        toast({
          title: 'Invalid coupon',
          description: 'Could not verify coupon.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsVerifyingCoupon(false);
    }
  };

  const handlePayment = async () => {
    const email = (profile?.email || authEmail || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      toast({
        title: 'Email required',
        description: 'Please sign in with a valid email to subscribe.',
        variant: 'destructive',
      });
      return;
    }
    if (!authUserId) {
      toast({
        title: 'Sign in required',
        description: 'Please log in again to complete payment.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const origin =
        typeof window !== 'undefined' ? window.location.origin : 'https://www.busmo.io';
      const callbackUrl = `${origin}/plans/subscribe?paid=1`;

      const response = await fetch('/api/payments/initialize-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          planId: selectedPlanId,
          billing: billingCycle,
          userId: authUserId,
          callbackUrl,
        }),
      });

      const paymentData = await response.json().catch(() => ({}));
      const authorizationUrl =
        paymentData?.data?.authorization_url || paymentData?.authorization_url;

      if (response.ok && authorizationUrl) {
        window.location.href = authorizationUrl;
        return;
      }

      throw new Error(
        paymentData?.error ||
          paymentData?.message ||
          'Failed to initialize subscription payment.'
      );
    } catch (error: any) {
      console.error('Failed to process subscription:', error);
      toast({
        title: 'Payment error',
        description:
          error?.message ||
          'Could not start your subscription payment. Please contact support.',
        variant: 'destructive',
      });
      setIsProcessing(false);
    }
  };

  if (isLoading || isVerifyingPayment) {
    return (
      <div className="w-full max-w-sm mx-auto space-y-6">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
        {isVerifyingPayment && (
          <p className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Confirming payment…
          </p>
        )}
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="w-full max-w-sm mx-auto">
        <Card>
          <CardContent className="pt-8 pb-8 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
            <div className="text-lg font-semibold">Subscription active</div>
            <p className="text-muted-foreground text-sm">
              Your account is unlocked. Taking you to the dashboard…
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!authUserId) {
    return (
      <div className="w-full max-w-sm mx-auto">
        <Card>
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="text-lg font-semibold">Sign in required</div>
            <p className="text-muted-foreground text-sm">
              Log in to subscribe and unlock your Busmo account.
            </p>
            <Button className="w-full" onClick={() => router.push('/login')}>
              Go to login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto space-y-6 py-8 px-4">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col items-center mb-2">
            <div className="text-xl font-headline font-bold mb-1">Your Subscription</div>
            <div className="text-muted-foreground text-center text-sm">
              Your free trial has ended. Subscribe to continue using Busmo.
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Choose plan</label>
            <div className="grid gap-2">
              {plans.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPlanId(p.id)}
                  className={`flex justify-between items-center p-3 rounded-md border text-left transition-colors ${
                    selectedPlanId === p.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-muted hover:border-muted-foreground/40'
                  }`}
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatNaira(
                      billingCycle === 'monthly' ? p.monthlyPrice : p.yearlyPrice
                    )}
                    /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <Tabs
            value={billingCycle}
            onValueChange={(val) => setBillingCycle(val as 'monthly' | 'yearly')}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">
                Yearly <span className="ml-1 text-xs text-green-600">(Save ~17%)</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Price</span>
              <span>{formatNaira(originalAmount)}</span>
            </div>
            {appliedDiscountPct > 0 && (
              <div className="flex justify-between items-center text-green-600">
                <span className="text-sm">Discount ({appliedDiscountPct}%)</span>
                <span className="text-sm">
                  −{formatNaira(originalAmount - finalAmount)}
                </span>
              </div>
            )}
          </div>

          <Separator />

          <div className="flex justify-between items-center text-xl font-bold">
            <span>Total due today</span>
            <span>{formatNaira(finalAmount)}</span>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Secure checkout with Paystack · NGN
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-2 pt-6">
          <Ticket className="h-5 w-5 mr-2 text-muted-foreground shrink-0" />
          <Input
            placeholder="Enter coupon code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
          />
          <Button
            onClick={handleApplyCoupon}
            disabled={isVerifyingCoupon}
            variant="outline"
          >
            {isVerifyingCoupon ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Apply'
            )}
          </Button>
        </CardContent>
      </Card>

      <Button
        className="w-full h-14 text-lg"
        onClick={handlePayment}
        disabled={isProcessing}
      >
        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {isProcessing ? 'Redirecting to Paystack…' : 'Pay with Paystack'}
      </Button>
    </div>
  );
}

export default function SubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-sm mx-auto space-y-6 py-8 px-4">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      }
    >
      <SubscribePageContent />
    </Suspense>
  );
}

export const dynamic = 'force-dynamic';
