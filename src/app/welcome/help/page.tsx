"use client";

import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import type { Page } from '../types';

interface HelpArticle {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  popular?: boolean;
}

const HELP_ARTICLES: HelpArticle[] = [
  { 
    id: '1', 
    title: 'Getting started with Busmo', 
    category: 'Getting Started', 
    excerpt: 'Set up your business profile, configure settings, and start using Busmo in minutes.', 
    content: 'Welcome to Busmo! Start by setting up your business profile in Settings. Add your business details, configure tax settings, and invite your team members. Use the Dashboard to get an overview of your sales, inventory, and financial metrics.',
    popular: true 
  },
  { 
    id: '2', 
    title: 'Recording and managing sales', 
    category: 'Sales', 
    excerpt: 'Learn how to record sales, manage transactions, and track revenue.', 
    content: 'Navigate to the Sales section to record new transactions. Choose between cash, credit, or mobile money payments. Add items from your product catalog, apply discounts, and print receipts. All sales are automatically reflected in your inventory and financial reports.',
    popular: true 
  },
  { 
    id: '3', 
    title: 'Adding and managing products', 
    category: 'Products', 
    excerpt: 'Create your product catalog with prices, categories, and stock levels.', 
    content: 'Go to Products to add your inventory. Set product names, SKUs, prices, cost prices, and minimum stock levels. Organize products into categories for easier management. Enable bulk pricing for wholesale customers and set tax rates per product.',
    popular: true 
  },
  { 
    id: '4', 
    title: 'Inventory management and stock control', 
    category: 'Inventory', 
    excerpt: 'Track stock across multiple locations, set reorder points, and manage transfers.', 
    content: 'Busmo provides powerful inventory management with multi-location support. Track stock levels in real-time, set low-stock alerts, and manage warehouse transfers. Record stock adjustments for damages, losses, or recounts. Generate invoices for stock releases and track returns.',
    popular: true 
  },
  { 
    id: '5', 
    title: 'Understanding profit, revenue, and margins', 
    category: 'Finance', 
    excerpt: 'Learn how Busmo calculates your business financial metrics.', 
    content: 'Revenue is total sales before deductions. Profit is revenue minus cost of goods sold and expenses. Busmo automatically calculates profit margins per product and overall business health. View detailed breakdowns in the Reports section.',
    popular: false 
  },
  { 
    id: '6', 
    title: 'Payments, bank accounts, and reconciliations', 
    category: 'Payments', 
    excerpt: 'Link bank accounts, process payments, and reconcile transactions.', 
    content: 'Add your bank accounts in Settings to track deposits and withdrawals. Busmo supports multiple payment methods: cash, credit, bank transfer, and mobile money. Use the Reconciliation tool to match payments with deposits and identify discrepancies.',
    popular: true 
  },
  { 
    id: '7', 
    title: 'Using Business Operations (MO) AI assistant', 
    category: 'Features', 
    excerpt: 'Leverage AI to record sales, check inventory, and get business insights.', 
    content: 'MO AI is your virtual business assistant. Use natural language to record sales, check stock levels, track expenses, and generate reports. MO integrates with all Busmo features and learns your business patterns. Access MO via voice or text from the dashboard.',
    popular: true 
  },
  { 
    id: '8', 
    title: 'Invoices, receipts, and document templates', 
    category: 'Documents', 
    excerpt: 'Create professional invoices and receipts with customizable templates.', 
    content: 'Generate invoices for customer orders with automatic tax calculations. Choose from multiple receipt templates: Thermal, A5, Corporate, or Nigerian Wholesale. Customize templates with your logo, colors, and layout. Send invoices via WhatsApp or email.',
    popular: false 
  },
  { 
    id: '9', 
    title: 'Managing expenses and cash flow', 
    category: 'Finance', 
    excerpt: 'Track business expenses, manage cash flow, and monitor financial health.', 
    content: 'Record expenses by category: utilities, salaries, supplies, etc. Tag expenses to specific departments or projects. View cash flow statements showing money in vs money out. Set budget alerts and track spending against targets.',
    popular: false 
  },
  { 
    id: '10', 
    title: 'Staff permissions and role-based access control', 
    category: 'Settings', 
    excerpt: 'Control access levels for your team with role-based permissions.', 
    content: 'Add staff members and assign roles: Admin, Manager, Cashier, or Viewer. Each role has specific permissions for accessing features. Track staff activity and accountability. Monitor sales by staff member and view performance metrics.',
    popular: false 
  },
  { 
    id: '11', 
    title: 'Customer management and credit tracking', 
    category: 'Customers', 
    excerpt: 'Build customer profiles, track credit limits, and manage relationships.', 
    content: 'Create customer profiles with contact details and credit limits. Track customer purchase history and payment patterns. Set credit terms and receive alerts for overdue payments. Generate customer statements and sales reports.',
    popular: false 
  },
  { 
    id: '12', 
    title: 'Supplier management and purchase orders', 
    category: 'Suppliers', 
    excerpt: 'Manage supplier relationships, track purchases, and handle payments.', 
    content: 'Add suppliers with payment terms and credit limits. Track purchase orders and stock receipts. Record supplier payments and track outstanding balances. Get insights on supplier performance and payment history.',
    popular: false 
  },
];

