const fs = require('fs');
const f = 'src/app/welcome/page.tsx';
const c = fs.readFileSync(f, 'utf8');

// Close StaggerContainer and ScrollReveal after path cards
const oldClose1 = `            </button>
              </div>
            </div>
          </div>
        </div>
      </section>`;

const newClose1 = `            </button>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>
      </ScrollReveal>`;

let updated = c.replace(oldClose1, newClose1);

// Wrap remaining sections without ScrollReveal
const sections = [
  ['{/* HOW BUSMO WORKS */}\n      <HowBusmoWorks', '<ScrollReveal direction="up" duration={0.7} delay={0.1}><HowBusmoWorks /></ScrollReveal>'],
  ['{/* INDUSTRY USE CASES */}\n      <IndustryUseCases', '<ScrollReveal direction="up" duration={0.7} delay={0.1}><IndustryUseCases /></ScrollReveal>'],
  ['{/* SELL ONLINE / STOREFRONT */}\n      <MarketSection onNavigate={handleNavigate}', '<ScrollReveal direction="up" duration={0.7} delay={0.1}><MarketSection onNavigate={handleNavigate} /></ScrollReveal>'],
  ['{/* ASK MO SECTION */}\n      <MoSection', '<ScrollReveal direction="up" duration={0.7} delay={0.1}><MoSection /></ScrollReveal>'],
];

for (const [search, replace] of sections) {
  updated = updated.replace(search, replace);
}

// Add features section before HowBusmoWorks
const featuresSection = `
      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <section className="features-bg">
          <div className="max-w">
            <div className="section-head">
              <div className="section-label">Platform Features</div>
              <h2 className="section-title">Talk to your business.<br /><em>It listens.</em></h2>
              <p className="section-sub">Busmo is the first business operating system that understands natural language.</p>
            </div>
            <div className="features-grid">
              <div className="feat-card wide"><div className="feat-icon">🤖</div><div><div className="feat-title">MO — Your AI Business Assistant</div><div className="feat-desc">Record sales by saying "sold 3 shirts"</div><span className="feat-tag">AI-Powered</span></div></div>
              <div className="feat-card"><div className="feat-icon">🗣️</div><div className="feat-title">Natural Language Sales</div><div className="feat-desc">No forms, no complexity.</div></div>
              <div className="feat-card"><div className="feat-icon">📷</div><div className="feat-title">Add Products with Images</div><div className="feat-desc">Snap a photo and tell MO about it.</div></div>
              <div className="feat-card"><div className="feat-icon">📦</div><div className="feat-title">Smart Inventory</div><div className="feat-desc">Track stock automatically.</div></div>
              <div className="feat-card"><div className="feat-icon">💡</div><div className="feat-title">Daily Business Insights</div><div className="feat-desc">MO provides personalized insights every day.</div></div>
              <div className="feat-card"><div className="feat-icon">👥</div><div className="feat-title">Staff Management</div><div className="feat-desc">Invite staff to record sales.</div><span className="feat-tag">Supermarket plan+</span></div></div>
              <div className="feat-card"><div className="feat-icon">🏬</div><div className="feat-title">Multiple Branches</div><div className="feat-desc">Manage a chain or franchise.</div><span className="feat-tag">Branches plan+</span></div></div>
              <div className="feat-card"><div className="feat-icon">📵</div><div className="feat-title">Works Offline</div><div className="feat-desc">Record sales even without internet.</div><span className="feat-tag">Offline-first</span></div></div>
            </div>
          </div>
        </section>
      </ScrollReveal>

`;

updated = updated.replace(
  '{/* HOW BUSMO WORKS */}\n',
  featuresSection + '{/* HOW BUSMO WORKS */}\n'
);

fs.writeFileSync(f, updated);
console.log('fix4 done');
