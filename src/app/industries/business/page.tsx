import Link from 'next/link';
import { getSuiteFamily } from '@/lib/industries/suite-catalog';
import { SuiteChrome, SuiteProductGrid } from '../_components/SuiteChrome';
import styles from '../_components/SuiteChrome.module.css';

export const metadata = {
  title: 'Busmo Business · Busmo',
  description:
    'Sales, inventory, cashflow, staff and MO — built for everyday SMEs. Control your business even when you are not there.',
};

export default function BusinessSolutionPage() {
  const family = getSuiteFamily('business');

  return (
    <SuiteChrome family={family} sectionLinks>
      <section className={styles.hero}>
        <div className={styles.heroKicker}>Busmo Business</div>
        <h1>Control sales, stock, cash and staff.</h1>
        <p>
          One system for growing African businesses — see what sold, where the money went, and whether you are actually
          making a profit. Built for everyday SMEs.
        </p>
        <div className={styles.heroCtas}>
          <Link href={family.signupHref} className={styles.btnPrimary}>
            Start free trial
          </Link>
          <Link href={family.loginHref} className={styles.btnGhost}>
            Sign in
          </Link>
        </div>
        <p style={{ marginTop: 12, opacity: 0.7, fontSize: 14 }}>14-day free trial · Works offline · Cancel anytime</p>
      </section>

      <div className={styles.sectionTitle}>What you get</div>
      <SuiteProductGrid family={family} />

      <section style={{ marginTop: 40, marginBottom: 24 }}>
        <div className={styles.sectionTitle}>Why Busmo Business</div>
        <div className={styles.productGrid}>
          <article className={styles.productCard}>
            <h3 className={styles.productName}>Sales & stock linked</h3>
            <p className={styles.productBlurb}>
              Every sale updates inventory so you always know what is left — without a second spreadsheet.
            </p>
          </article>
          <article className={styles.productCard}>
            <h3 className={styles.productName}>Cashflow clarity</h3>
            <p className={styles.productBlurb}>
              Money in, money out, and profit in plain language. See the day, the week, and the month.
            </p>
          </article>
          <article className={styles.productCard}>
            <h3 className={styles.productName}>Staff accountability</h3>
            <p className={styles.productBlurb}>
              Know who sold what, when. Roles and activity so the business runs when you are not on the floor.
            </p>
          </article>
          <article className={styles.productCard}>
            <h3 className={styles.productName}>Ask MO</h3>
            <p className={styles.productBlurb}>
              Your AI business assistant — answers about sales, stock and cash from your own numbers.
            </p>
          </article>
        </div>
      </section>

      <section style={{ textAlign: 'center', padding: '48px 16px 64px' }}>
        <h2 style={{ fontSize: 28, marginBottom: 12 }}>Ready to take control?</h2>
        <p style={{ opacity: 0.75, marginBottom: 24, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
          Start with sales and stock. Add cashflow, staff and MO as you grow.
        </p>
        <Link href={family.signupHref} className={styles.btnPrimary}>
          Get started free
        </Link>
      </section>
    </SuiteChrome>
  );
}
