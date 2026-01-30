'use client';

import {
  Activity,
  BotMessageSquare,
  FilePlus,
  Landmark,
  MousePointer2,
  PackagePlus,
  Plus,
  Store,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Logo } from './logo';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

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
];

const presetQuestions = [
    "Did I make profit today?",
    "How many sales today?",
];

export function DashboardMockup() {
  const [stepIndex, setStepIndex] = useState(0);
  const [showContent, setShowContent] = useState(true);
  const [cursorPosition, setCursorPosition] = useState({ top: -100, left: -100 });
  const [cursorVisible, setCursorVisible] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  
  const isMobile = useIsMobile();

  const currentStep = animationSteps[stepIndex];
  
  useEffect(() => {
    if (isMobile) return;
    
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
  }, [isMobile]);

  const MainColumn = (
    <div className="lg:col-span-2 flex flex-col gap-4">
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <BotMessageSquare className="w-5 h-5 text-accent" />
            Ask about your business
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 grid grid-cols-1 gap-2">
          {presetQuestions.map((q, i) => (
            <Button
              key={q}
              ref={(el) => (buttonRefs.current[i] = el)}
              variant="outline"
              size="sm"
              className={cn(
                "h-auto py-1.5 justify-start text-xs transition-colors duration-300",
                showContent && currentStep.question === q && !isMobile && "bg-accent/80 text-accent-foreground"
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
                showContent || isMobile ? 'opacity-100' : 'opacity-0',
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
        <CardContent className="p-4 pt-0 space-y-2">
          <div className="grid grid-cols-4 gap-2">
            <div className="space-y-0.5 rounded-md border p-2">
              <p className="text-xs text-muted-foreground">Revenue</p>
              <p className="text-sm font-bold">₦45,000</p>
            </div>
            <div className="space-y-0.5 rounded-md border p-2">
              <p className="text-xs text-muted-foreground">Profit</p>
              <p className="text-sm font-bold text-success">₦13,000</p>
            </div>
            <div className="space-y-0.5 rounded-md border p-2">
              <p className="text-xs text-muted-foreground">Sales</p>
              <p className="text-sm font-bold">18</p>
            </div>
            <div className="space-y-0.5 rounded-md border p-2">
              <p className="text-xs text-muted-foreground">Expenses</p>
              <p className="text-sm font-bold">₦5,200</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" className="w-full h-8 text-xs">
            <Activity className="mr-2 h-3 w-3" />
            View Full Statement
          </Button>
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
  );

  const SidebarColumn = (
     <div className="lg:col-span-1 flex flex-col gap-4">
      <Card>
        <CardHeader className="p-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Store className="w-4 h-4 text-primary" />
            Sell Online
          </CardTitle>
           <CardDescription className="text-xs">
            Set up your free online store on Busmo Market.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 pt-0">
            <Button variant="secondary" size="sm" className="w-full h-8 text-xs">
                Set Up Your Store
            </Button>
        </CardContent>
      </Card>
       <Card>
        <CardHeader className="p-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Landmark className="w-4 h-4 text-primary" />
            Access Capital
          </CardTitle>
          <CardDescription className="text-xs">
            Your business data can unlock investment.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 pt-0">
             <Button variant="secondary" size="sm" className="w-full h-8 text-xs">
                Explore Options
            </Button>
        </CardContent>
      </Card>
    </div>
  );


  return (
    <div ref={containerRef} className="relative w-full h-full bg-background rounded-xl overflow-hidden shadow-2xl border-8 border-foreground/10">
      <MousePointer2
        style={{
          top: cursorPosition.top,
          left: cursorPosition.left,
          opacity: cursorVisible && !isMobile ? 1 : 0,
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
      <main className="flex-1 p-4 overflow-y-auto bg-muted/20 relative">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
            {isMobile ? (
              <div className="lg:col-span-3 flex flex-col gap-4">
                  {MainColumn}
                  {SidebarColumn}
              </div>
            ) : (
              <>
                {MainColumn}
                {SidebarColumn}
              </>
            )}
        </div>
      </main>
    </div>
  );
}
