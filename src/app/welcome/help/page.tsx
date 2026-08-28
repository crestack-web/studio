"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { AnnouncementBar } from '../components/AnnouncementBar';
import type { Page } from '../types';
import {
  Search,
  ChevronRight,
  Mail,
  MessageCircle,
  Phone,
  ArrowRight,
  Package,
  ShoppingCart,
  Wallet,
  Boxes,
  Settings,
  Users,
  Truck,
  Sparkles,
  FileText,
  Rocket,
} from 'lucide-react';
import styles from './HelpCenter.module.css';

interface HelpArticle {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  popular?: boolean;
  actionLink?: string;
  actionLabel?: string;
}

const HELP_ARTICLES: HelpArticle[] = [
  {
    id: '1',
    title: 'Getting started with Busmo',
    category: 'Getting Started',
    excerpt: 'Set up your business profile, configure settings, and start using Busmo in minutes.',
    content:
      'Welcome to Busmo! Start by setting up your business profile in Settings. Add your business details, configure tax settings, and invite your team members. Use the Dashboard to get an overview of your sales, inventory, and financial metrics.',
    popular: true,
  },
  {
    id: '2',
    title: 'Recording and managing sales',
    category: 'Sales',
    excerpt: 'Learn how to record sales, manage transactions, and track revenue.',
    content:
      'Navigate to the Sales section to record new transactions. Choose between cash, credit, or mobile money payments. Add items from your product catalog, apply discounts, and print receipts. All sales are automatically reflected in your inventory and financial reports.',
    popular: true,
    actionLink: '/owner/dashboard',
    actionLabel: 'Go to Record Sale',
  },
  {
    id: '3',
    title: 'Adding and managing products',
    category: 'Products',
    excerpt: 'Create your product catalog with prices, categories, and stock levels.',
    content:
      'Go to Products to add your inventory. Set product names, SKUs, prices, cost prices, and minimum stock levels. Organize products into categories for easier management. Enable bulk pricing for wholesale customers and set tax rates per product.',
    popular: true,
    actionLink: '/owner/dashboard',
    actionLabel: 'Go to Add Product',
  },
  {
    id: '4',
    title: 'Inventory management and stock control',
    category: 'Inventory',
    excerpt: 'Track stock across locations, set reorder points, and manage transfers.',
    content:
      'Busmo provides inventory management with multi-location support. Track stock levels in real-time, set low-stock alerts, and manage warehouse transfers. Record stock adjustments for damages, losses, or recounts.',
    popular: true,
    actionLink: '/owner/dashboard',
    actionLabel: 'Go to Inventory',
  },
  {
    id: '5',
    title: 'Understanding profit, revenue, and margins',
    category: 'Finance',
    excerpt: 'Learn how Busmo calculates your business financial metrics.',
    content:
      'Revenue is total sales before deductions. Profit is revenue minus cost of goods sold and expenses. Busmo automatically calculates profit margins per product and overall business health. View detailed breakdowns in Reports.',
    popular: false,
    actionLink: '/owner/dashboard',
    actionLabel: 'Go to Statement',
  },
  {
    id: '6',
    title: 'Payments, bank accounts, and reconciliations',
    category: 'Payments',
    excerpt: 'Link bank accounts, process payments, and reconcile transactions.',
    content:
      'Add your bank accounts in Settings to track deposits and withdrawals. Busmo supports cash, credit, bank transfer, and mobile money. Use Reconciliation to match payments with deposits and identify discrepancies.',
    popular: true,
    actionLink: '/owner/dashboard',
    actionLabel: 'Go to Cashflow',
  },
  {
    id: '7',
    title: 'Using MO AI assistant',
    category: 'Features',
    excerpt: 'Ask MO to record sales, check inventory, and explain your numbers.',
    content:
      'MO is your virtual business assistant. Use natural language to record sales, check stock, track expenses, and generate insights. Access MO via voice or text from the dashboard.',
    popular: true,
    actionLink: '/owner/dashboard',
    actionLabel: 'Go to Ask MO',
  },
  {
    id: '8',
    title: 'Invoices, receipts, and document templates',
    category: 'Documents',
    excerpt: 'Create professional invoices and receipts with customizable templates.',
    content:
      'Generate invoices with automatic tax calculations. Choose from Thermal, A5, Corporate, or Nigerian Wholesale templates. Customize with your logo and colors. Send via WhatsApp or email.',
    popular: false,
  },
  {
    id: '9',
    title: 'Managing expenses and cash flow',
    category: 'Finance',
    excerpt: 'Track expenses, manage cash flow, and monitor financial health.',
    content:
      'Record expenses by category: utilities, salaries, supplies, and more. View cash flow showing money in vs money out. Set budget awareness and track spending.',
    popular: false,
    actionLink: '/owner/dashboard',
    actionLabel: 'Go to Add Expense',
  },
  {
    id: '10',
    title: 'Staff permissions and access control',
    category: 'Settings',
    excerpt: 'Control what your team can see and do with role-based access.',
    content:
      'Add staff and assign roles. Each role has specific permissions. Track staff activity and accountability, and monitor sales by staff member.',
    popular: false,
  },
  {
    id: '11',
    title: 'Customer management and credit tracking',
    category: 'Customers',
    excerpt: 'Build customer profiles, track credit limits, and manage relationships.',
    content:
      'Create customer profiles with contact details and credit limits. Track purchase history and payment patterns. Set credit terms and get alerts for overdue balances.',
    popular: false,
  },
  {
    id: '12',
    title: 'Supplier management and purchase orders',
    category: 'Suppliers',
    excerpt: 'Manage suppliers, track purchases, and handle payments.',
    content:
      'Add suppliers with payment terms. Track purchase orders and stock receipts. Record supplier payments and outstanding balances.',
    popular: false,
  },
];

