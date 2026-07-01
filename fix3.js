const fs = require('fs');
const f = 'src/app/welcome/page.tsx';
const c = fs.readFileSync(f, 'utf8');

// Wrap "Who is Busmo for" section
const old_who = `      {/* WHO IS BUSMO FOR */}
      <section>
        <div className="max-w">
          <div className="section-head">
            <div className="section-label">Who is Busmo for?</div>
            <h2 className="section-title">Your intelligent<br /><em>business operating system.</em></h2>
            <p className="section-sub">From recording sales with natural language to AI-powered insights — Busmo transforms how you run your business.</p>
          </div>
          <div className="paths-grid">
            {/* Business Owner */}
            <StaggerItem direction="up" duration={0.6}><div className="path-card featured">`;

const new_who = `      {/* WHO IS BUSMO FOR */}
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
                <div className="path-card featured">`;

const updated = c.replace(old_who, new_who);

fs.writeFileSync(f, updated);
console.log('fix3 part1 done');
