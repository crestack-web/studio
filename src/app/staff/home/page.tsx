import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Logo } from '@/components/app/logo';

export default function StaffHomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
       <header className="flex items-center justify-between p-4 border-b bg-card">
        <Logo className="h-8" />
        <div className="text-sm font-medium text-muted-foreground">Staff Mode</div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
            <Link href="/record-sale">
                <Button className="w-full h-48 text-2xl font-headline flex-col gap-4">
                    <Plus className="w-12 h-12" />
                    Record a Sale
                </Button>
            </Link>
        </div>
      </main>
    </div>
  );
}