const CATEGORY_META: Record<string, { icon: React.ReactNode; description: string }> = {
  'Getting Started': {
    icon: <Rocket size={20} />,
    description: 'Set up your business and start in minutes',
  },
  Sales: {
    icon: <ShoppingCart size={20} />,
    description: 'Record sales and track revenue',
  },
  Products: {
    icon: <Package size={20} />,
    description: 'Catalog, prices, and stock levels',
  },
  Inventory: {
    icon: <Boxes size={20} />,
    description: 'Stock, transfers, and alerts',
  },
  Finance: {
    icon: <Wallet size={20} />,
    description: 'Profit, expenses, and cash flow',
  },
  Payments: {
    icon: <Wallet size={20} />,
    description: 'Banks, payments, and reconciliation',
  },
  Features: {
    icon: <Sparkles size={20} />,
    description: 'MO AI and advanced tools',
  },
  Documents: {
    icon: <FileText size={20} />,
    description: 'Invoices, receipts, and templates',
  },
  Settings: {
    icon: <Settings size={20} />,
    description: 'Staff roles and account setup',
  },
  Customers: {
    icon: <Users size={20} />,
    description: 'Profiles and credit tracking',
  },
  Suppliers: {
    icon: <Truck size={20} />,
    description: 'Purchases and supplier balances',
  },
};

