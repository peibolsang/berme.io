"use client";

import { useId } from "react";
import type {
  AssumptionAvalancheSpec,
  AssumptionAvalancheStep,
} from "@/lib/interactive/specs/assumption-avalanche";
import {
  getScrollyStepStatus,
  useActiveScrollyStep,
  type ScrollyStepStatus,
} from "../../primitives/useActiveScrollyStep";
import styles from "./AssumptionAvalancheScrolly.module.css";

export type AssumptionAvalancheScrollyProps = {
  spec: AssumptionAvalancheSpec;
};

type StoryBeatProps = {
  index: number;
  setRef: (node: HTMLElement | null) => void;
  status: ScrollyStepStatus;
  step: AssumptionAvalancheStep;
};

const DECISION_AREAS = [
  { detail: "Guests + hosts", label: "Audience" },
  { detail: "Price + cancellation", label: "Booking" },
  { detail: "Identity + payouts", label: "Trust" },
  { detail: "Support + compliance", label: "Operations" },
  { detail: "Review + hard limits", label: "Guardrails" },
] as const;

const AssumptionDiagram = ({
  activeIndex,
  description,
  steps,
}: {
  activeIndex: number;
  description: string;
  steps: AssumptionAvalancheStep[];
}) => {
  const activeStep = steps[activeIndex];
  const isBounded = activeIndex === steps.length - 1;

  return (
    <div
      aria-label={`${description} Step ${activeIndex + 1} of ${steps.length}: ${activeStep.label}.`}
      className={styles.diagram}
      role="img"
    >
      <div aria-hidden="true" className={styles.chrome}>
        <span>Rural rental · assumption review</span>
        <strong>{isBounded ? "Constraints added" : "Agent output"}</strong>
      </div>

      <div aria-hidden="true" className={styles.product}>
        <div className={styles.browserBar}>
          <span className={styles.browserLights}>
            <i />
            <i />
            <i />
          </span>
          <span className={styles.browserAddress}>
            <b>ruralstays.local</b>
            <em>/asturias</em>
          </span>
          <span className={styles.browserState}>Preview</span>
        </div>
        <div className={styles.landscape}>
          <svg
            focusable="false"
            preserveAspectRatio="xMidYMid slice"
            viewBox="0 0 360 180"
          >
            <path d="M0 146 74 78l42 39 57-78 95 107Z" />
            <path d="m119 146 55-55 33 30 34-48 71 73Z" />
            <circle cx="298" cy="38" r="17" />
            <rect height="45" rx="3" width="58" x="144" y="101" />
            <path d="m137 107 36-30 37 30" />
          </svg>
          <span>Instant book</span>
        </div>
        <div className={styles.listingCopy}>
          <div>
            <span>Cangas de Onís</span>
            <strong>Casa del Norte</strong>
          </div>
          <b>€128</b>
        </div>
        <div className={styles.listingSignals}>
          <span>Available</span>
          <span>Verified</span>
          <span>Protected</span>
        </div>
      </div>

      <div aria-hidden="true" className={styles.ledger}>
        <div className={styles.ledgerHeading}>
          <span>Decision ledger</span>
          <strong>{isBounded ? "Team decides" : "Agent guesses"}</strong>
        </div>
        <div className={styles.ledgerRows}>
          {DECISION_AREAS.map((area, index) => {
            const state = isBounded
              ? index < activeIndex
                ? "Named"
                : index === activeIndex
                  ? "Review"
                  : "Open"
              : index <= activeIndex
                ? "Guessed"
                : "Open";

            return (
              <div
                className={`${styles.ledgerRow} ${index <= activeIndex ? styles.reached : ""} ${index === activeIndex ? styles.active : ""} ${isBounded && index < activeIndex ? styles.constrained : ""}`}
                key={area.label}
              >
                <i />
                <span>{area.label}</span>
                <strong>{area.detail}</strong>
                <b>{state}</b>
              </div>
            );
          })}
        </div>
        <div
          className={`${styles.loadMeter} ${isBounded ? styles.bounded : ""}`}
        >
          <span>{isBounded ? "Boundaries made explicit" : "Guesswork shipped"}</span>
          <div>
            <i style={{ width: `${((activeIndex + 1) / steps.length) * 100}%` }} />
          </div>
        </div>
      </div>
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
        Decision {String(index + 1).padStart(2, "0")} · {step.label}
      </p>
      <h2>{step.title}</h2>
      <p>{step.body}</p>
    </div>
  </article>
);

export const AssumptionAvalancheScrolly = ({
  spec,
}: AssumptionAvalancheScrollyProps) => {
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
            <AssumptionDiagram
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
