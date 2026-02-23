"use client";
import "../globals.css";
import React, { useState } from "react";
import { Header } from "../welcome/components/Header";
import { Footer } from "../welcome/components/Footer";

const prices = {
  monthly: { shop: "₦1,000", super: "₦10,000", branch: "₦30,000", company: "₦50,000" },
  yearly: { shop: "₦830", super: "₦8,300", branch: "₦24,900", company: "₦41,500" }
};
const yearlyNote = {
  shop: "Billed ₦9,960/yr — save ₦2,040",
  super: "Billed ₦99,600/yr — save ₦20,400",
  branch: "Billed ₦298,800/yr — save ₦61,200",
  company: "Billed ₦498,000/yr — save ₦102,000"
};

export default function PricingPage() {
  const [mode, setMode] = useState<"monthly" | "yearly">("monthly");

  return (
    <>
      <Header />
      <main className="pt-[68px] bg-white text-[#0A0A0F] min-h-screen">
        {/* Hero */}
        <section className="text-center px-[5%] pt-16 pb-12 bg-gradient-to-b from-[#6B3FE710] via-transparent to-transparent">
          <div className="uppercase text-[0.78rem] font-bold tracking-[0.08em] text-[#6B3FE7] mb-3">Simple, Transparent Pricing</div>
          <h1 className="font-display text-[clamp(2rem,4vw,3rem)] font-extrabold text-[#0A0A0F] mb-3 leading-tight">
            Find the Perfect Plan<br />for Your Business
          </h1>
          <p className="text-[#555568] text-base max-w-[500px] mx-auto mb-8">
            All plans start with a 14-day free trial. No credit card required. Cancel anytime.
          </p>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="inline-flex items-center gap-0 bg-[#F4F4F8] rounded-[10px] p-1">
              <button
                className={`font-body text-[0.875rem] font-medium px-5 py-2 rounded-[8px] transition-all ${
                  mode === "monthly"
                    ? "bg-white text-[#6B3FE7] font-semibold shadow"
                    : "bg-transparent text-[#8888A0]"
                }`}
                onClick={() => setMode("monthly")}
                type="button"
              >
                Monthly
              </button>
              <button
                className={`font-body text-[0.875rem] font-medium px-5 py-2 rounded-[8px] transition-all ${
                  mode === "yearly"
                    ? "bg-white text-[#6B3FE7] font-semibold shadow"
                    : "bg-transparent text-[#8888A0]"
                }`}
                onClick={() => setMode("yearly")}
                type="button"
              >
                Yearly
              </button>
            </div>
            {mode === "yearly" && (
              <span className="inline-flex items-center gap-1 bg-[#DCFCE7] text-[#16A34A] text-[0.75rem] font-bold px-3 py-1 rounded-full ml-2">
                Save 17%
              </span>
            )}
          </div>
        </section>

        {/* Plans */}
        <section className="max-w-[1200px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 px-[5%] pb-20">
          {/* SHOP */}
          <div className="border border-[#E8E8F0] rounded-[24px] bg-white p-7 pt-8 relative transition hover:-translate-y-1 hover:shadow-lg">
            <div className="font-display text-[1.1rem] font-bold text-[#0A0A0F] mb-1">Shop</div>
            <div className="text-[0.8rem] text-[#8888A0] mb-5">For small retailers</div>
            <div className="mb-2">
              <span className="font-display text-2xl font-extrabold text-[#0A0A0F]">{prices[mode].shop}</span>
              <span className="text-[0.8rem] text-[#8888A0]">/ month</span>
            </div>
            <div className="text-[#16A34A] text-[0.78rem] mb-6 min-h-[20px]">{mode === "yearly" ? yearlyNote.shop : ""}</div>
            <hr className="border-t border-[#E8E8F0] my-5" />
            <div className="text-[0.72rem] font-bold uppercase tracking-wide text-[#8888A0] mb-3">What's included</div>
            <ul className="mb-4 text-[0.83rem]">
              <li className="flex items-start gap-2 text-[#555568] py-1"><span className="text-[#16A34A]">✓</span> Record Sales, Expenses & Inventory</li>
              <li className="flex items-start gap-2 text-[#555568] py-1"><span className="text-[#16A34A]">✓</span> Basic AI Insights</li>
              <li className="flex items-start gap-2 text-[#555568] py-1"><span className="text-[#16A34A]">✓</span> Sell on Busmo Market</li>
              <li className="flex items-start gap-2 text-[#16A34A] py-1"><span className="text-[#16A34A]">✓</span> Manage Staff</li>
              <li className="flex items-start gap-2 text-[#8888A0] py-1 line-through"><span className="text-[#DC2626]">✗</span> Advanced Forecasting</li>
              <li className="flex items-start gap-2 text-[#8888A0] py-1 line-through"><span className="text-[#DC2626]">✗</span> Multiple Branches</li>
              <li className="flex items-start gap-2 text-[#8888A0] py-1 line-through"><span className="text-[#DC2626]">✗</span> Production Tracking</li>
              <li className="flex items-start gap-2 text-[#8888A0] py-1 line-through"><span className="text-[#DC2626]">✗</span> Access to Equity Investment</li>
            </ul>
            <button
              className="plan-cta-btn w-full mt-6 font-body text-[0.9rem] font-semibold py-3 rounded-[10px] border border-[#E8E8F0] bg-none text-[#0A0A0F] transition hover:border-[#6B3FE7] hover:text-[#6B3FE7]"
              onClick={() => (window.location = "/signup")}
            >
              Start Free Trial
            </button>
          </div>

          {/* SUPERMARKET */}
          <div className="border-2 border-[#6B3FE7] rounded-[24px] bg-white p-7 pt-8 relative shadow transition hover:-translate-y-1 hover:shadow-lg popular">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#6B3FE7] text-white text-[0.72rem] font-bold px-4 py-1 rounded-full whitespace-nowrap shadow">Most Popular</div>
            <div className="font-display text-[1.1rem] font-bold text-[#0A0A0F] mb-1 mt-3">Supermarket</div>
            <div className="text-[0.8rem] text-[#8888A0] mb-5">For larger stores & growing businesses</div>
            <div className="mb-2">
              <span className="font-display text-2xl font-extrabold text-[#0A0A0F]">{prices[mode].super}</span>
              <span className="text-[0.8rem] text-[#8888A0]">/ month</span>
            </div>
            <div className="text-[#16A34A] text-[0.78rem] mb-6 min-h-[20px]">{mode === "yearly" ? yearlyNote.super : ""}</div>
            <hr className="border-t border-[#E8E8F0] my-5" />
            <div className="text-[0.72rem] font-bold uppercase tracking-wide text-[#8888A0] mb-3">Everything in Shop, plus</div>
            <ul className="mb-4 text-[0.83rem]">
              <li className="flex items-start gap-2 text-[#555568] py-1"><span className="text-[#16A34A]">✓</span> Up to 5 Staff Members</li>
              <li className="flex items-start gap-2 text-[#555568] py-1"><span className="text-[#16A34A]">✓</span> Advanced Forecasting</li>
              <li className="flex items-start gap-2 text-[#555568] py-1"><span className="text-[#16A34A]">✓</span> Multiple Branches</li>
              <li className="flex items-start gap-2 text-[#8888A0] py-1 line-through"><span className="text-[#DC2626]">✗</span> Production Tracking</li>
              <li className="flex items-start gap-2 text-[#8888A0] py-1 line-through"><span className="text-[#DC2626]">✗</span> Access to Equity Investment</li>
            </ul>
            <button
              className="plan-cta-btn w-full mt-6 font-body text-[0.9rem] font-semibold py-3 rounded-[10px] border border-[#6B3FE7] bg-[#6B3FE7] text-white transition hover:bg-[#4B24C1]"
              onClick={() => (window.location = "/signup")}
            >
              Start Free Trial
            </button>
          </div>

          {/* MULTIPLE BRANCHES */}
          <div className="border border-[#E8E8F0] rounded-[24px] bg-white p-7 pt-8 relative transition hover:-translate-y-1 hover:shadow-lg">
            <div className="font-display text-[1.1rem] font-bold text-[#0A0A0F] mb-1">Multiple Branches</div>
            <div className="text-[0.8rem] text-[#8888A0] mb-5">For chains & franchises</div>
            <div className="mb-2">
              <span className="font-display text-2xl font-extrabold text-[#0A0A0F]">{prices[mode].branch}</span>
              <span className="text-[0.8rem] text-[#8888A0]">/ month</span>
            </div>
            <div className="text-[#16A34A] text-[0.78rem] mb-6 min-h-[20px]">{mode === "yearly" ? yearlyNote.branch : ""}</div>
            <hr className="border-t border-[#E8E8F0] my-5" />
            <div className="text-[0.72rem] font-bold uppercase tracking-wide text-[#8888A0] mb-3">Everything in Supermarket, plus</div>
            <ul className="mb-4 text-[0.83rem]">
              <li className="flex items-start gap-2 text-[#555568] py-1"><span className="text-[#16A34A]">✓</span> Unlimited Staff Members</li>
              <li className="flex items-start gap-2 text-[#555568] py-1"><span className="text-[#16A34A]">✓</span> Manage Multiple Branches</li>
              <li className="flex items-start gap-2 text-[#8888A0] py-1 line-through"><span className="text-[#DC2626]">✗</span> Production Tracking</li>
              <li className="flex items-start gap-2 text-[#8888A0] py-1 line-through"><span className="text-[#DC2626]">✗</span> Access to Equity Investment</li>
            </ul>
            <button
              className="plan-cta-btn w-full mt-6 font-body text-[0.9rem] font-semibold py-3 rounded-[10px] border border-[#E8E8F0] bg-none text-[#0A0A0F] transition hover:border-[#6B3FE7] hover:text-[#6B3FE7]"
              onClick={() => (window.location = "/signup")}
            >
              Start Free Trial
            </button>
          </div>

          {/* COMPANY */}
          <div className="border border-[#E8E8F0] rounded-[24px] bg-white p-7 pt-8 relative transition hover:-translate-y-1 hover:shadow-lg">
            <div className="font-display text-[1.1rem] font-bold text-[#0A0A0F] mb-1">Company</div>
            <div className="text-[0.8rem] text-[#8888A0] mb-5">For manufacturers & corporations</div>
            <div className="mb-2">
              <span className="font-display text-2xl font-extrabold text-[#0A0A0F]">{prices[mode].company}</span>
              <span className="text-[0.8rem] text-[#8888A0]">/ month</span>
            </div>
            <div className="text-[#16A34A] text-[0.78rem] mb-6 min-h-[20px]">{mode === "yearly" ? yearlyNote.company : ""}</div>
            <hr className="border-t border-[#E8E8F0] my-5" />
            <div className="text-[0.72rem] font-bold uppercase tracking-wide text-[#8888A0] mb-3">Everything in Branches, plus</div>
            <ul className="mb-4 text-[0.83rem]">
              <li className="flex items-start gap-2 text-[#555568] py-1"><span className="text-[#16A34A]">✓</span> Production Tracking (Cost of Goods)</li>
              <li className="flex items-start gap-2 text-[#555568] py-1"><span className="text-[#16A34A]">✓</span> Access to Equity Investment</li>
            </ul>
            <button
              className="plan-cta-btn w-full mt-6 font-body text-[0.9rem] font-semibold py-3 rounded-[10px] border border-[#E8E8F0] bg-none text-[#0A0A0F] transition hover:border-[#6B3FE7] hover:text-[#6B3FE7]"
              onClick={() => (window.location = "/signup")}
            >
              Start Free Trial
            </button>
          </div>
        </section>

        {/* Enterprise CTA */}
        <section className="bg-[#FAFAFC] border border-[#E8E8F0] rounded-[24px] max-w-[1160px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 py-7 px-8 mb-20 mt-0">
          <div>
            <h3 className="font-display text-[1.2rem] font-bold text-[#0A0A0F] mb-1">Custom Needs?</h3>
            <p className="text-[0.875rem] text-[#555568]">
              For custom integrations, dedicated support, or enterprise deployments — let's talk.
            </p>
          </div>
          <button className="btn-primary font-body text-[0.875rem] font-semibold px-6 py-3 rounded-[10px] mt-2 md:mt-0">
            Contact Sales
          </button>
        </section>
      </main>
      <Footer />
    </>
  );
}