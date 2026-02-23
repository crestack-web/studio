import { Logo } from '@/components/app/logo';
import { Instagram, Facebook } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-black text-white py-12">
      <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-3 gap-8 items-center">
        <div className="flex flex-col items-center md:items-start">
          <Logo className="h-8 mb-2" />
          <div className="text-gray-400 text-sm">Built for the heart of African commerce. Clarity for every business owner.</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="font-bold mb-2">Platform</div>
          <div className="flex flex-wrap gap-4 text-gray-400 text-sm">
            <a href="#" className="hover:underline">Home</a>
            <a href="#" className="hover:underline">Pricing</a>
            <a href="#" className="hover:underline">Sell Online</a>
            <a href="#" className="hover:underline">For Investors</a>
          </div>
        </div>
        <div className="flex flex-col items-center md:items-end gap-2">
          <div className="flex gap-4">
            <a href="https://instagram.com/busmo.io" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <Instagram className="h-5 w-5 text-gray-400 hover:text-white" />
            </a>
            <a href="https://facebook.com/busmo.io" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <Facebook className="h-5 w-5 text-gray-400 hover:text-white" />
            </a>
          </div>
          <div className="text-xs text-gray-500 mt-2">&copy; {new Date().getFullYear()} Busmo. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}