"use client";

import React, { useState } from 'react';
import { MoIcon } from '../../owner/dashboard/NavIcons';

const SAMPLE_QUESTIONS = [
  "How much profit did I make today?",
  "Which products should I restock?",
  "What are my top selling products?",
  "Who owes me money?",
  "What expenses increased this month?",
];

const RESPONSES: Record<string, string> = {
  "How much profit did I make today?": "Based on today's sales of ₦118,500 and expenses of ₦71,300, your profit is **₦47,200**. That's a 12% increase from yesterday! 📈",
  "Which products should I restock?": "You should restock **Indomie** (8 packs left), **Rice** (15kg left), and **Cooking Oil** (5L left). These are your top 3 sellers and will run out by Friday based on current sales velocity. 📦",
  "What are my top selling products?": "Your top 3 products this week are:\n1. **Indomie** - ₦45,000 revenue\n2. **Rice** - ₦38,500 revenue\n3. **Soft Drinks** - ₦22,000 revenue\n\nThese represent 65% of your total sales. 🏆",
  "Who owes me money?": "You have **3 pending credit payments**:\n- Chinedu Okafor: ₦15,000 (due 3 days ago)\n- Fatima Ahmed: ₦8,500 (due today)\n- Emeka Nnamdi: ₦22,000 (due in 2 days)\n\nTotal outstanding: **₦45,500** 💳",
  "What expenses increased this month?": "Your expenses increased by **18%** compared to last month. The biggest increases were:\n- **Supplier costs**: +₦12,500 (price increase)\n- **Transportation**: +₦8,200 (fuel costs)\n- **Utilities**: +₦3,100\n\nI recommend negotiating with your main supplier for better rates. 📊",
};

export const InteractiveAskMODemo: React.FC = () => {
  const [selectedQuestion, setSelectedQuestion] = useState<string>("");
  const [response, setResponse] = useState<string>("");
  const [isTyping, setIsTyping] = useState(false);

  const handleQuestionClick = (question: string) => {
    setSelectedQuestion(question);
    setIsTyping(true);
    setResponse("");

    // Simulate typing delay for realistic feel
    setTimeout(() => {
      setResponse(RESPONSES[question] || "I'm analyzing your business data to answer that question...");
      setIsTyping(false);
    }, 800);
  };

  return (
    <section className="interactive-mo-section">
      <div className="max-w">
        <div className="section-head center">
          <div className="section-label">Ask Your Business Anything</div>
          <h2 className="section-title">
            Try Ask MO <em style={{ color: 'var(--purple-mid)' }}>Right Now</em>
          </h2>
          <p className="section-sub">
            Click any question below to see how MO answers in seconds. No signup required.
          </p>
        </div>

        <div className="interactive-mo-container">
          {/* Question Buttons */}
          <div className="question-buttons">
            {SAMPLE_QUESTIONS.map((question, index) => (
              <button
                key={index}
                className={`question-btn ${selectedQuestion === question ? 'active' : ''}`}
                onClick={() => handleQuestionClick(question)}
              >
                {question}
              </button>
            ))}
          </div>

          {/* Chat Interface */}
          <div className="mo-chat-interface">
            <div className="mo-chat-header">
              <div className="mo-chat-icon">
                <MoIcon size={20} />
              </div>
              <span className="mo-chat-title">MO · Ask Busmo AI</span>
              <span className="mo-chat-status">● Online</span>
            </div>

            <div className="mo-chat-messages">
              {selectedQuestion && (
                <>
                  <div className="chat-msg user">
                    <div className="chat-label">You</div>
                    <div className="chat-bubble">{selectedQuestion}</div>
                  </div>

                  {isTyping ? (
                    <div className="chat-msg mo">
                      <div className="chat-label">MO</div>
                      <div className="chat-bubble typing">
                        <span className="typing-dot"></span>
                        <span className="typing-dot"></span>
                        <span className="typing-dot"></span>
                      </div>
                    </div>
                  ) : response ? (
                    <div className="chat-msg mo">
                      <div className="chat-label">MO</div>
                      <div className="chat-bubble">
                        {response.split('\n').map((line, i) => (
                          <div key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </>
              )}

              {!selectedQuestion && (
                <div className="chat-msg mo">
                  <div className="chat-label">MO</div>
                  <div className="chat-bubble">
                    Hi there! 👋 I'm MO, your AI business assistant. Click any question above to see how I can help you understand your business in seconds.
                  </div>
                </div>
              )}
            </div>

            <div className="mo-chat-input">
              <span className="mo-input-placeholder">Ask MO anything about your business…</span>
            </div>
          </div>
        </div>

        <div className="mo-demo-cta">
          <p>Ready to get real insights for your business?</p>
          <button 
            className="btn-primary btn-large"
            onClick={() => (window.location.href = '/welcome/signup')}
          >
            Start Free Trial — No Credit Card
          </button>
        </div>
      </div>
    </section>
  );
};
