"use client";

import { useId } from "react";
import type {
  CertaintyPhaseChangeSpec,
  CertaintyPhaseChangeStep,
} from "@/lib/interactive/specs/certainty-phase-change";
import {
  getScrollyStepStatus,
  useActiveScrollyStep,
  type ScrollyStepStatus,
} from "../../primitives/useActiveScrollyStep";
import styles from "./CertaintyPhaseChangeScrolly.module.css";

export type CertaintyPhaseChangeScrollyProps = {
  spec: CertaintyPhaseChangeSpec;
};

type Point = { x: number; y: number };

type StoryBeatProps = {
  index: number;
  setRef: (node: HTMLElement | null) => void;
  status: ScrollyStepStatus;
  step: CertaintyPhaseChangeStep;
};

const PARTICLE_STATES: Point[][] = [
  [
    { x: 135, y: 118 },
    { x: 228, y: 205 },
    { x: 312, y: 92 },
    { x: 407, y: 163 },
    { x: 512, y: 103 },
    { x: 621, y: 193 },
    { x: 738, y: 126 },
    { x: 285, y: 287 },
    { x: 476, y: 263 },
    { x: 652, y: 292 },
    { x: 170, y: 316 },
    { x: 770, y: 254 },
  ],
  [
    { x: 285, y: 205 },
    { x: 165, y: 125 },
    { x: 170, y: 290 },
    { x: 335, y: 110 },
    { x: 450, y: 205 },
    { x: 390, y: 120 },
    { x: 510, y: 115 },
    { x: 405, y: 300 },
    { x: 615, y: 205 },
    { x: 565, y: 115 },
    { x: 735, y: 130 },
    { x: 690, y: 300 },
  ],
  [
    { x: 330, y: 146 },
    { x: 410, y: 146 },
    { x: 490, y: 146 },
    { x: 570, y: 146 },
    { x: 330, y: 226 },
    { x: 410, y: 226 },
    { x: 490, y: 226 },
    { x: 570, y: 226 },
    { x: 330, y: 306 },
    { x: 410, y: 306 },
    { x: 490, y: 306 },
    { x: 570, y: 306 },
  ],
  [
    { x: 260, y: 338 },
    { x: 294, y: 338 },
    { x: 328, y: 338 },
    { x: 362, y: 338 },
    { x: 408, y: 338 },
    { x: 442, y: 338 },
    { x: 476, y: 338 },
    { x: 510, y: 338 },
    { x: 556, y: 338 },
    { x: 590, y: 338 },
    { x: 624, y: 338 },
    { x: 658, y: 338 },
  ],
];

const REPEATED_DECISION_ANCHORS = new Set([0, 4, 8]);

const REPEATED_DECISION_PATHS = [
  "M165 125 C205 125 240 180 285 205",
  "M170 290 C215 285 245 230 285 205",
  "M335 110 C325 150 315 185 285 205",
  "M390 120 C405 150 425 185 450 205",
  "M510 115 C495 150 475 185 450 205",
  "M405 300 C420 270 435 230 450 205",
  "M565 115 C575 150 590 185 615 205",
  "M735 130 C690 135 655 180 615 205",
  "M690 300 C670 270 645 230 615 205",
] as const;

const LATTICE_LINES = [
  [0, 1], [1, 2], [2, 3],
  [4, 5], [5, 6], [6, 7],
  [8, 9], [9, 10], [10, 11],
  [0, 4], [4, 8], [1, 5], [5, 9],
  [2, 6], [6, 10], [3, 7], [7, 11],
] as const;

const NEW_EDGE_POINTS = [
  { x: 260, y: 150 },
  { x: 350, y: 220 },
  { x: 438, y: 135 },
  { x: 520, y: 205 },
  { x: 628, y: 145 },
] as const;

const PHASE_LABELS = [
  "Alternatives open",
  "Decision repeated",
  "Rule encoded",
  "Next problem",
] as const;

