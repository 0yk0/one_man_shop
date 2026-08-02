import React from "react";
import { Player } from "@remotion/player";
import { LandingPage } from "./remotion/LandingPage";

export const App: React.FC = () => {
  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "white" }}>
      <Player
        component={LandingPage}
        durationInFrames={300}
        compositionWidth={1440}
        compositionHeight={5200}
        fps={30}
        style={{
          width: "100%",
          height: "auto",
        }}
        controls={false}
        autoPlay={true}
        loop={false}
        clickToPlay={false}
        showVolumeControls={false}
        spaceKeyToPlayOrPause={false}
      />
    </div>
  );
};