const CategoryIcon = ({ category }: { category: string }) => {
  const iconMap: Record<string, React.ReactNode> = {
    'Getting Started': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    'Sales': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12h8" />
        <path d="M12 8v8" />
      </svg>
    ),
    'Products': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
    'Inventory': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3h18v18H3z" />
        <path d="M3 9h18" />
        <path d="M9 21V9" />
      </svg>
    ),
    'Finance': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    'Payments': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
    'Features': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    'Documents': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    'Settings': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    'Customers': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    'Suppliers': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="23" y1="11" x2="17" y2="11" />
      </svg>
    ),
  };

  return iconMap[category] || null;
};

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Getting Started', 'Sales', 'Products', 'Inventory', 'Finance']));

  const handleNavigate = (page: Page | string) => {
    if (page === 'home') {
      window.location.href = '/welcome';
    } else if (page === 'signup') {
      window.location.href = '/welcome/signup';
    } else if (page === 'login') {
      window.location.href = '/login';
    } else if (page === 'pricing') {
      window.location.href = '/pricing';
    } else if (page === 'seller') {
      window.location.href = '/seller';
    } else if (page === 'invest') {
      window.location.href = '/invest';
    } else if (page === 'download') {
      window.location.href = '/welcome/download';
    } else {
      window.location.href = '/welcome';
    }
  };

  const filteredArticles = HELP_ARTICLES.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(HELP_ARTICLES.map(a => a.category)));

  const groupedArticles = filteredArticles.reduce((acc, article) => {
    if (!acc[article.category]) acc[article.category] = [];
    acc[article.category].push(article);
    return acc;
  }, {} as Record<string, HelpArticle[]>);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  if (selectedArticle) {
    return (
      <>
        <Navbar currentPage="help" onNavigate={(page) => handleNavigate(page)} />
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <button
              onClick={() => setSelectedArticle(null)}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-8 font-medium group"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back to Help Center
            </button>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 sm:p-12">
              <div className="mb-6">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-semibold">
                  <CategoryIcon category={selectedArticle.category} />
                  {selectedArticle.category}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 leading-tight">
                {selectedArticle.title}
              </h1>

              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                {selectedArticle.excerpt}
              </p>

              <div className="prose prose-lg max-w-none">
                <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selectedArticle.content}
                </div>
              </div>

              <div className="mt-12 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                <h3 className="font-semibold text-slate-900 mb-2">Need more help?</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Can't find what you're looking for? Our support team is here to help.
                </p>
                <button
                  onClick={() => window.location.href = '/welcome/support'}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
        <Footer onNavigate={handleNavigate} />
      </>
    );
  }

  return (
    <>
      <Navbar currentPage="help" onNavigate={(page) => handleNavigate(page)} />
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          {/* Header */}
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-6 shadow-lg">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Help Center
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Find comprehensive guides, tutorials, and answers to help you get the most out of Busmo
            </p>
          </div>

          {/* Search and Filter */}
          <div className="mb-10 space-y-4">
            <div className="relative">
              <svg 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Search for help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base shadow-sm"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-indigo-500 hover:text-indigo-600'
                }`}
              >
                All Articles
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-indigo-500 hover:text-indigo-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Articles by Category */}
          {filteredArticles.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No articles found</h3>
              <p className="text-slate-600">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedArticles).map(([category, articles]) => {
                const isExpanded = expandedCategories.has(category);
                return (
                  <div key={category} className="bg-white rounded-xl shadow-sm border-2 border-slate-200 overflow-hidden hover:border-indigo-300 transition-colors">
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                          <CategoryIcon category={category} />
                        </div>
                        <div className="text-left">
                          <h2 className="text-xl font-bold text-slate-900">{category}</h2>
                          <p className="text-sm text-slate-500 mt-0.5">
                            {articles.length} {articles.length === 1 ? 'article' : 'articles'}
                          </p>
                        </div>
                      </div>
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {isExpanded && (
                      <div className="px-6 pb-6 space-y-3">
                        {articles.map(article => (
                          <button
                            key={article.id}
                            onClick={() => setSelectedArticle(article)}
                            className="w-full text-left p-5 rounded-lg border-2 border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all group bg-white"
                          >
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 flex-shrink-0 group-hover:scale-110 transition-transform">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                                  {article.title}
                                </h3>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                  {article.excerpt}
                                </p>
                                {article.popular && (
                                  <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-semibold">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                    </svg>
                                    Popular
                                  </span>
                                )}
                              </div>
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-slate-400 flex-shrink-0 group-hover:text-indigo-600 transition-colors"
                              >
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Links */}
          <div className="mt-16 p-8 sm:p-10 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl text-white shadow-xl">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">Still need help?</h2>
              <p className="text-indigo-100 mb-6 text-lg">
                Our support team is here to help you with any questions you may have
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <button 
                  onClick={() => window.location.href = '/welcome/support'}
                  className="px-8 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-colors shadow-lg"
                >
                  Contact Support
                </button>
                <button 
                  onClick={() => window.location.href = '/welcome'}
                  className="px-8 py-3 bg-indigo-500 text-white rounded-lg font-semibold hover:bg-indigo-400 transition-colors border-2 border-indigo-400 shadow-lg"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer onNavigate={handleNavigate} />
    </>
  );
}
