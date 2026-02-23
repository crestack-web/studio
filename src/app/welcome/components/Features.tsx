import { ShoppingCart, Package, DollarSign, Bot, LineChart, Users } from 'lucide-react';

export function Features() {
  return (
    <section className="bg-gray-50 py-16">
      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-12 text-center">
          <div className="text-xs font-bold uppercase text-purple-700 mb-2">Platform Features</div>
          <h2 className="font-headline text-3xl sm:text-4xl font-extrabold mb-3">
            Everything you need.<br /><em className="not-italic text-purple-700">Nothing you don't.</em>
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Busmo is built for the reality of your business — simple, fast, and offline-first.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          <div className="feat-card bg-white border border-gray-200 rounded-2xl p-6 shadow flex flex-col items-start">
            <div className="feat-icon bg-purple-100 p-3 rounded-full mb-3">
              <ShoppingCart className="w-7 h-7 text-purple-700" />
            </div>
            <div className="feat-title font-bold mb-1">Record Sales the Right Way</div>
            <div className="feat-desc text-sm mb-2">
              See exactly what was sold, track quantity and profit per product, and understand which items actually make you money. Record a sale in seconds — even offline.
            </div>
            <span className="feat-tag bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-semibold">Offline-first</span>
          </div>
          <div className="feat-card bg-white border border-gray-200 rounded-2xl p-6 shadow flex flex-col items-start">
            <div className="feat-icon bg-purple-100 p-3 rounded-full mb-3">
              <Package className="w-7 h-7 text-purple-700" />
            </div>
            <div className="feat-title font-bold mb-1">Track Inventory</div>
            <div className="feat-desc text-sm mb-2">
              Monitor your stock levels, know when to reorder, and never run out of your best sellers. Inventory management made simple.
            </div>
            <span className="feat-tag bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-semibold">Inventory</span>
          </div>
          <div className="feat-card bg-white border border-gray-200 rounded-2xl p-6 shadow flex flex-col items-start">
            <div className="feat-icon bg-purple-100 p-3 rounded-full mb-3">
              <DollarSign className="w-7 h-7 text-purple-700" />
            </div>
            <div className="feat-title font-bold mb-1">See Your Profit Clearly</div>
            <div className="feat-desc text-sm mb-2">
              Instantly know your daily, weekly, and monthly profit. No more guesswork—just clear numbers.
            </div>
            <span className="feat-tag bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-semibold">Profit Tracking</span>
          </div>
          <div className="feat-card bg-white border border-gray-200 rounded-2xl p-6 shadow flex flex-col items-start">
            <div className="feat-icon bg-purple-100 p-3 rounded-full mb-3">
              <Bot className="w-7 h-7 text-purple-700" />
            </div>
            <div className="feat-title font-bold mb-1">Ask Busmo AI</div>
            <div className="feat-desc text-sm mb-2">
              Get instant answers to your business questions, from sales to stock, powered by AI.
            </div>
            <span className="feat-tag bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-semibold">AI Assistant</span>
          </div>
          <div className="feat-card bg-white border border-gray-200 rounded-2xl p-6 shadow flex flex-col items-start">
            <div className="feat-icon bg-purple-100 p-3 rounded-full mb-3">
              <LineChart className="w-7 h-7 text-purple-700" />
            </div>
            <div className="feat-title font-bold mb-1">Business Health & Forecast</div>
            <div className="feat-desc text-sm mb-2">
              Visualize your sales trends and get AI-powered forecasts for smarter planning.
            </div>
            <span className="feat-tag bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-semibold">Forecast</span>
          </div>
          <div className="feat-card bg-white border border-gray-200 rounded-2xl p-6 shadow flex flex-col items-start">
            <div className="feat-icon bg-purple-100 p-3 rounded-full mb-3">
              <Users className="w-7 h-7 text-purple-700" />
            </div>
            <div className="feat-title font-bold mb-1">Multi-User Support</div>
            <div className="feat-desc text-sm mb-2">
              Add team members and collaborate securely. Control access and see who did what.
            </div>
            <span className="feat-tag bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-semibold">Team</span>
          </div>
        </div>
      </div>
    </section>
  );
}