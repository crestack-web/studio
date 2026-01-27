'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/app/logo';
import { useAuth } from '@/firebase';
import { sendSignInLinkToEmail } from 'firebase/auth';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const { toast } = useToast();
  const auth = useAuth();

  const actionCodeSettings = {
    url: `${window.location.origin}/admin/finish-signin`, // URL to redirect to after email verification
    handleCodeInApp: true,
  };

  const handleSendLink = async () => {
    setIsLoading(true);
    try {
      window.localStorage.setItem('emailForSignIn', email);
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      setIsEmailSent(true);
      toast({
          title: "Check your email",
          description: `A sign-in link has been sent to ${email}.`,
      });
    } catch(error: any) {
      let description = "Could not send login link. Please check the email and try again.";
      if (error.code === 'auth/invalid-email') {
          description = 'Please enter a valid email address.';
      }
      toast({
          variant: "destructive",
          title: "Login Failed",
          description: description,
      });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-col min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center">
          <Logo className="h-10" />
        </div>
        <Card className="w-full">
            <CardHeader className="text-center">
            <CardTitle className="text-2xl font-headline">Admin Panel</CardTitle>
            <CardDescription>
              {isEmailSent 
                ? "A login link has been sent to your email address." 
                : "Enter your email to receive a secure login link."}
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
            {isEmailSent ? (
               <div className="text-center text-muted-foreground">
                  <p>Click the link in the email to complete your sign-in. You can close this tab.</p>
               </div>
            ) : (
              <>
                <div className="space-y-2">
                    <Label htmlFor="email">Admin Email Address</Label>
                    <Input id="email" type="email" placeholder="admin@busmo.com" className="h-12 text-base" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
                </div>
                <Button className="w-full h-14 text-lg" onClick={handleSendLink} disabled={isLoading || !email}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Login Link
                </Button>
              </>
            )}
            </CardContent>
        </Card>
      </div>
    </main>
  );
}
