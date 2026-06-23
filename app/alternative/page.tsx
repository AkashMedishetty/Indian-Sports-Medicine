import Navbar from '@/components/Navbar';
import PremiumHero from '@/components/PremiumHero';
import WelcomeSection from '@/components/WelcomeSection';
import WelcomeLetter from '@/components/WelcomeLetter';
import PricingSection from '@/components/PricingSection';
import ExploreHyderabad from '@/components/ExploreHyderabad';
import CommitteeSection from '@/components/CommitteeSection';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';

export default function AlternativePage() {
  return (
    <main className="relative">
      <Navbar />
      <PremiumHero />
      <WelcomeLetter />
      <WelcomeSection />
      <PricingSection />
      <CommitteeSection />
      <ExploreHyderabad />
      <CTASection />
      <Footer />
    </main>
  );
}
