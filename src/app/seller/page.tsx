import React from "react";
import { Header } from "@/app/welcome/components/Header";

export default function SellerPage() {
  return (
    <>
      <Header />
      <main className="pt-[68px] bg-white">
        {/* Seller Hero Section */}
        <section className="seller-hero flex flex-col md:flex-row items-center justify-center gap-16 px-[5%] py-24 bg-gradient-to-br from-green-50/60 to-white text-center md:text-left">
          {/* Picture space */}
          <div className="w-full md:w-1/2 flex justify-center md:justify-end mb-10 md:mb-0">
            {/* Large image, fully visible, rounded corners */}
            <img
              src="/sell-hero.png"
              alt="Your Storefront"
              className="w-[440px] h-[440px] md:w-[520px] md:h-[520px] rounded-3xl bg-transparent"
              style={{ objectFit: "contain", background: "transparent" }}
            />
          </div>
          {/* Content */}
          <div className="w-full md:w-1/2 flex flex-col items-center md:items-start">
            <div className="seller-badge mb-5 text-base font-semibold bg-purple-50 text-purple-700 px-4 py-1 rounded-full shadow-sm">
              🛍️ Seller Central
            </div>
            <h1 className="font-display font-extrabold text-4xl md:text-5xl text-black mb-6 leading-tight">
              Your Storefront.<br />
              Your Customers.<br />
              <span className="text-purple-700">Your Growth.</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-lg">
              Launch your free online storefront on Busmo Market. List products, accept payments, and offer BusmoGo delivery — all from one place.
            </p>
            <div className="flex gap-5 flex-wrap justify-center md:justify-start mb-4">
              <a
                href="/signup"
                className="btn-primary btn-large font-semibold text-base px-8 py-3 rounded-xl bg-purple-700 text-white shadow hover:bg-purple-800 transition"
              >
                Sign Up
              </a>
              <a
                href="/login"
                className="btn-outline-large font-semibold text-base px-8 py-3 rounded-xl border border-purple-700 text-purple-700 bg-white hover:bg-purple-50 transition"
              >
                Log In
              </a>
            </div>
            <div className="mt-2 text-sm text-gray-400">
              Start selling today — it’s free to join
            </div>
          </div>
        </section>

        {/* Seller Features Grid */}
        <section className="seller-features-grid max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 py-20 px-4">
          <div className="seller-feat-card bg-white rounded-2xl shadow p-8 flex flex-col items-center text-center">
            <div className="seller-feat-icon text-3xl mb-3">🏬</div>
            <div className="seller-feat-title font-bold text-lg mb-2">Storefront</div>
            <div className="seller-feat-desc text-gray-600">
              A trusted store page customers can browse and buy from. Professional, fast, and built for conversions.
            </div>
          </div>
          <div className="seller-feat-card bg-white rounded-2xl shadow p-8 flex flex-col items-center text-center">
            <div className="seller-feat-icon text-3xl mb-3">📋</div>
            <div className="seller-feat-title font-bold text-lg mb-2">Product Listings</div>
            <div className="seller-feat-desc text-gray-600">
              List products, update pricing, and keep your catalog fresh. Changes reflect instantly for customers.
            </div>
          </div>
          <div className="seller-feat-card bg-white rounded-2xl shadow p-8 flex flex-col items-center text-center">
            <div className="seller-feat-icon text-3xl mb-3">📦</div>
            <div className="seller-feat-title font-bold text-lg mb-2">Order Management</div>
            <div className="seller-feat-desc text-gray-600">
              Track incoming orders and manage fulfillment with full clarity. Know exactly what's pending and what's done.
            </div>
          </div>
          <div className="seller-feat-card bg-white rounded-2xl shadow p-8 flex flex-col items-center text-center">
            <div className="seller-feat-icon text-3xl mb-3">💳</div>
            <div className="seller-feat-title font-bold text-lg mb-2">BusmoPay Checkout</div>
            <div className="seller-feat-desc text-gray-600">
              Integrated marketplace checkout that handles payments securely on your behalf.
            </div>
          </div>
          <div className="seller-feat-card bg-white rounded-2xl shadow p-8 flex flex-col items-center text-center">
            <div className="seller-feat-icon text-3xl mb-3">💰</div>
            <div className="seller-feat-title font-bold text-lg mb-2">Payout Tracking</div>
            <div className="seller-feat-desc text-gray-600">
              Understand your payouts and cash flow clearly so you can plan and grow confidently.
            </div>
          </div>
          <div className="seller-feat-card bg-white rounded-2xl shadow p-8 flex flex-col items-center text-center">
            <div className="seller-feat-icon text-3xl mb-3">🚚</div>
            <div className="seller-feat-title font-bold text-lg mb-2">BusmoGo Delivery</div>
            <div className="seller-feat-desc text-gray-600">
              Offer delivery options with the BusmoGo logistics network built into every order at checkout.
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="how-it-works-section bg-gray-50 py-24">
          <div className="max-w-5xl mx-auto">
            <div className="section-head center mb-14">
              <div className="section-label text-purple-700 font-semibold mb-2">How It Works</div>
              <h2 className="section-title font-display font-extrabold text-3xl md:text-4xl mb-2">
                Go live fast.<br />
                <em className="not-italic text-purple-700">Sell more.</em>
              </h2>
            </div>
            <div className="steps-row grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="step-item bg-white rounded-2xl shadow p-8 flex flex-col items-center text-center">
                <div className="step-num text-2xl font-bold text-purple-700 mb-2">1</div>
                <div className="step-title font-semibold mb-1">Create your account</div>
                <div className="step-desc text-gray-600">Sign up and set up your seller profile in minutes</div>
              </div>
              <div className="step-item bg-white rounded-2xl shadow p-8 flex flex-col items-center text-center">
                <div className="step-num text-2xl font-bold text-purple-700 mb-2">2</div>
                <div className="step-title font-semibold mb-1">Add your products</div>
                <div className="step-desc text-gray-600">Create listings and keep your catalog updated</div>
              </div>
              <div className="step-item bg-white rounded-2xl shadow p-8 flex flex-col items-center text-center">
                <div className="step-num text-2xl font-bold text-purple-700 mb-2">3</div>
                <div className="step-title font-semibold mb-1">Activate storefront</div>
                <div className="step-desc text-gray-600">Turn your store on and start accepting orders</div>
              </div>
              <div className="step-item bg-white rounded-2xl shadow p-8 flex flex-col items-center text-center">
                <div className="step-num text-2xl font-bold text-purple-700 mb-2">4</div>
                <div className="step-title font-semibold mb-1">Deliver & get paid</div>
                <div className="step-desc text-gray-600">Fulfill orders, offer delivery, and track payouts</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="cta-banner bg-purple-700 text-white text-center py-20 px-[5%]">
          <h2 className="font-display font-extrabold text-2xl md:text-4xl mb-3">
            Ready to Start Selling?
          </h2>
          <p className="mb-8 text-lg text-purple-100">
            Join Busmo Market and be among the first sellers to go live.
          </p>
          <div>
            <a
              href="/signup"
              className="btn-white font-semibold text-base px-8 py-4 rounded-xl bg-white text-purple-700 shadow hover:bg-purple-100 transition"
            >
              Sign Up
            </a>
            <a
              href="/login"
              className="btn-outline-large ml-4 font-semibold text-base px-8 py-4 rounded-xl border border-white text-white bg-transparent hover:bg-purple-800 transition"
            >
              Log In
            </a>
          </div>
        </section>
      </main>
    </>
  );
}