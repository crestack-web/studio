'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function FinishSignInPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [message, setMessage] = useState('Verifying your login link...');

    useEffect(() => {
        // Simulate a verification process
        setMessage('This is a placeholder page for email link sign-in.');
    }, []);

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center space-y-4 text-center p-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-muted-foreground">{message}</p>
            <p className="text-sm text-muted-foreground">
                In a real app, this page would handle the sign-in logic.
            </p>
            <Button asChild variant="outline">
                <Link href="/login">Return to Login</Link>
            </Button>
        </div>
    );
}
