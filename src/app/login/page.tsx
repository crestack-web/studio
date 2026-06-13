"use client";
import Link from "next/link";
import { User, Building } from "lucide-react";

export default function RoleSelectionPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#F4F4F8] to-[#E8E8F0] px-4">
      <div className="w-full max-w-sm space-y-5">
        <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col items-center">
          <div className="flex justify-center mb-3">
            <svg width="56" height="56" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="38" fill="#ffffff"></circle>
        <circle cx="40" cy="40" r="36" fill="none" stroke="#661db9" strokeWidth="1.5"></circle>
        <circle cx="40" cy="37" r="21" fill="#F5C9A0"></circle>
        <path d="M19 33 C19 19 61 19 61 33 L61 26 C61 14 19 14 19 26 Z" fill="#2C1A0E"></path>
        <ellipse cx="31" cy="36" rx="4" ry="4.5" fill="#1A2B3C"></ellipse>
        <ellipse cx="49" cy="36" rx="4" ry="4.5" fill="#1A2B3C"></ellipse>
        <circle cx="32.5" cy="34.5" r="1.5" fill="white"></circle>
        <circle cx="50.5" cy="34.5" r="1.5" fill="white"></circle>
        <path d="M30 43 Q40 50 50 43" stroke="#CC7A3A" strokeWidth="2" strokeLinecap="round" fill="none"></path>
        <ellipse cx="23" cy="41" rx="4" ry="2.5" fill="#F4A535" opacity="0.35"></ellipse>
        <ellipse cx="57" cy="41" rx="4" ry="2.5" fill="#F4A535" opacity="0.35"></ellipse>
        <ellipse cx="40" cy="65" rx="16" ry="7" fill="#661db9" opacity="0.9"></ellipse>
        <rect x="32" y="58" width="16" height="9" rx="5" fill="#F5C9A0"></rect>
        <polygon points="36,58 44,58 42,66 38,66" fill="#1DB954"></polygon>
      </svg>
          </div>
          <h2 className="text-xl font-bold font-headline text-[#0A0A0F] mb-1">Business Owner</h2>
          <p className="text-sm text-[#555568] mb-5 text-center">
            Manage your business, track performance, and sell online.
          </p>
          <div className="flex gap-3 w-full">
            <Link
              href="/login/form"
              className="flex-1 bg-[#6B3FE7] text-white font-semibold rounded-2xl h-11 flex items-center justify-center text-sm transition hover:bg-[#4B27B0]"
            >
              Log In
            <span className="ml-2"></span>
            </Link>
            <Link
              href="/welcome/signup"
              className="flex-1 border border-[#E8E8F0] text-[#6B3FE7] font-semibold rounded-2xl h-11 flex items-center justify-center text-sm transition hover:bg-[#F4F4F8]"
            >
              Sign Up
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col items-center">
          <div className="flex justify-center mb-3">
            <svg width="56" height="56" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="40" cy="40" r="38" fill="#ffffff"></circle>
              <circle cx="40" cy="40" r="36" fill="none" stroke="#1DB954" strokeWidth="1.5"></circle>
              {/* phone */}
              <rect x="46" y="22" width="22" height="36" rx="5" fill="#0D1B2A"></rect>
              <rect x="48" y="26" width="18" height="24" rx="3" fill="#071810"></rect>
              <circle cx="57" cy="56" r="2" fill="#1DB954"></circle>
              {/* check on phone */}
              <circle cx="57" cy="38" r="6" fill="rgba(29,185,84,0.2)" stroke="#1DB954" strokeWidth="1.2"></circle>
              <polyline points="53,38 56,41 61,34" stroke="#1DB954" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"></polyline>
              {/* Mo face */}
              <circle cx="30" cy="34" r="16" fill="#F5C9A0"></circle>
              <path d="M14 30 C14 20 46 20 46 30 L46 25 C46 16 14 16 14 25 Z" fill="#2C1A0E"></path>
              <circle cx="24" cy="33" r="3" fill="#1A2B3C"></circle>
              <circle cx="36" cy="33" r="3" fill="#1A2B3C"></circle>
              <circle cx="25" cy="31.8" r="1" fill="white"></circle>
              <circle cx="37" cy="31.8" r="1" fill="white"></circle>
              <path d="M24 39 Q30 44 36 39" stroke="#CC7A3A" strokeWidth="1.8" strokeLinecap="round" fill="none"></path>
              {/* headset */}
              <path d="M14 32 Q14 22 30 22 Q46 22 46 32" stroke="#162334" strokeWidth="3" strokeLinecap="round" fill="none"></path>
              <circle cx="14" cy="33" r="3.5" fill="#253A50"></circle>
              <circle cx="14" cy="33" r="2" fill="#1DB954"></circle>
              <circle cx="46" cy="33" r="3.5" fill="#253A50"></circle>
              <circle cx="46" cy="33" r="2" fill="#1DB954"></circle>
              {/* body */}
              <ellipse cx="30" cy="68" rx="12" ry="5" fill="#1DB954" opacity="0.8"></ellipse>
              <rect x="24" y="50" width="12" height="14" rx="4" fill="#F5C9A0"></rect>
              <polygon points="27,50 33,50 32,58 28,58" fill="#1DB954"></polygon>
            </svg>
          </div>
          <h2 className="text-xl font-bold font-headline text-[#0A0A0F] mb-1">Staff Member</h2>
          <p className="text-sm text-[#555568] mb-5 text-center">
            Log in to record sales and manage inventory for your employer.
          </p>
          <Link
            href="/login/staff"
            className="w-full bg-[#16A34A] text-white font-semibold rounded-2xl h-11 flex items-center justify-center text-sm transition hover:bg-[#12803A]"
          >
            Staff Log In
          </Link>
          <p className="text-xs text-center text-[#8888A0] mt-4">
            You must be invited by a business owner to log in as staff.
          </p>
        </div>
      </div>
    </div>
  );
}