'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function RecordSalePage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleConfirmSale = () => {
    toast({
      title: "Sale Recorded",
      description: "The sale has been saved successfully.",
    });
    router.back();
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex items-center h-16 px-4 border-b bg-background">
        <Button variant="ghost" size="icon" className="h-10 w-10 mr-2" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back</span>
        </Button>
        <h1 className="text-xl font-headline font-semibold flex-1 text-center pr-12">Record Sale</h1>
      </header>
      <main className="flex-1 flex flex-col p-4 sm:p-6 items-center">
        <div className="w-full max-w-md space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>New Sale</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input id="amount" type="number" placeholder="0.00" className="h-16 text-3xl font-bold text-right" />
              </div>

              <div className="space-y-3">
                <Label>Payment Type</Label>
                <RadioGroup defaultValue="cash" className="grid grid-cols-3 gap-2">
                  <div>
                    <RadioGroupItem value="cash" id="cash" className="peer sr-only" />
                    <Label htmlFor="cash" className="flex h-12 items-center justify-center rounded-md border-2 border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                      Cash
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="transfer" id="transfer" className="peer sr-only" />
                    <Label htmlFor="transfer" className="flex h-12 items-center justify-center rounded-md border-2 border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                      Transfer
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="pos" id="pos" className="peer sr-only" />
                    <Label htmlFor="pos" className="flex h-12 items-center justify-center rounded-md border-2 border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                      POS
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
          
          <Button onClick={handleConfirmSale} className="w-full h-16 text-xl bg-accent text-accent-foreground hover:bg-accent/90">
            <Check className="mr-2 h-6 w-6" />
            Confirm Sale
          </Button>
        </div>
      </main>
    </div>
  );
}
