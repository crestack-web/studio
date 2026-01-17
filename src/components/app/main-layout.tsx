import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type MainLayoutProps = {
  children: React.ReactNode;
  title: string;
  backHref?: string;
};

export default function MainLayout({ children, title, backHref }: MainLayoutProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex items-center h-16 px-4 border-b bg-background">
        <Button variant="ghost" size="icon" className="h-10 w-10 mr-2" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back</span>
        </Button>
        <h1 className="text-xl font-headline font-semibold flex-1 text-center truncate pr-12">{title}</h1>
      </header>
      <main className="flex-1 flex flex-col items-center p-4 sm:p-6">{children}</main>
    </div>
  );
}
