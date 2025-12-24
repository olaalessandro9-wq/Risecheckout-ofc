import { useScroll, useTransform } from "framer-motion";
import {
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
    <div className="min-h-screen bg-[#0A0A0B] text-slate-200 overflow-x-hidden selection:bg-blue-500/30 selection:text-white">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px]" />
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
    </div>
  );
}
