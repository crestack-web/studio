import "../../globals.css"; // Ensure global styles including .btn are loaded
import React from "react";
import { Logo } from "@/components/app/logo";
import { Translator } from "./Translator";
import Link from "next/link";
import { MobileNav } from "./MobileNav";

export function Header() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-[68px] bg-white backdrop-blur border-b border-gray-200 flex items-center justify-between px-[5%] gap-6">
      {/* Logo */}
      <Link href="/" className="nav-logo flex items-center no-underline cursor-pointer">
        <Logo className="h-9" />
      </Link>
      {/* Desktop Navigation Links */}
      <ul className="nav-links hidden md:flex items-center gap-1 list-none">
        <li>
          <Link href="/" className="font-medium text-sm text-gray-600 px-3 py-2 rounded hover:text-purple-700 hover:bg-purple-50 transition">
            Home
          </Link>
        </li>
        <li>
          <Link href="/Seller" className="font-medium text-sm text-gray-600 px-3 py-2 rounded hover:text-purple-700 hover:bg-purple-50 transition">
            For Sellers
          </Link>
        </li>
        <li>
          <Link href="/Invest" className="font-medium text-sm text-gray-600 px-3 py-2 rounded hover:text-purple-700 hover:bg-purple-50 transition">
            Investors
          </Link>
        </li>
        <li>
          <Link
            href="/pricing"
            className="font-medium text-sm text-gray-600 px-3 py-2 rounded hover:text-purple-700 hover:bg-purple-50 transition"
          >
            Pricing
          </Link>
        </li>
      </ul>
      {/* Desktop Actions */}
      <div className="nav-actions hidden sm:flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
        <Link
          href="/login"
          className="btn btn-outline font-medium text-sm px-5 py-2 rounded-[10px] w-full sm:w-auto text-center"
        >
          Log In
        </Link>
        <Link
          href="/signup"
          className="btn btn-primary font-semibold text-sm px-6 py-2 rounded-[10px] w-full sm:w-auto text-center"
        >
          Start Free Trial
        </Link>
        <div className="relative w-full sm:w-auto mt-2 sm:mt-0 sm:ml-2 flex justify-center sm:justify-start">
          <Translator />
        </div>
      </div>
      {/* Mobile Nav */}
      <MobileNav />
    </nav>
  );
}