import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFunctionUrl } from '@/lib/api';

export default function StaffLoginPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendOtp = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(getFunctionUrl('sendOtpLogin'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: 'Staff' }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to send OTP');
      setStep('otp');
      toast({ title: 'OTP Sent', description: 'Check your email for the one-time code.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to send OTP.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(getFunctionUrl('verifyOtpLogin'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Invalid OTP');
      toast({ title: 'Login Successful', description: 'You are now logged in.' });
      // TODO: Redirect to staff dashboard or set session
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'OTP verification failed.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-col min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-headline">Staff Login</CardTitle>
            <CardDescription>Sign in with a one-time code sent to your email.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 'email' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Staff Email Address</Label>
                  <Input id="email" type="email" placeholder="staff@busmo.com" className="h-12 text-base" value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} />
                </div>
                <Button className="w-full h-14 text-lg" onClick={handleSendOtp} disabled={isLoading || !email}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Send OTP
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="otp">Enter OTP</Label>
                  <Input id="otp" type="text" placeholder="6-digit code" className="h-12 text-base" value={otp} onChange={e => setOtp(e.target.value)} disabled={isLoading} />
                </div>
                <Button className="w-full h-14 text-lg" onClick={handleVerifyOtp} disabled={isLoading || !otp}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Verify OTP
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
