"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/app/logo";
import { Translator } from "./Translator";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <div className="sm:hidden">
      <button
        aria-label="Open menu"
        className="p-2 rounded-md border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
        onClick={() => setOpen((v) => !v)}
      >
        {/* Hamburger icon */}
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
          <rect x="4" y="6" width="16" height="2" rx="1" fill="currentColor" />
          <rect x="4" y="11" width="16" height="2" rx="1" fill="currentColor" />
          <rect x="4" y="16" width="16" height="2" rx="1" fill="currentColor" />
        </svg>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setOpen(false)}>
          <nav
            className="absolute top-0 right-0 w-64 h-full bg-white shadow-lg flex flex-col p-6 gap-4 animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <Logo className="h-8" />
              <button
                aria-label="Close menu"
                className="p-2 rounded-md border border-gray-200 bg-white text-gray-700"
                onClick={() => setOpen(false)}
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <Link href="/" className="py-2 px-3 rounded text-gray-700 font-medium hover:bg-purple-50" onClick={() => setOpen(false)}>
              Home
            </Link>
            <Link href="/seller" className="py-2 px-3 rounded text-gray-700 font-medium hover:bg-purple-50" onClick={() => setOpen(false)}>
              For Sellers
            </Link>
            <Link href="/invest" className="py-2 px-3 rounded text-gray-700 font-medium hover:bg-purple-50" onClick={() => setOpen(false)}>
              Investors
            </Link>
            <Link href="/pricing" className="py-2 px-3 rounded text-gray-700 font-medium hover:bg-purple-50" onClick={() => setOpen(false)}>
              Pricing
            </Link>
            <Link href="/login" className="btn btn-outline font-medium text-sm px-5 py-2 rounded-[10px] w-full text-center mt-4" onClick={() => setOpen(false)}>
              Log In
            </Link>
            <Link href="/welcome/signup" className="btn btn-primary font-semibold text-sm px-6 py-2 rounded-[10px] w-full text-center" onClick={() => setOpen(false)}>
              Start Free Trial
            </Link>
            <div className="mt-4 flex justify-center">
              <Translator />
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
