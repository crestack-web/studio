'use client';

import {
  Activity,
  AlertTriangle,
  BotMessageSquare,
  FilePlus,
  Landmark,
  MousePointer2,
  PackagePlus,
  Plus,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Logo } from './logo';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

const animationSteps = [
  {
    question: "Did I make profit today?",
    answer: "Yes, your net profit today is ₦13,000.",
    type: 'profit',
  },
  {
    question: "How many sales today?",
    answer: "You've made 18 sales today for a total of ₦45,000.",
    type: 'sales',
  },
    {
    question: "What product is running low?",
    answer: "Bottled Water is running low. You have 5 units left.",
    type: 'stock',
  },
];

const presetQuestions = [
    "Did I make profit today?",
    "How many sales today?",
    "Which product sells the most?",
    "What product is running low?",
];

export function DashboardMockup() {
  const [stepIndex, setStepIndex] = useState(0);
  const [showContent, setShowContent] = useState(true);
  const [cursorPosition, setCursorPosition] = useState({ top: -100, left: -100 });
  const [cursorVisible, setCursorVisible] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const currentStep = animationSteps[stepIndex];
  
  useEffect(() => {
    buttonRefs.current = buttonRefs.current.slice(0, presetQuestions.length);
    const container = containerRef.current;
    let timeouts: NodeJS.Timeout[] = [];

    const clearTimeouts = () => {
        timeouts.forEach(clearTimeout);
        timeouts = [];
    };

    const runAnimation = (index: number) => {
        if (!container) return;
        
        const animationStepIndex = index % animationSteps.length;
        const currentAnimationStep = animationSteps[animationStepIndex];
        const buttonIndex = presetQuestions.findIndex(q => q === currentAnimationStep.question);
        
        if (buttonIndex === -1) {
            timeouts.push(setTimeout(() => runAnimation(index + 1), 100));
            return;
        }

        const button = buttonRefs.current[buttonIndex];
        if (!button) {
            timeouts.push(setTimeout(() => runAnimation(index), 100));
            return;
        }

        const containerRect = container.getBoundingClientRect();
        const buttonRect = button.getBoundingClientRect();
        
        const targetTop = buttonRect.top - containerRect.top + buttonRect.height / 2;
        const targetLeft = buttonRect.left - containerRect.left + buttonRect.width / 2;
        
        setShowContent(false);
        setCursorPosition({ top: targetTop, left: targetLeft });
        setCursorVisible(true);

        timeouts.push(setTimeout(() => {
            setIsClicking(true);
            setStepIndex(animationStepIndex);

            timeouts.push(setTimeout(() => {
                setShowContent(true);
                setIsClicking(false);

                timeouts.push(setTimeout(() => {
                    setCursorVisible(false);
                    timeouts.push(setTimeout(() => runAnimation(index + 1), 1000));
                }, 2500));
            }, 200));
        }, 700));
    };

    timeouts.push(setTimeout(() => runAnimation(0), 1500));

    return clearTimeouts;
  }, []);


  return (
    <div ref={containerRef} className="relative w-full h-full bg-background rounded-xl overflow-hidden shadow-2xl border-8 border-foreground/10">
      <MousePointer2
        style={{
          top: cursorPosition.top,
          left: cursorPosition.left,
          opacity: cursorVisible ? 1 : 0,
          transform: `scale(${isClicking ? 0.9 : 1}) rotate(-15deg)`,
        }}
        className="absolute text-foreground transition-all duration-500 ease-in-out z-50 pointer-events-none h-5 w-5 -translate-x-1 -translate-y-1"
      />
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Column */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BotMessageSquare className="w-5 h-5 text-accent" />
                  Ask about your business
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 grid grid-cols-2 gap-2">
                {presetQuestions.map((q, i) => (
                  <Button
                    key={q}
                    ref={(el) => (buttonRefs.current[i] = el)}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-auto py-1.5 justify-start text-xs transition-colors duration-300",
                      showContent && currentStep.question === q && "bg-accent/80 text-accent-foreground"
                    )}
                  >
                    {q}
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-muted/50 min-h-[50px] flex items-center">
               <CardContent className="p-3 w-full">
                  <p className={cn(
                      "text-sm font-medium text-foreground transition-opacity duration-300",
                      showContent ? 'opacity-100' : 'opacity-0',
                      currentStep.type === 'profit' && 'text-success',
                      currentStep.type === 'stock' && 'text-warning'
                  )}>
                      {currentStep.answer}
                  </p>
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

             <div className="grid grid-cols-3 gap-2">
              <Button variant="default" size="sm" className="h-auto p-2 flex-col gap-1 text-xs h-14">
                <Plus className="w-4 h-4" />
                <span>Record Sale</span>
              </Button>
              <Button variant="secondary" size="sm" className="h-auto p-2 flex-col gap-1 text-xs h-14">
                <PackagePlus className="w-4 h-4" />
                <span>Add Inventory</span>
              </Button>
              <Button variant="secondary" size="sm" className="h-auto p-2 flex-col gap-1 text-xs h-14">
                <FilePlus className="w-4 h-4" />
                <span>Record Expense</span>
              </Button>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 flex flex-col gap-4">
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
              <CardContent className="p-3 pt-0 text-center text-xs text-muted-foreground relative h-8">
                   <p className={cn("absolute inset-0 flex items-center justify-center transition-opacity duration-500", showContent && currentStep.type === 'stock' ? 'opacity-100 text-warning font-medium' : 'opacity-0')}>
                      {currentStep.type === 'stock' ? 'Bottled Water: 5 left' : ''}
                  </p>
                   <p className={cn("absolute inset-0 flex items-center justify-center transition-opacity duration-500", showContent && currentStep.type === 'stock' ? 'opacity-0' : 'opacity-100')}>
                      No low-stock alerts yet.
                  </p>
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
  );
}
