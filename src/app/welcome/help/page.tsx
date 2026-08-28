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
  UserCog,
} from 'lucide-react';
import styles from './HelpCenter.module.css';
import { HELP_ARTICLES, CATEGORY_DESCRIPTIONS, type HelpArticle } from './helpArticles';

const CATEGORY_META: Record<string, { icon: React.ReactNode; description: string }> = {
  'Getting Started': {
    icon: <Rocket size={20} />,
    description: CATEGORY_DESCRIPTIONS['Getting Started'],
  },
  Sales: {
    icon: <ShoppingCart size={20} />,
    description: CATEGORY_DESCRIPTIONS.Sales,
  },
  Inventory: {
    icon: <Boxes size={20} />,
    description: CATEGORY_DESCRIPTIONS.Inventory,
  },
  Finance: {
    icon: <Wallet size={20} />,
    description: CATEGORY_DESCRIPTIONS.Finance,
  },
  Staff: {
    icon: <UserCog size={20} />,
    description: CATEGORY_DESCRIPTIONS.Staff,
  },
  Customers: {
    icon: <Users size={20} />,
    description: CATEGORY_DESCRIPTIONS.Customers,
  },
  Suppliers: {
    icon: <Truck size={20} />,
    description: CATEGORY_DESCRIPTIONS.Suppliers,
  },
  'MO & Growth': {
    icon: <Sparkles size={20} />,
    description: CATEGORY_DESCRIPTIONS['MO & Growth'],
  },
  Documents: {
    icon: <FileText size={20} />,
    description: CATEGORY_DESCRIPTIONS.Documents,
  },
  Settings: {
    icon: <Settings size={20} />,
    description: CATEGORY_DESCRIPTIONS.Settings,
  },
  Products: {
    icon: <Package size={20} />,
    description: 'Catalog and pricing',
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
        description: CATEGORY_DESCRIPTIONS[name] || '',
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
            Guides matched to real Busmo flows — sales, stock, Money Control, staff portal, MO, and more.
          </p>
          <div className={styles.searchWrap}>
            <Search className={styles.searchIcon} size={20} />
            <input
              className={styles.searchInput}
              type="search"
              placeholder="Search… e.g. shift close, Money Control, menu"
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
                      document
                        .getElementById(`article-${a.id}`)
                        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
              <button
                type="button"
                className={styles.btnGhost}
                onClick={clearFilters}
                style={{ marginTop: 12 }}
              >
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
            <p>Our team can help with setup, sales, stock, staff, and Money Control.</p>
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
