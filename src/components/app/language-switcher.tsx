'use client';

import { useLanguage } from '@/context/language-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Languages } from 'lucide-react';

const languages = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
];

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();
  const currentCode = (language || 'en').toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Languages className="h-5 w-5" />
          <span className="absolute bottom-0.5 right-0.5 text-[10px] font-semibold leading-none text-muted-foreground">
            {currentCode}
          </span>
          <span className="sr-only">{t('language.change')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={language === lang.code ? 'font-bold' : ''}
          >
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
