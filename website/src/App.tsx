import React from "react";
import { Navbar, Hero, TrustBar, Features, PainPoints, ScreenshotGallery, HowItWorks, Comparison, UseCases, Testimonials, Newsletter, FAQ, DownloadCTA, Footer, VideoDemo } from "./sections";
import { SocialProofTicker } from "./components/SocialProofTicker";
import { FloatingCTA } from "./components/FloatingCTA";
import { ExitIntent } from "./components/ExitIntent";
import { ScrollProgress } from "./components/ScrollProgress";
import { AnimatedStats } from "./components/AnimatedStats";

export const App: React.FC = () => {
  return (
    <div style={{ fontFamily: "\"Inter\", system-ui, sans-serif" }}>
      <ScrollProgress />
      <Navbar />
      <Hero />
      <TrustBar />
      <SocialProofTicker />
      <AnimatedStats />
      <div id="features"><Features /></div>
      <PainPoints />
      <VideoDemo />
      <Comparison />
      <UseCases />
      <div id="screenshots"><ScreenshotGallery /></div>
      <HowItWorks />
      <Testimonials />
      <div id="faq"><FAQ /></div>
      <DownloadCTA />
      <Footer />
      <FloatingCTA />
      <ExitIntent />
    </div>
  );
};
