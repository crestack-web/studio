"use client";
import { useState, useRef, useEffect } from "react";

// Simple language list, expand as needed
const languages = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "sw", label: "Swahili" },
];

export function Translator() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState("en");
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Placeholder: replace with real i18n logic as needed
  const handleSelect = (code: string) => {
    setLang(code);
    setOpen(false);
    // Add your translation logic here
  };

  return (
    <div className="relative ml-2" ref={ref}>
      <button
        aria-label="Select language"
        className="flex items-center gap-1 px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        {/* World SVG icon */}
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" stroke="currentColor" strokeWidth="2"/>
        </svg>
        <span className="font-semibold text-xs">{languages.find(l => l.code === lang)?.label}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow z-50">
          {languages.map((l) => (
            <button
              key={l.code}
              className={`block w-full text-left px-4 py-2 text-sm hover:bg-purple-50 dark:hover:bg-gray-700 ${
                lang === l.code ? "font-bold text-purple-700 dark:text-purple-400" : "text-gray-700 dark:text-gray-100"
              }`}
              onClick={() => handleSelect(l.code)}
              type="button"
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}