import {
  Activity,
  AlertTriangle,
  BotMessageSquare,
  Landmark,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Logo } from './logo';

export function DashboardMockup() {
  return (
    <div className="w-full h-full bg-background rounded-xl overflow-hidden shadow-2xl border-8 border-foreground/10">
      <div className="flex flex-col h-full">
        <header className="flex items-center justify-between p-3 border-b bg-card/80 shrink-0">
          <Logo className="h-6" />
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="font-semibold text-sm">Mama's Kitchen</div>
              <div className="text-xs text-muted-foreground">Owner</div>
            </div>
            <Avatar className="h-8 w-8">
              <AvatarFallback>MK</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex-1 p-4 overflow-y-auto bg-muted/20">
          <div className="grid grid-cols-3 gap-4">
            {/* Main Column */}
            <div className="col-span-2 flex flex-col gap-4">
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BotMessageSquare className="w-5 h-5 text-accent" />
                    Ask about your business
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="h-auto py-1.5 justify-start text-xs">Did I make profit today?</Button>
                  <Button variant="outline" size="sm" className="h-auto py-1.5 justify-start text-xs">How many sales today?</Button>
                  <Button variant="outline" size="sm" className="h-auto py-1.5 justify-start text-xs">Which product sells most?</Button>
                  <Button variant="outline" size="sm" className="h-auto py-1.5 justify-start text-xs">What product is running low?</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Activity className="w-5 h-5 text-primary" />
                    Business Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-center text-sm text-muted-foreground">
                  <p className="py-2">Record sales and expenses to see your summary.</p>
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar */}
            <div className="col-span-1 flex flex-col gap-4">
              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-accent" />
                    Business Forecast
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 text-center text-xs text-muted-foreground">
                  Record data for 7+ days to unlock trends.
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    Stock Alert
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 text-center text-xs text-muted-foreground">
                  No low-stock alerts yet.
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Landmark className="w-4 h-4 text-primary" />
                    Access Capital
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 text-center text-xs text-muted-foreground">
                  Keep recording to become eligible.
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
