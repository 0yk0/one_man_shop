import React from "react";
import { Composition } from "remotion";
import { LandingPage } from "./LandingPage";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="LandingPage"
        component={LandingPage}
        durationInFrames={300}
        fps={30}
        width={1440}
        height={5200}
      />
    </>
  );
};
