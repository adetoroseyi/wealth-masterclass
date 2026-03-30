import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
  spring,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";

// ─── Brand tokens ────────────────────────────────────────────────────────────
const BG_DARK = "#0a0a0a";
const BG_SURFACE = "#1a1a2e";
const GOLD = "#D4AF37";
const GOLD_DIM = "rgba(212,175,55,0.15)";
const WHITE = "#ffffff";
const MUTED = "rgba(255,255,255,0.55)";

// ─── Shared layout ────────────────────────────────────────────────────────────
const fullBg: React.CSSProperties = {
  background: `linear-gradient(180deg, ${BG_DARK} 0%, ${BG_SURFACE} 100%)`,
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "80px 60px",
  boxSizing: "border-box",
  fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
};

// ─── Fade-in helper ──────────────────────────────────────────────────────────
function useFadeIn(delayFrames = 0, durationFrames = 18) {
  const frame = useCurrentFrame();
  return interpolate(frame - delayFrames, [0, durationFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
}

function useSlideUp(delayFrames = 0, durationFrames = 20, distancePx = 40) {
  const frame = useCurrentFrame();
  const progress = interpolate(frame - delayFrames, [0, durationFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  return progress * distancePx - distancePx; // returns 0 when fully in
}

// ─── Counter hook ────────────────────────────────────────────────────────────
function useCounter(target: number, startFrame: number, durationFrames: number) {
  const frame = useCurrentFrame();
  const progress = interpolate(frame - startFrame, [0, durationFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return Math.round(progress * target);
}

// ─── Scene 1: Hook (0–3 s → 105 frames) ─────────────────────────────────────
export const Scene1Hook: React.FC = () => {
  const opacity1 = useFadeIn(0, 18);
  const slide1 = useSlideUp(0, 18);
  const opacity2 = useFadeIn(20, 18);
  const slide2 = useSlideUp(20, 18);

  return (
    <AbsoluteFill style={fullBg}>
      {/* Accent bar */}
      <div
        style={{
          width: 4,
          height: 64,
          background: GOLD,
          borderRadius: 2,
          marginBottom: 28,
          opacity: opacity1,
        }}
      />
      <div
        style={{
          opacity: opacity1,
          transform: `translateY(${slide1 + (1 - opacity1) * 40}px)`,
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: 54,
            fontWeight: 800,
            color: WHITE,
            lineHeight: 1.1,
            margin: 0,
            letterSpacing: "-1px",
          }}
        >
          Most people never
          <br />
          <span style={{ color: GOLD }}>build wealth.</span>
        </p>
      </div>
      <div
        style={{
          opacity: opacity2,
          transform: `translateY(${slide2 + (1 - opacity2) * 30}px)`,
          marginTop: 32,
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: 30,
            color: MUTED,
            margin: 0,
            fontWeight: 400,
            lineHeight: 1.5,
          }}
        >
          Not because they don't earn enough.
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 2: Problem / Counter (3–8 s → 165 frames) ────────────────────────
export const Scene2Counter: React.FC = () => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const labelOpacity = useFadeIn(0, 18);
  const counterStart = 20;
  const counterDuration = Math.round(1.5 * fps);
  const count = useCounter(3240, counterStart, counterDuration);

  const barProgress = interpolate(frame - counterStart, [0, counterDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const subOpacity = useFadeIn(counterStart + counterDuration, 18);

  return (
    <AbsoluteFill style={fullBg}>
      <div style={{ opacity: labelOpacity, textAlign: "center", marginBottom: 48 }}>
        <p style={{ fontSize: 26, color: MUTED, margin: 0, fontWeight: 400 }}>
          The average 30-year-old has saved…
        </p>
      </div>

      {/* Big counter */}
      <div style={{ textAlign: "center", position: "relative" }}>
        <p
          style={{
            fontSize: 110,
            fontWeight: 800,
            color: GOLD,
            margin: 0,
            letterSpacing: "-2px",
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          ${count.toLocaleString()}
        </p>

        {/* Animated bar */}
        <div
          style={{
            width: "100%",
            height: 8,
            background: "rgba(255,255,255,0.1)",
            borderRadius: 4,
            marginTop: 32,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${barProgress * 100}%`,
              background: `linear-gradient(90deg, ${GOLD}, rgba(212,175,55,0.5))`,
              borderRadius: 4,
            }}
          />
        </div>
      </div>

      <div
        style={{
          opacity: subOpacity,
          marginTop: 40,
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: 30,
            color: WHITE,
            fontWeight: 700,
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          That's not a savings problem.
          <br />
          <span style={{ color: GOLD }}>It's a strategy problem.</span>
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 3: Social Proof 1 — Marcus (8–15 s → 225 frames) ─────────────────
export const Scene3Marcus: React.FC = () => {
  const { fps } = useVideoConfig();

  const badgeOpacity = useFadeIn(0, 14);
  const nameOpacity = useFadeIn(14, 16);
  const beforeOpacity = useFadeIn(30, 14);
  const arrowOpacity = useFadeIn(44, 12);
  const afterStart = 56;
  const afterOpacity = useFadeIn(afterStart, 18);

  const count = useCounter(23000, afterStart, Math.round(1.5 * fps));

  return (
    <AbsoluteFill style={fullBg}>
      {/* Badge */}
      <div
        style={{
          opacity: badgeOpacity,
          background: GOLD_DIM,
          border: `1px solid ${GOLD}`,
          borderRadius: 100,
          padding: "8px 24px",
          marginBottom: 36,
        }}
      >
        <p
          style={{
            fontSize: 14,
            color: GOLD,
            fontWeight: 700,
            margin: 0,
            letterSpacing: "1.2px",
            textTransform: "uppercase",
          }}
        >
          Real Result
        </p>
      </div>

      {/* Name */}
      <div style={{ opacity: nameOpacity, textAlign: "center" }}>
        <p
          style={{
            fontSize: 44,
            fontWeight: 800,
            color: WHITE,
            margin: 0,
          }}
        >
          Marcus, 29
        </p>
        <p
          style={{
            fontSize: 24,
            color: MUTED,
            margin: "8px 0 0",
            fontWeight: 400,
          }}
        >
          Decent income. Zero savings habit.
        </p>
      </div>

      {/* Before */}
      <div
        style={{
          opacity: beforeOpacity,
          marginTop: 40,
          textAlign: "center",
          padding: "24px 32px",
          background: "rgba(255,255,255,0.04)",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <p style={{ fontSize: 52, fontWeight: 800, color: MUTED, margin: 0 }}>
          $0 saved
        </p>
      </div>

      {/* Arrow */}
      <div
        style={{
          opacity: arrowOpacity,
          margin: "20px 0",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: 36, color: GOLD, margin: 0 }}>↓ 8 months later</p>
      </div>

      {/* After */}
      <div
        style={{
          opacity: afterOpacity,
          textAlign: "center",
          padding: "24px 32px",
          background: "rgba(212,175,55,0.08)",
          borderRadius: 16,
          border: `1px solid ${GOLD}`,
        }}
      >
        <p
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: GOLD,
            margin: 0,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          ${count.toLocaleString()}
        </p>
        <p style={{ fontSize: 20, color: MUTED, margin: "4px 0 0" }}>
          saved
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 4: Social Proof 2 — Priya + James (15–22 s → 225 frames) ─────────
export const Scene4FastStack: React.FC = () => {
  const { fps } = useVideoConfig();

  const headerOpacity = useFadeIn(0, 14);

  const p1Opacity = useFadeIn(20, 16);
  const p1Count = useCounter(41000, 20, Math.round(1.2 * fps));

  const p2Opacity = useFadeIn(70, 16);
  const p2Count = useCounter(100000, 70, Math.round(1.2 * fps));

  return (
    <AbsoluteFill style={fullBg}>
      <div style={{ opacity: headerOpacity, marginBottom: 40, textAlign: "center" }}>
        <p style={{ fontSize: 26, color: MUTED, margin: 0 }}>
          They're not alone.
        </p>
      </div>

      {/* Priya */}
      <div
        style={{
          opacity: p1Opacity,
          width: "100%",
          padding: "28px 36px",
          background: "rgba(212,175,55,0.06)",
          borderRadius: 20,
          border: `1px solid rgba(212,175,55,0.3)`,
          marginBottom: 24,
          boxSizing: "border-box",
        }}
      >
        <p style={{ fontSize: 22, color: MUTED, margin: "0 0 8px", fontWeight: 400 }}>
          Priya — 14 months
        </p>
        <p
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: GOLD,
            margin: 0,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          ${p1Count.toLocaleString()}
        </p>
        <p style={{ fontSize: 18, color: MUTED, margin: "4px 0 0" }}>net worth built</p>
      </div>

      {/* James */}
      <div
        style={{
          opacity: p2Opacity,
          width: "100%",
          padding: "28px 36px",
          background: "rgba(212,175,55,0.06)",
          borderRadius: 20,
          border: `1px solid rgba(212,175,55,0.3)`,
          boxSizing: "border-box",
        }}
      >
        <p style={{ fontSize: 22, color: MUTED, margin: "0 0 8px", fontWeight: 400 }}>
          James — hit $100K before 29
        </p>
        <p
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: GOLD,
            margin: 0,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          ${p2Count.toLocaleString()}
        </p>
        <p style={{ fontSize: 18, color: MUTED, margin: "4px 0 0" }}>net worth</p>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 5: CTA (22–28 s → 195 frames) ────────────────────────────────────
export const Scene5CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = useFadeIn(0, 20);
  const subtitleOpacity = useFadeIn(18, 18);
  const featsOpacity = useFadeIn(36, 18);
  const priceScale = spring({ frame: frame - 60, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill style={fullBg}>
      {/* Product name */}
      <div style={{ opacity: titleOpacity, textAlign: "center", marginBottom: 16 }}>
        <p
          style={{
            fontSize: 19,
            color: GOLD,
            fontWeight: 700,
            letterSpacing: "2.5px",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          The Wealth Masterclass
        </p>
      </div>

      <div style={{ opacity: subtitleOpacity, textAlign: "center", marginBottom: 36 }}>
        <p
          style={{
            fontSize: 52,
            fontWeight: 800,
            color: WHITE,
            margin: 0,
            lineHeight: 1.1,
            letterSpacing: "-1px",
          }}
        >
          Build Your
          <br />
          <span style={{ color: GOLD }}>First $100K</span>
        </p>
      </div>

      {/* Feature list */}
      <div
        style={{
          opacity: featsOpacity,
          width: "100%",
          padding: "28px 32px",
          background: "rgba(255,255,255,0.04)",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.08)",
          marginBottom: 36,
          boxSizing: "border-box",
        }}
      >
        {[
          "📖 34-page step-by-step guide",
          "📊 Excel wealth tracker",
          "📅 90-day action plan",
        ].map((feat, i) => (
          <p
            key={i}
            style={{
              fontSize: 24,
              color: WHITE,
              margin: i === 0 ? 0 : "14px 0 0",
              fontWeight: 500,
            }}
          >
            {feat}
          </p>
        ))}
      </div>

      {/* Price */}
      <div
        style={{
          transform: `scale(${priceScale})`,
          textAlign: "center",
          background: GOLD,
          borderRadius: 16,
          padding: "20px 56px",
        }}
      >
        <p
          style={{
            fontSize: 54,
            fontWeight: 800,
            color: BG_DARK,
            margin: 0,
            letterSpacing: "-1px",
          }}
        >
          Only $29
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 6: End card (28–30 s → 75 frames) ─────────────────────────────────
export const Scene6EndCard: React.FC = () => {
  const logoOpacity = useFadeIn(0, 16);
  const urlOpacity = useFadeIn(18, 18);

  return (
    <AbsoluteFill
      style={{
        ...fullBg,
        background: BG_DARK,
      }}
    >
      {/* Logo / brand mark */}
      <div style={{ opacity: logoOpacity, textAlign: "center", marginBottom: 24 }}>
        <div
          style={{
            width: 72,
            height: 72,
            background: GOLD,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <p style={{ fontSize: 32, margin: 0 }}>✦</p>
        </div>
        <p
          style={{
            fontSize: 38,
            fontWeight: 800,
            color: WHITE,
            margin: 0,
            letterSpacing: "-0.5px",
          }}
        >
          Thrive Richly
        </p>
        <p
          style={{
            fontSize: 18,
            color: MUTED,
            margin: "8px 0 0",
            fontWeight: 400,
            letterSpacing: "1px",
          }}
        >
          Wealth Education
        </p>
      </div>

      {/* URL */}
      <div
        style={{
          opacity: urlOpacity,
          textAlign: "center",
          padding: "16px 40px",
          border: `1px solid ${GOLD}`,
          borderRadius: 12,
        }}
      >
        <p
          style={{
            fontSize: 22,
            color: GOLD,
            margin: 0,
            fontWeight: 600,
            letterSpacing: "0.5px",
          }}
        >
          thriverichly.netlify.app
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ─── Root composition ─────────────────────────────────────────────────────────
// Durations (frames at 30fps):
//   Scene1: 105  Scene2: 165  Scene3: 225  Scene4: 225  Scene5: 195  Scene6: 75
//   5 transitions × 15 frames = 75 frames overlap
//   Total: 990 - 75 = 915... adjusted Scene6 to 60 → 990-75=915 hmm
//   Let's use: S1=105 S2=165 S3=225 S4=225 S5=195 S6=60 → sum=975 - 5×15=900 ✓

const TRANSITION_FRAMES = 15;

export const WealthStatReveal: React.FC = () => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={105}>
        <Scene1Hook />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />

      <TransitionSeries.Sequence durationInFrames={165}>
        <Scene2Counter />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />

      <TransitionSeries.Sequence durationInFrames={225}>
        <Scene3Marcus />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />

      <TransitionSeries.Sequence durationInFrames={225}>
        <Scene4FastStack />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />

      <TransitionSeries.Sequence durationInFrames={195}>
        <Scene5CTA />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />

      <TransitionSeries.Sequence durationInFrames={60}>
        <Scene6EndCard />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
