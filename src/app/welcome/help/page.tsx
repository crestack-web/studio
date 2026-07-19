"use client";

import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import type { Page } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Search, ChevronRight, Mail, MessageCircle, Phone, ArrowRight } from 'lucide-react';

interface HelpArticle {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  popular?: boolean;
}

interface HelpCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  articleCount: number;
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

// Category icons using Lucide React
const getCategoryIcon = (category: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    'Getting Started': <Search className="w-6 h-6" />,
    'Sales': <ArrowRight className="w-6 h-6" />,
    'Products': <MessageCircle className="w-6 h-6" />,
    'Inventory': <Search className="w-6 h-6" />,
    'Finance': <Phone className="w-6 h-6" />,
    'Payments': <Phone className="w-6 h-6" />,
    'Features': <MessageCircle className="w-6 h-6" />,
    'Documents': <Mail className="w-6 h-6" />,
    'Settings': <Search className="w-6 h-6" />,
    'Customers': <MessageCircle className="w-6 h-6" />,
    'Suppliers': <MessageCircle className="w-6 h-6" />,
  };
  return iconMap[category] || <Search className="w-6 h-6" />;
};

// Generate help categories from articles
const generateHelpCategories = (): HelpCategory[] => {
  const categoryMap = new Map<string, number>();
  HELP_ARTICLES.forEach(article => {
    categoryMap.set(article.category, (categoryMap.get(article.category) || 0) + 1);
  });

  const descriptions: Record<string, string> = {
    'Getting Started': 'Set up your business profile and get started with Busmo',
    'Sales': 'Record sales, manage transactions, and track revenue',
    'Products': 'Create your product catalog with prices and stock levels',
    'Inventory': 'Track stock across locations and manage transfers',
    'Finance': 'Understand profit, revenue, and financial metrics',
    'Payments': 'Link bank accounts and process payments',
    'Features': 'Leverage AI assistant and advanced features',
    'Documents': 'Create invoices, receipts, and document templates',
    'Settings': 'Control access levels and configure your account',
    'Customers': 'Build customer profiles and track credit limits',
    'Suppliers': 'Manage supplier relationships and purchases',
  };

  return Array.from(categoryMap.entries()).map(([name, count]) => ({
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    description: descriptions[name] || '',
    icon: getCategoryIcon(name),
    articleCount: count,
  }));
};

const HELP_CATEGORIES = generateHelpCategories();

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);

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
    const matchesCategory = !selectedCategory || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (selectedArticle) {
    return (
      <>
        <Navbar currentPage="help" onNavigate={(page) => handleNavigate(page)} />
        <div className="min-h-screen bg-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Button
              variant="ghost"
              onClick={() => setSelectedArticle(null)}
              className="mb-8 pl-0 text-primary hover:text-primary/80"
            >
              <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
              Back to Help Center
            </Button>

            <Card className="border-2 shadow-lg">
              <CardHeader className="pb-6">
                <div className="mb-4">
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                    {getCategoryIcon(selectedArticle.category)}
                    {selectedArticle.category}
                  </span>
                </div>

                <CardTitle className="text-3xl sm:text-4xl font-bold text-foreground mb-4 font-headline">
                  {selectedArticle.title}
                </CardTitle>

                <CardDescription className="text-lg">
                  {selectedArticle.excerpt}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="bg-muted/50 rounded-lg p-6 mb-8">
                  <p className="text-foreground text-base leading-relaxed whitespace-pre-wrap">
                    {selectedArticle.content}
                  </p>
                </div>

                <div className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border-2 border-primary/20">
                  <h3 className="font-semibold text-foreground mb-2">Need more help?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Can't find what you're looking for? Our support team is here to help.
                  </p>
                  <Button
                    onClick={() => window.location.href = '/welcome/support'}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Contact Support
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer onNavigate={handleNavigate} />
      </>
    );
  }

  return (
    <>
      <Navbar currentPage="help" onNavigate={(page) => handleNavigate(page)} />
      <div className="min-h-screen bg-background">
        {/* Hero Section with Search */}
        <div className="bg-gradient-to-b from-background to-card border-b border-border">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <div className="text-center mb-8">
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 font-headline">
                How can we help you?
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Search our knowledge base for answers to common questions about Busmo
              </p>
            </div>
            
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="Search for help topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-base rounded-lg border-2 border-input shadow-sm focus:ring-2 focus:ring-primary focus:border-primary"
                aria-label="Search help topics"
              />
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          {/* Category Grid */}
          {!searchQuery && (
            <>
              <h2 className="text-2xl font-bold text-foreground mb-6 font-headline">Browse by category</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                {HELP_CATEGORIES.map((category) => (
                  <Card
                    key={category.id}
                    className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/50 border-2"
                    onClick={() => setSelectedCategory(category.name)}
                  >
                    <CardHeader>
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                        {category.icon}
                      </div>
                      <CardTitle className="text-xl">{category.name}</CardTitle>
                      <CardDescription className="text-base">
                        {category.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span>{category.articleCount} articles</span>
                        <ChevronRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* FAQ Accordion Section */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-6 font-headline">
              {searchQuery ? `Search results for "${searchQuery}"` : 'Frequently asked questions'}
            </h2>
            
            {filteredArticles.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-4">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No results found</h3>
                <p className="text-muted-foreground mb-4">Try adjusting your search terms</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory(null);
                  }}
                >
                  Clear search
                </Button>
              </div>
            ) : (
              <Accordion type="multiple" className="space-y-4">
                {filteredArticles.map((article) => (
                  <AccordionItem
                    key={article.id}
                    value={article.id}
                    className="border-2 rounded-lg overflow-hidden"
                  >
                    <AccordionTrigger className="px-6 py-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center text-primary flex-shrink-0">
                          {getCategoryIcon(article.category)}
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold text-foreground">{article.title}</span>
                          {article.popular && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                              Popular
                            </span>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                      <div className="pt-4 border-t border-border">
                        <p className="text-muted-foreground mb-4">{article.excerpt}</p>
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                            {article.content}
                          </p>
                        </div>
                        <Button
                          variant="link"
                          className="mt-4 pl-0 text-primary"
                          onClick={() => setSelectedArticle(article)}
                        >
                          View full article
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>

          {/* Still Need Help Section */}
          <div className="mt-20 max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20">
              <CardContent className="p-8 sm:p-12 text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 font-headline">
                  Still need help?
                </h2>
                <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                  Can't find what you're looking for? Our support team is here to help you with any questions.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto"
                    onClick={() => window.location.href = '/welcome/support'}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Contact Support
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto"
                    onClick={() => window.location.href = '/welcome'}
                  >
                    Back to Home
                  </Button>
                </div>
                
                <div className="mt-8 pt-8 border-t border-border/50 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    <span>Live Chat</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>Email Support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>Phone Support</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer onNavigate={handleNavigate} />
    </>
  );
}
