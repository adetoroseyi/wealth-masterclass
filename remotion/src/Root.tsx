import React from "react";
import { Composition } from "remotion";
import { WealthStatReveal } from "./WealthStatReveal";

// 30fps × 30s = 900 frames total
// Accounts for 5 transitions × 15 frames overlap = 75 frames
// Raw sequence sum: 105+165+225+225+195+60 = 975 → 975-75 = 900 ✓
const FPS = 30;
const DURATION_FRAMES = 900; // 30 seconds

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="WealthStatReveal"
      component={WealthStatReveal}
      durationInFrames={DURATION_FRAMES}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
