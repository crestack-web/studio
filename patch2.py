import re

with open('src/app/welcome/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Add import
c = c.replace(
    "import { BeforeAfterComparison } from './components/BeforeAfterComparison';\nimport { LangProvider }",
    "import { BeforeAfterComparison } from './components/BeforeAfterComparison';\nimport { ScrollReveal, StaggerContainer, StaggerItem } from './components/ScrollReveal';\nimport { LangProvider }"
)

# Fix duplicate comparison section tag
c = c.replace(
    '<section className="comparison-section"><section className="comparison-section">',
    '<section className="comparison-section">'
)

# Fix double-wrapped CTA scale
c = c.replace(
    '<ScrollReveal direction="up" duration={0.7} delay={0.1}>\n        <ScrollReveal direction="up" duration={0.7} delay={0.1} scale>',
    '<ScrollReveal direction="up" duration={0.7} delay={0.1} scale>'
)

# Close CTA ScrollReveal properly  
c = c.replace(
    '</div>\n\n      {/* FOOTER */}',
    '</div>\n      </ScrollReveal>\n\n      {/* FOOTER */}'
)

# Wrap "Who is Busmo for" section
old_who = '''      {/* WHO IS BUSMO FOR */}
      <section>
        <div className="max-w">
          <div className="section-head">
            <div className="section-label">Who is Busmo for?</div>
            <h2 className="section-title">Your intelligent<br /><em>business operating system.</em></h2>
            <p className="section-sub">From recording sales with natural language to AI-powered insights — Busmo transforms how you run your business.</p>
          </div>
          <div className="paths-grid">
            {/* Business Owner */}
            <StaggerItem direction="up" duration={0.6}><div className="path-card featured">'''

new_who = '''      {/* WHO IS BUSMO FOR */}
      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <section>
          <div className="max-w">
            <div className="section-head">
              <div className="section-label">Who is Busmo for?</div>
              <h2 className="section-title">Your intelligent<br /><em>business operating system.</em></h2>
              <p className="section-sub">From recording sales with natural language to AI-powered insights — Busmo transforms how you run your business.</p>
            </div>
            <StaggerContainer staggerDelay={0.15} className="paths-grid">
              <StaggerItem direction="up" duration={0.6}>
                <div className="path-card featured">'''

c = c.replace(old_who, new_who)

