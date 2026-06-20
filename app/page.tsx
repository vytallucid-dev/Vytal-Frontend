import { SmoothScroll } from "@/components/landing/smooth-scroll";
import { ScrollProgress } from "@/components/landing/scroll-progress";
import { LandingNav } from "@/components/landing/landing-nav";
import { Hero } from "@/components/landing/hero";
import { HealthScoreSection } from "@/components/landing/health-score-section";
import { HowItWorks } from "@/components/landing/how-it-works";
import { PlatformSection } from "@/components/landing/platform-section";
import { StatsBand } from "@/components/landing/stats-band";
import { Testimonials } from "@/components/landing/testimonials";
import { PricingSection } from "@/components/landing/pricing-section";
import { CtaFooter } from "@/components/landing/cta-footer";

export default function LandingPage() {
  return (
    <SmoothScroll>
      <ScrollProgress />
      <main className="relative overflow-x-hidden bg-background">
        <LandingNav />
        <Hero />
        <HealthScoreSection />
        <HowItWorks />
        <PlatformSection />
        <StatsBand />
        <Testimonials />
        <PricingSection />
        <CtaFooter />
      </main>
    </SmoothScroll>
  );
}
