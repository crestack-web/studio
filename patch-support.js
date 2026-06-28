import React, { useState, useEffect, useRef } from 'react';

interface SupportSectionProps {
  onNavigate?: (page: string) => void;
}

const SupportSection: React.FC<SupportSectionProps> = ({ onNavigate }) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [supportThreadId, setSupportThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const newMessage = chatMessage;
    setChatMessages(prev => [...prev, { role: 'user', message: newMessage }]);
    setChatMessage('');

    // Simulate support response
    setTimeout(() => {
      setChatMessages(prev => [...prev, { 
        role: 'support', 
        message: 'Thanks for reaching out! Our support team has received your message and will get back to you shortly. For immediate assistance, please email us at support@busmo.io' 
      }]);
    }, 1000);
  };

  const faqItems = [
    {
      question: "How do I get started with Busmo?",
      answer: "Getting started is easy! Click 'Get Started' on our homepage, create your account, and follow the simple setup wizard. You'll be tracking your business in minutes."
    },
    {
      question: "Is Busmo free to use?",
      answer: "Busmo offers a 3-day free trial with no credit card required. After that, we have flexible pricing plans starting from just ₦2,000/month to suit businesses of all sizes."
    },
    {
      question: "Can I use Busmo offline?",
      answer: "Yes! Busmo is built to work offline. You can record sales, track inventory, and manage expenses without internet. Your data syncs automatically when you're back online."
    },
    {
      question: "How do I contact support?",
      answer: "You can reach our support team via email at support@busmo.io, use the live chat feature on this page, or check our extensive help documentation."
    },
    {
      question: "Is my business data secure?",
      answer: "Absolutely. We use industry-standard encryption and security protocols to protect your data. Your business information is yours alone and remains private and secure."
    },
    {
      question: "Can I import my existing data?",
      answer: "Yes, we support data import from various formats. Contact our support team at support@busmo.io for assistance with migrating your existing business data."
    }
  ];

  const supportCategories = [
    {
      icon: "🚀",
      title: "Getting Started",
      description: "Learn the basics and set up your account",
      items: ["Account setup", "First sale recording", "Adding products", "Staff invitation"]
    },
    {
      icon: "💰",
      title: "Billing & Pricing",
      description: "Understand our pricing and manage subscriptions",
      items: ["Pricing plans", "Payment methods", "Invoice management", "Refund policy"]
    },
    {
      icon: "🔧",
      title: "Technical Support",
      description: "Get help with technical issues",
      items: ["App troubleshooting", "Data sync issues", "Login problems", "Performance"]
    },
    {
      icon: "📊",
      title: "Features & Usage",
      description: "Learn how to use Busmo features effectively",
      items: ["Sales tracking", "Inventory management", "Expense logging", "Reports & analytics"]
    }
  ];

  return (
    <section className="support-section">
      <div className="max-w">
        <div className="section-head center">
          <div className="section-label">Support Center</div>
          <h2 className="section-title">We're here to help you succeed</h2>
          <p className="section-sub">Get the support you need to make the most of Busmo for your business</p>
        </div>

        {/* Support Categories */}
        <div className="support-categories-grid">
          {supportCategories.map((category, index) => (
            <div key={index} className="support-category-card">
              <div className="support-category-icon">{category.icon}</div>
              <h3 className="support-category-title">{category.title}</h3>
              <p className="support-category-desc">{category.description}</p>
              <ul className="support-category-items">
                {category.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact Options */}
        <div className="contact-options">
          <div className="contact-card primary">
            <div className="contact-icon">💬</div>
            <h3 className="contact-title">Live Chat</h3>
            <p className="contact-desc">Chat with our support team in real-time</p>
            <button 
              className="btn-primary" 
              onClick={() => setChatOpen(true)}
            >
              Start Chat
            </button>
          </div>

          <div className="contact-card">
            <div className="contact-icon">📧</div>
            <h3 className="contact-title">Email Us</h3>
            <p className="contact-desc">Send us a detailed message</p>
            <a href="mailto:support@busmo.io" className="btn-ghost">
              support@busmo.io
            </a>
          </div>

          <div className="contact-card">
            <div className="contact-icon">📚</div>
            <h3 className="contact-title">Help Center</h3>
            <p className="contact-desc">Browse our documentation</p>
            <button className="btn-ghost" onClick={() => window.open('/help', '_blank')}>
              Visit Help Center
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="faq-section">
          <h3 className="faq-title">Frequently Asked Questions</h3>
          <div className="faq-grid">
            {faqItems.map((item, index) => (
              <div key={index} className="faq-item">
                <h4 className="faq-question">{item.question}</h4>
                <p className="faq-answer">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Support Hours */}
        <div className="support-hours">
          <div className="hours-card">
            <h3 className="hours-title">Support Hours</h3>
            <div className="hours-grid">
              <div className="hours-item">
                <span className="hours-label">Monday - Friday</span>
                <span className="hours-time">8:00 AM - 8:00 PM WAT</span>
              </div>
              <div className="hours-item">
                <span className="hours-label">Saturday</span>
                <span className="hours-time">9:00 AM - 5:00 PM WAT</span>
              </div>
              <div className="hours-item">
                <span className="hours-label">Sunday</span>
                <span className="hours-time">Closed</span>
              </div>
            </div>
            <p className="hours-note">Response time: Within 24 hours for emails, instant for live chat during business hours</p>
          </div>
        </div>
      </div>

      {/* Chat Widget */}
      {chatOpen && (
        <div className="chat-widget-overlay" onClick={() => setChatOpen(false)}>
          <div className="chat-widget" onClick={e => e.stopPropagation()}>
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="chat-avatar">🎧</div>
                <div>
                  <h4 className="chat-title">Busmo Support</h4>
                  <p className="chat-status">Online • Typically replies instantly</p>
                </div>
              </div>
              <button className="chat-close" onClick={() => setChatOpen(false)}>✕</button>
            </div>
            
            <div className="chat-messages">
              {chatMessages.map((msg, index) => (
                <div key={index} className={`chat-message ${msg.role}`}>
                  <div className="chat-bubble">{msg.message}</div>
                </div>
              ))}
            </div>

            <form className="chat-input-form" onSubmit={handleSendMessage}>
              <input
                type="text"
                className="chat-input"
                placeholder="Type your message..."
                value={chatMessage}
                onChange={e => setChatMessage(e.target.value)}
              />
              <button type="submit" className="chat-send" disabled={!chatMessage.trim()}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2L18 10L10 18M18 10H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Chat Button */}
      {!chatOpen && (
        <button 
          className="floating-chat-btn"
          onClick={() => setChatOpen(true)}
          aria-label="Chat with support"
        >
          💬
        </button>
      )}
    </section>
  );
};

export default SupportSection;
