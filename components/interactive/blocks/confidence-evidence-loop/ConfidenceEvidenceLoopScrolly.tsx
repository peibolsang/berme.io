"use client";

import { useId } from "react";
import type {
  ConfidenceEvidenceLoopSpec,
  ConfidenceEvidenceLoopStep,
} from "@/lib/interactive/specs/confidence-evidence-loop";
import {
  getScrollyStepStatus,
  useActiveScrollyStep,
  type ScrollyStepStatus,
} from "../../primitives/useActiveScrollyStep";
import styles from "./ConfidenceEvidenceLoopScrolly.module.css";

export type ConfidenceEvidenceLoopScrollyProps = {
  spec: ConfidenceEvidenceLoopSpec;
};

type StoryBeatProps = {
  index: number;
  setRef: (node: HTMLElement | null) => void;
  status: ScrollyStepStatus;
  step: ConfidenceEvidenceLoopStep;
};

const EVIDENCE_LABELS = [
  "Intent",
  "Run trace",
  "Proof",
  "Checks",
  "Decision",
  "New failures",
] as const;

const getPointX = (index: number, count: number) =>
  count === 1 ? 450 : 105 + (index * 690) / (count - 1);

const ConfidenceInstrument = ({
  activeIndex,
  description,
  steps,
}: {
  activeIndex: number;
  description: string;
  steps: ConfidenceEvidenceLoopStep[];
}) => {
  const gridId = useId();
  const activeStep = steps[activeIndex];
  const activeX = getPointX(activeIndex, steps.length);
  const firstX = getPointX(0, steps.length);
  const lastX = getPointX(steps.length - 1, steps.length);

  return (
    <div
      aria-label={`${description} Step ${activeIndex + 1} of ${steps.length}: ${activeStep.label}.`}
      className={styles.instrument}
      role="img"
    >
      <div aria-hidden="true" className={styles.instrumentHeader}>
        <span>Agent release · evidence ledger</span>
        <strong>
          {String(activeIndex + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
        </strong>
      </div>

      <svg
        aria-hidden="true"
        className={styles.visual}
        focusable="false"
        preserveAspectRatio="xMidYMid meet"
        viewBox="0 0 900 500"
      >
        <defs>
          <pattern height="32" id={gridId} patternUnits="userSpaceOnUse" width="32">
            <path d="M32 0H0V32" />
          </pattern>
        </defs>
        <rect className={styles.grid} fill={`url(#${gridId})`} height="500" width="900" />

        <text className={styles.railLabel} x="34" y="66">ARTIFACT</text>
        <text className={styles.railLabel} x="34" y="294">EVIDENCE</text>
        <line className={styles.rail} x1={firstX} x2={lastX} y1="112" y2="112" />
        <line className={`${styles.rail} ${styles.evidenceRail}`} x1={firstX} x2={lastX} y1="338" y2="338" />

        {steps.map((step, index) => {
          const x = getPointX(index, steps.length);
          const status = getScrollyStepStatus(index, activeIndex);

          return (
            <g className={`${styles.station} ${styles[status]}`} key={`${step.label}-${step.title}`}>
              <line className={styles.coupler} x1={x} x2={x} y1="175" y2="320" />
              <g transform={`translate(${x} 112)`}>
                <rect className={styles.artifactNode} height="52" rx="8" width="82" x="-41" y="-26" />
                <text className={styles.stationIndex} y="4">{String(index + 1).padStart(2, "0")}</text>
                <text className={styles.stationLabel} y="48">{step.label}</text>
              </g>
              <g transform={`translate(${x} 338)`}>
                <circle className={styles.evidenceHalo} r="23" />
                <circle className={styles.evidenceCore} r="10" />
                <text className={styles.evidenceLabel} y="48">
                  {EVIDENCE_LABELS[index] ?? "Evidence"}
                </text>
              </g>
            </g>
          );
        })}

        <g
          className={styles.packet}
          style={{ transform: `translate(${activeX}px, 231px)` }}
        >
          <rect height="66" rx="9" width="108" x="-54" y="-33" />
          <path d="M-30 -9H26M-30 4H17M-30 17H32" />
          <circle cx="35" cy="-13" r="8" />
          <path className={styles.packetCheck} d="M31 -13L34 -10L40 -17" />
        </g>

        <path
          className={`${styles.returnPath} ${activeIndex === steps.length - 1 ? styles.returnVisible : ""}`}
          d={`M${lastX} 370 C${lastX} 452 ${firstX} 452 ${firstX} 370`}
        />
        <text
          className={`${styles.returnLabel} ${activeIndex === steps.length - 1 ? styles.returnVisible : ""}`}
          x="450"
          y="445"
        >
          REAL FAILURES BECOME THE NEXT TESTS
        </text>
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
        Evidence {String(index + 1).padStart(2, "0")} · {step.label}
      </p>
      <h2>{step.title}</h2>
      <p>{step.body}</p>
    </div>
  </article>
);

export const ConfidenceEvidenceLoopScrolly = ({
  spec,
}: ConfidenceEvidenceLoopScrollyProps) => {
  const titleId = useId();
  const { activeIndex, registerStep, sectionRef, stageRef } =
    useActiveScrollyStep({ stepCount: spec.steps.length });

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
            <ConfidenceInstrument
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
