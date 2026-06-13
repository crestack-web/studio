'use client';

import { useParams } from 'next/navigation';
import { Navbar } from '../welcome/components/Navbar';
import { Footer } from '../welcome/components/Footer';
import { LangProvider } from '../owner/dashboard/LangContext';

export default function SlugPage() {
  return (
    <LangProvider>
      <SlugPageContent />
    </LangProvider>
  );
}

function SlugPageContent() {
  const params = useParams();
  const slug = params.slug as string;

  const handleNavigate = (page: string) => {
    if (page === 'home') {
      window.location.href = '/welcome';
    } else if (page === 'signup') {
      window.location.href = '/welcome/signup';
    } else if (page === 'login') {
      window.location.href = '/login';
    } else if (page === 'pricing') {
      window.location.href = '/pricing';
    } else if (page === 'seller') {
      window.location.href = '/Seller';
    } else if (page === 'invest') {
      window.location.href = '/invest';
    } else {
      window.location.href = `/${page}`;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar currentPage="home" onNavigate={handleNavigate} />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-4">Welcome to Busmo</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Page for: {slug}
        </p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">Get Started</h2>
            <p className="text-muted-foreground mb-4">
              Start your 3-day free trial today
            </p>
            <button 
              onClick={() => handleNavigate('signup')}
              className="btn-primary"
            >
              Start Free Trial
            </button>
          </div>
        </div>
      </main>
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
