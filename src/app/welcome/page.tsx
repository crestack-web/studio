import "../globals.css"; // Import global CSS for consistent styles
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { DashboardPreview } from './components/DashboardPreview';
import WhoIsBusmoFor from './components/WhoIsBusmoFor';
import { Features } from './components/Features';
import { Testimonials } from './components/Testimonials';
import { FAQ } from './components/FAQ';
import { CTABanner } from './components/CTABanner';
import { Footer } from './components/Footer';

export default function WelcomePage() {
  return (
    <div className="bg-white text-black">
      <Header />
      <Hero />
      <WhoIsBusmoFor />
      <Features />
      <DashboardPreview />
      <Testimonials />
      <FAQ />
      <CTABanner />
      <Footer />
    </div>
  );
}