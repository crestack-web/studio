import { Button } from "./Button";
import styles from "./Hero.module.css";

export function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroBg}></div>
      <div className={styles.heroInner}>
        <div className={styles.heroBadge}><span></span> Built for Africa's Business Owners</div>
        <h1 className="font-headline text-4xl sm:text-5xl font-extrabold mb-4 text-center">
          Know Your Numbers.<br />
          <em className="not-italic text-purple-700">Grow Your Business.</em>
        </h1>
        <p className="text-lg text-gray-600 max-w-xl mx-auto mb-6 text-center">
          Stop guessing with notebooks and calculators. Busmo gives you instant clarity on your sales, profit, inventory, and cash — so every decision is backed by data.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
          <Button className="btn-primary btn-large">
            Start Free Trial — No Card Needed
          </Button>
          <Button className="btn-outline-large btn-large" variant="outline">
            See Pricing
          </Button>
        </div>
        <div className={styles.heroNote}>14-day free trial · Cancel anytime · Works offline</div>
      </div>
    </section>
  );
}