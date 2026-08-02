import React from "react";
import { Navbar, Hero, TrustBar, Features, PainPoints, ScreenshotGallery, HowItWorks, FAQ, DownloadCTA, Footer } from "./sections";

export const App: React.FC = () => {
  return (
    <div style={{ fontFamily: "\"Inter\", system-ui, sans-serif" }}>
      <Navbar />
      <Hero />
      <TrustBar />
      <div id="features"><Features /></div>
      <PainPoints />
      <div id="screenshots"><ScreenshotGallery /></div>
      <HowItWorks />
      <div id="faq"><FAQ /></div>
      <DownloadCTA />
      <Footer />
    </div>
  );
};