const PhaseDiagram = ({
  activeIndex,
  description,
  steps,
}: {
  activeIndex: number;
  description: string;
  steps: CertaintyPhaseChangeStep[];
}) => {
  const activeStep = steps[activeIndex];
  const particleState = PARTICLE_STATES[activeIndex] ?? PARTICLE_STATES[0];
  const latticeState = PARTICLE_STATES[2];

  return (
    <div
      aria-label={`${description} Step ${activeIndex + 1} of ${steps.length}: ${activeStep.label}.`}
      className={styles.diagram}
      role="img"
    >
      <div aria-hidden="true" className={styles.readout}>
        <span>Decision phase · {String(activeIndex + 1).padStart(2, "0")}</span>
        <strong>{PHASE_LABELS[activeIndex]}</strong>
      </div>

      <svg
        aria-hidden="true"
        className={styles.visual}
        focusable="false"
        preserveAspectRatio="xMidYMid meet"
        viewBox="0 0 900 470"
      >
        <g className={styles.grid}>
          {[110, 210, 310, 410].map((y) => (
            <line key={y} x1="70" x2="830" y1={y} y2={y} />
          ))}
          {[150, 300, 450, 600, 750].map((x) => (
            <line key={x} x1={x} x2={x} y1="70" y2="430" />
          ))}
        </g>

        <g className={`${styles.repeatPaths} ${activeIndex === 1 ? styles.visible : ""}`}>
          {REPEATED_DECISION_PATHS.map((path) => (
            <path d={path} key={path} />
          ))}
        </g>

        <g className={`${styles.lattice} ${activeIndex === 2 ? styles.visible : ""}`}>
          {LATTICE_LINES.map(([from, to]) => (
            <line
              key={`${from}-${to}`}
              x1={latticeState[from].x}
              x2={latticeState[to].x}
              y1={latticeState[from].y}
              y2={latticeState[to].y}
            />
          ))}
        </g>

        <g className={`${styles.platform} ${activeIndex === 3 ? styles.visible : ""}`}>
          <path d="M205 305 H695 L658 395 H242 Z" />
          <line x1="242" x2="658" y1="395" y2="395" />
          <text x="450" y="378">OWNED DETERMINISTIC CORE</text>
        </g>

        <g className={`${styles.newEdge} ${activeIndex === 3 ? styles.visible : ""}`}>
          {NEW_EDGE_POINTS.map((point, index) => (
            <g key={`${point.x}-${point.y}`} transform={`translate(${point.x} ${point.y})`}>
              <circle r={index === 2 ? 8 : 5} />
              <circle className={styles.newEdgeHalo} r={index === 2 ? 20 : 14} />
            </g>
          ))}
          <text x="450" y="78">NEXT UNCERTAIN EDGE</text>
        </g>

        <g className={styles.particles}>
          {particleState.map((point, index) => {
            const isRepeatedDecision =
              activeIndex === 1 && REPEATED_DECISION_ANCHORS.has(index);
            const isEncodedDecision = activeIndex === 2;

            return (
              <g
                className={`${styles.particle} ${
                  isRepeatedDecision
                    ? styles.repeatedDecision
                    : isEncodedDecision
                      ? styles.encodedDecision
                      : ""
                }`}
                key={index}
                style={{ transform: `translate(${point.x}px, ${point.y}px)` }}
              >
                <g className={styles.particleShape}>
                  <circle className={styles.particleHalo} r="13" />
                  <circle className={styles.particleCore} r="4" />
                </g>
                <g className={styles.particleEmphasis}>
                  <circle className={styles.particleEmphasisHalo} r="13" />
                  <circle className={styles.particleEmphasisCore} r="4" />
                </g>
              </g>
            );
          })}
        </g>

        <g className={`${styles.artifacts} ${activeIndex >= 2 ? styles.visible : ""}`}>
          {[
            [268, "API"],
            [388, "SCHEMA"],
            [508, "TESTS"],
            [628, "POLICY"],
          ].map(([x, label]) => (
            <g key={label} transform={`translate(${x} 435)`}>
              <rect height="24" rx="12" width="96" x="-48" y="-16" />
              <text y="1">{label}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
};

const StoryBeat = ({ index, setRef, status, step }: StoryBeatProps) => (
  <article
    ref={setRef}
    aria-current={status === "active" ? "step" : undefined}
    className={`${styles.beat} ${styles[status]}`}
  >
    <div>
      <p className={styles.beatLabel}>
        Phase {String(index + 1).padStart(2, "0")} · {step.label}
      </p>
      <h2>{step.title}</h2>
      <p>{step.body}</p>
    </div>
  </article>
);

export const CertaintyPhaseChangeScrolly = ({
  spec,
}: CertaintyPhaseChangeScrollyProps) => {
  const titleId = useId();
  const { activeIndex, registerStep, sectionRef, stageRef } =
    useActiveScrollyStep({
      desktopTargetViewportRatio: 0.68,
      mobileStageOffset: 32,
      stepCount: spec.steps.length,
    });

  return (
    <section
      ref={sectionRef}
      aria-labelledby={titleId}
      className={`interactive-breakout ${styles.section}`}
      data-active-step={activeIndex + 1}
    >
      <div className={styles.layout}>
        <div ref={stageRef} className={styles.stage}>
          <div className={styles.stageInner}>
            <p className={styles.eyebrow}>{spec.eyebrow}</p>
            <h2 id={titleId}>{spec.title}</h2>
            <PhaseDiagram
              activeIndex={activeIndex}
              description={spec.description}
              steps={spec.steps}
            />
          </div>
        </div>

        <div className={styles.steps}>
          {spec.steps.map((step, index) => (
            <StoryBeat
              key={`${step.label}-${step.title}`}
              index={index}
              setRef={(node) => registerStep(index, node)}
              status={getScrollyStepStatus(index, activeIndex)}
              step={step}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
