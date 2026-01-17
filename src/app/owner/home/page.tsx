import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, BarChart, Users, BotMessageSquare } from 'lucide-react';
import { Logo } from '@/components/app/logo';

export default function OwnerHomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="flex items-center justify-between p-4 border-b">
        <Logo className="h-8" />
        <div className="text-sm font-medium">Owner</div>
      </header>
      <main className="flex-1 flex flex-col p-4 sm:p-6 gap-6 justify-center">
        <div className="w-full max-w-md mx-auto">
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline text-lg">
                <BotMessageSquare className="w-6 h-6 text-primary" />
                Ask about your business...
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Link href="/owner/ask">
                    <Input readOnly placeholder="e.g., How many sales today?" className="h-12 text-base cursor-pointer" />
                </Link>
            </CardContent>
          </Card>
        </div>

        <div className="w-full max-w-md mx-auto grid grid-cols-1 gap-4">
            <Link href="/record-sale">
                <Button className="w-full h-16 text-lg justify-start px-6 gap-4">
                    <Plus className="w-6 h-6" />
                    Record Sale
                </Button>
            </Link>
            <Link href="/owner/summary">
                <Button variant="secondary" className="w-full h-16 text-lg justify-start px-6 gap-4">
                    <BarChart className="w-6 h-6" />
                    View Today's Summary
                </Button>
            </Link>
            <Link href="/owner/staff">
                <Button variant="secondary" className="w-full h-16 text-lg justify-start px-6 gap-4">
                    <Users className="w-6 h-6" />
                    Add/View Staff
                </Button>
            </Link>
        </div>
      </main>
    </div>
  );
}
