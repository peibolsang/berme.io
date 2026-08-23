"use client";

import { useId } from "react";
import type {
  AdoptionAmplifierSpec,
  AdoptionAmplifierStep,
} from "@/lib/interactive/specs/adoption-amplifier";
import {
  getScrollyStepStatus,
  useActiveScrollyStep,
  type ScrollyStepStatus,
} from "../../primitives/useActiveScrollyStep";
import styles from "./AdoptionAmplifierScrolly.module.css";

export type AdoptionAmplifierScrollyProps = {
  spec: AdoptionAmplifierSpec;
};

type StoryBeatProps = {
  index: number;
  setRef: (node: HTMLElement | null) => void;
  status: ScrollyStepStatus;
  step: AdoptionAmplifierStep;
};

const SignalBench = ({
  activeIndex,
  description,
  steps,
}: {
  activeIndex: number;
  description: string;
  steps: AdoptionAmplifierStep[];
}) => {
  const activeStep = steps[activeIndex];
  const upperReady = activeIndex >= 1;
  const lowerNoisy = activeIndex >= 2;
  const amplified = activeIndex === 3;

  return (
    <div
      aria-label={`${description} Step ${activeIndex + 1} of ${steps.length}: ${activeStep.label}.`}
      className={styles.bench}
      role="img"
    >
      <div aria-hidden="true" className={styles.benchHeader}>
        <span>Delegation signal bench</span>
        <strong>{String(activeIndex + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}</strong>
      </div>

      <svg
        aria-hidden="true"
        className={styles.visual}
        focusable="false"
        preserveAspectRatio="xMidYMid meet"
        viewBox="0 0 900 500"
      >
        <g className={styles.screws}>
          <circle cx="30" cy="30" r="6" />
          <circle cx="870" cy="30" r="6" />
          <circle cx="30" cy="470" r="6" />
          <circle cx="870" cy="470" r="6" />
        </g>

        <g className={styles.input}>
          <text x="88" y="87">AUTONOMY</text>
          <circle className={styles.inputDial} cx="88" cy="142" r="42" />
          <circle className={styles.inputCore} cx="88" cy="142" r="28" />
          <line
            className={`${styles.needle} ${amplified ? styles.needleHigh : ""}`}
            x1="88"
            x2="88"
            y1="142"
            y2="119"
          />
          <text className={styles.inputCaption} x="88" y="207">SAME AGENT</text>
        </g>

        <path className={styles.splitWire} d="M132 142 H178 V320" />
        <circle className={styles.splitNode} cx="178" cy="142" r="7" />
        <circle className={styles.splitNode} cx="178" cy="320" r="7" />

        <g className={`${styles.channel} ${styles.upperChannel} ${upperReady ? styles.ready : ""}`}>
          <text className={styles.channelTitle} x="214" y="91">EXPLICIT TEAM</text>
          <path className={styles.rail} d="M178 142 H747" />
          {[
            [286, "ARCHITECTURE"],
            [442, "CONSTRAINTS"],
            [598, "FEEDBACK"],
          ].map(([x, label]) => (
            <g className={styles.module} key={label} transform={`translate(${x} 142)`}>
              <rect height="62" rx="5" width="126" x="-63" y="-31" />
              <circle cx="-45" cy="-14" r="4" />
              <text y="5">{label}</text>
            </g>
          ))}
          <g
            className={`${styles.output} ${amplified ? styles.replaced : ""}`}
            transform="translate(806 142)"
          >
            <rect height="84" rx="6" width="92" x="-46" y="-42" />
            <path d="M-27 18 L-10 2 L6 9 L27 -19" />
            <text y="61">THROUGHPUT</text>
          </g>
          <g
            className={`${styles.outcome} ${styles.verifiedOutcome} ${amplified ? styles.outcomeVisible : ""}`}
            transform="translate(806 142)"
          >
            <rect className={styles.outcomeFrame} height="84" rx="6" width="92" x="-46" y="-42" />
            {[-23, -7, 9].map((y) => (
              <g key={y} transform={`translate(0 ${y})`}>
                <rect className={styles.taskSlip} height="12" rx="2" width="56" x="-28" y="-6" />
                <path className={styles.taskCheck} d="M-20 0 L-16 4 L-10 -4" />
                <line className={styles.taskLine} x1="-3" x2="19" y1="0" y2="0" />
              </g>
            ))}
            <text y="61">VERIFIED OUTPUT</text>
          </g>
        </g>

        <g className={`${styles.channel} ${styles.lowerChannel} ${lowerNoisy ? styles.noisy : ""} ${amplified ? styles.amplifiedChannel : ""}`}>
          <text className={styles.channelTitle} x="214" y="269">IMPLICIT TEAM</text>
          <path className={styles.rail} d="M178 320 H747" />
          {[
            [286, "TRIBAL KNOWLEDGE"],
            [442, "OWNERSHIP ?"],
            [598, "LATE SIGNAL"],
          ].map(([x, label]) => (
            <g className={styles.module} key={label} transform={`translate(${x} 320)`}>
              <rect height="62" rx="5" width="126" x="-63" y="-31" />
              <circle cx="-45" cy="-14" r="4" />
              <text y="5">{label}</text>
            </g>
          ))}
          <g
            className={`${styles.output} ${amplified ? styles.replaced : ""}`}
            transform="translate(806 320)"
          >
            <rect height="84" rx="6" width="92" x="-46" y="-42" />
            <path d="M-27 -13 L-9 9 L7 -1 L27 22" />
            <text y="61">UNCERTAINTY</text>
          </g>
          <g
            className={`${styles.outcome} ${styles.queueOutcome} ${amplified ? styles.outcomeVisible : ""}`}
            transform="translate(806 320)"
          >
            <rect className={styles.outcomeFrame} height="84" rx="6" width="92" x="-46" y="-42" />
            <rect className={styles.queueSlip} height="34" rx="3" width="48" x="-31" y="-28" />
            <rect className={styles.queueSlip} height="34" rx="3" width="48" x="-23" y="-20" />
            <rect className={styles.queueSlip} height="34" rx="3" width="48" x="-15" y="-12" />
            <line className={styles.queueLine} x1="-7" x2="21" y1="-2" y2="-2" />
            <line className={styles.queueLine} x1="-7" x2="13" y1="7" y2="7" />
            <text y="61">REVIEW QUEUE</text>
          </g>
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
        Reading {String(index + 1).padStart(2, "0")} · {step.label}
      </p>
      <h2>{step.title}</h2>
      <p>{step.body}</p>
    </div>
  </article>
);

export const AdoptionAmplifierScrolly = ({
  spec,
}: AdoptionAmplifierScrollyProps) => {
  const titleId = useId();
  const { activeIndex, registerStep, sectionRef, stageRef } =
    useActiveScrollyStep({
      desktopTargetViewportRatio: 0.82,
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
            <SignalBench
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
