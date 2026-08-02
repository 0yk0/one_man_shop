import React from "react";
import { AbsoluteFill } from "remotion";
import { Navbar } from "./sections/Navbar";
import { Hero } from "./sections/Hero";
import { TrustBar } from "./sections/TrustBar";
import { Features } from "./sections/Features";
import { PainPoints } from "./sections/PainPoints";
import { ScreenshotGallery } from "./sections/ScreenshotGallery";
import { HowItWorks } from "./sections/HowItWorks";
import { FAQ } from "./sections/FAQ";
import { DownloadCTA } from "./sections/DownloadCTA";
import { Footer } from "./sections/Footer";

export const LandingPage: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "white", fontFamily: "\"Inter\", system-ui, sans-serif" }}>
      <Navbar />
      <Hero />
      <TrustBar />
      <div id="features">
        <Features />
      </div>
      <PainPoints />
      <div id="screenshots">
        <ScreenshotGallery />
      </div>
      <HowItWorks />
      <div id="faq">
        <FAQ />
      </div>
      <DownloadCTA />
      <Footer />
    </AbsoluteFill>
  );
};
