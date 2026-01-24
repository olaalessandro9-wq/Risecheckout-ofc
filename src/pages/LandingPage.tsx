import { useScroll, useTransform } from "framer-motion";
import {
  LandingThemeProvider,
  LandingHeader,
  HeroSection,
  FeaturesSection,
  ConversionSection,
  BuilderSection,
  IntegrationsSection,
  StepsSection,
  TestimonialsSection,
  CtaSection,
  LandingFooter
} from "@/components/landing";

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const headerOpacity = useTransform(scrollYProgress, [0, 0.1], [0, 1]);
  const headerY = useTransform(scrollYProgress, [0, 0.1], [-20, 0]);

  return (
    <LandingThemeProvider>
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[hsl(var(--landing-accent)/0.1)] blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[hsl(var(--landing-purple)/0.1)] blur-[120px]" />
      </div>

      <LandingHeader headerOpacity={headerOpacity} headerY={headerY} />
      <HeroSection />
      <FeaturesSection />
      <ConversionSection />
      <BuilderSection />
      <IntegrationsSection />
      <StepsSection />
      <TestimonialsSection />
      <CtaSection />
      <LandingFooter />
    </LandingThemeProvider>
  );
}