function handleNavigate(page: Page | string) {
  if (page === 'home') window.location.href = '/welcome';
  else if (page === 'signup') window.location.href = '/welcome/signup';
  else if (page === 'login') window.location.href = '/login';
  else if (page === 'pricing') window.location.href = '/pricing';
  else if (page === 'seller') window.location.href = '/seller';
  else if (page === 'invest') window.location.href = '/invest';
  else if (page === 'download') window.location.href = '/welcome/download';
  else if (page === 'help') window.location.href = '/welcome/help';
  else window.location.href = '/welcome';
}

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);

  useEffect(() => {
    document.title = 'Help Center — Busmo';
  }, []);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    HELP_ARTICLES.forEach((a) => counts.set(a.category, (counts.get(a.category) || 0) + 1));
    return Array.from(counts.entries()).map(([name, count]) => ({
      name,
      count,
      ...(CATEGORY_META[name] || {
        icon: <Search size={20} />,
        description: '',
      }),
    }));
  }, []);

  const popular = HELP_ARTICLES.filter((a) => a.popular);

  const filtered = HELP_ARTICLES.filter((article) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      article.title.toLowerCase().includes(q) ||
      article.excerpt.toLowerCase().includes(q) ||
      article.content.toLowerCase().includes(q) ||
      article.category.toLowerCase().includes(q);
    const matchesCategory = !selectedCategory || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setOpenId(null);
  };

  if (selectedArticle) {
    return (
      <div className={styles.page}>
        <AnnouncementBar />
        <Navbar currentPage="help" onNavigate={handleNavigate} />
        <main className={styles.main}>
          <div className={styles.detail}>
            <button type="button" className={styles.back} onClick={() => setSelectedArticle(null)}>
              <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
              Back to Help Center
            </button>
            <article className={styles.detailCard}>
              <div className={styles.detailCat}>
                {CATEGORY_META[selectedArticle.category]?.icon}
                {selectedArticle.category}
              </div>
              <h1 className={styles.detailTitle}>{selectedArticle.title}</h1>
              <p className={styles.detailExcerpt}>{selectedArticle.excerpt}</p>
              <div className={styles.detailBody}>{selectedArticle.content}</div>
              <div className={styles.articleActions}>
                {selectedArticle.actionLink && (
                  <a className={styles.btnPrimary} href={selectedArticle.actionLink}>
                    <ArrowRight size={16} />
                    {selectedArticle.actionLabel || 'Open dashboard'}
                  </a>
                )}
                <a className={styles.btnGhost} href="/welcome/support">
                  <Mail size={16} />
                  Contact support
                </a>
              </div>
            </article>
          </div>
        </main>
        <Footer onNavigate={handleNavigate} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <AnnouncementBar />
      <Navbar currentPage="help" onNavigate={handleNavigate} />

      <main className={styles.main}>
        <header className={styles.hero}>
          <span className={styles.eyebrow}>Help Center</span>
          <h1 className={styles.heroTitle}>
            How can we <em>help</em> you?
          </h1>
          <p className={styles.heroSub}>
            Clear answers for sales, stock, cash, staff, and MO — so you stay in control of your business.
          </p>
          <div className={styles.searchWrap}>
            <Search className={styles.searchIcon} size={20} />
            <input
              className={styles.searchInput}
              type="search"
              placeholder="Search topics… e.g. sales, inventory, MO"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search help topics"
            />
          </div>
        </header>

        <div className={styles.container}>
          {!searchQuery && (
            <>
              <h2 className={styles.sectionTitle}>Popular topics</h2>
              <div className={styles.chips}>
                {popular.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className={styles.chip}
                    onClick={() => {
                      setOpenId(a.id);
                      setSelectedCategory(null);
                      document.getElementById(`article-${a.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                  >
                    {a.title}
                  </button>
                ))}
              </div>

              <h2 className={styles.sectionTitle}>Browse by category</h2>
              <div className={styles.catGrid}>
                {categories.map((cat) => (
                  <button
                    key={cat.name}
                    type="button"
                    className={`${styles.catCard} ${
                      selectedCategory === cat.name ? styles.catCardActive : ''
                    }`}
                    onClick={() =>
                      setSelectedCategory((prev) => (prev === cat.name ? null : cat.name))
                    }
                  >
                    <div className={styles.catIcon}>{cat.icon}</div>
                    <p className={styles.catName}>{cat.name}</p>
                    <p className={styles.catDesc}>{cat.description}</p>
                    <span className={styles.catMeta}>
                      {cat.count} article{cat.count === 1 ? '' : 's'}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
              {searchQuery
                ? `Results for “${searchQuery}”`
                : selectedCategory
                  ? selectedCategory
                  : 'All articles'}
            </h2>
            {(searchQuery || selectedCategory) && (
              <button type="button" className={styles.clearBtn} onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className={styles.empty}>
              <Search size={32} />
              <h3>No matching articles</h3>
              <p>Try a different keyword or browse by category.</p>
              <button type="button" className={styles.btnGhost} onClick={clearFilters} style={{ marginTop: 12 }}>
                Clear search
              </button>
            </div>
          ) : (
            <div className={styles.list}>
              {filtered.map((article) => {
                const isOpen = openId === article.id;
                return (
                  <div key={article.id} id={`article-${article.id}`} className={styles.article}>
                    <button
                      type="button"
                      className={styles.articleBtn}
                      onClick={() => setOpenId(isOpen ? null : article.id)}
                      aria-expanded={isOpen}
                    >
                      <div className={styles.catIcon} style={{ width: 36, height: 36, flexShrink: 0 }}>
                        {CATEGORY_META[article.category]?.icon || <Search size={18} />}
                      </div>
                      <div className={styles.articleBody}>
                        <h3 className={styles.articleTitle}>
                          {article.title}
                          {article.popular && <span className={styles.popular}>Popular</span>}
                        </h3>
                        <p className={styles.articleExcerpt}>{article.excerpt}</p>
                      </div>
                      <ChevronRight
                        size={18}
                        className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
                      />
                    </button>
                    {isOpen && (
                      <div className={styles.articlePanel}>
                        <p className={styles.articleContent}>{article.content}</p>
                        <div className={styles.articleActions}>
                          <button
                            type="button"
                            className={styles.btnGhost}
                            onClick={() => setSelectedArticle(article)}
                          >
                            Full article
                            <ChevronRight size={14} />
                          </button>
                          {article.actionLink && (
                            <a className={styles.btnPrimary} href={article.actionLink}>
                              <ArrowRight size={14} />
                              {article.actionLabel}
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className={styles.cta}>
            <h2>Still need help?</h2>
            <p>Our team can help with setup, sales, stock, and Money Control questions.</p>
            <div className={styles.ctaRow}>
              <a className={styles.btnPrimary} href="/welcome/support">
                <Mail size={16} />
                Contact support
              </a>
              <a className={styles.btnGhost} href="/welcome">
                Back to home
              </a>
            </div>
            <div className={styles.ctaMeta}>
              <span>
                <MessageCircle size={14} /> Live chat on site
              </span>
              <span>
                <Mail size={14} /> support@busmo.io
              </span>
              <span>
                <Phone size={14} /> Phone support
              </span>
            </div>
          </div>
        </div>
      </main>

      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
