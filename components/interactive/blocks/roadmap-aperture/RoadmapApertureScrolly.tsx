"use client";

import { useId } from "react";
import type {
  RoadmapApertureSpec,
  RoadmapApertureStep,
} from "@/lib/interactive/specs/roadmap-aperture";
import {
  getScrollyStepStatus,
  useActiveScrollyStep,
  type ScrollyStepStatus,
} from "../../primitives/useActiveScrollyStep";
import styles from "./RoadmapApertureScrolly.module.css";

export type RoadmapApertureScrollyProps = {
  spec: RoadmapApertureSpec;
};

type StoryBeatProps = {
  index: number;
  setRef: (node: HTMLElement | null) => void;
  status: ScrollyStepStatus;
  step: RoadmapApertureStep;
};

const OPTIONS = [
  { label: "Ranking", y: 82 },
  { label: "Navigation", y: 166 },
  { label: "Metadata", y: 250 },
  { label: "Search", y: 334 },
] as const;

const RoadmapScope = ({
  activeIndex,
  description,
  steps,
}: {
  activeIndex: number;
  description: string;
  steps: RoadmapApertureStep[];
}) => {
  const activeStep = steps[activeIndex];
  const isQuestionOpen = activeIndex >= 1;
  const areOptionsVisible = activeIndex >= 2;
  const isEvidenceVisible = activeIndex >= 3;
  const isOutcomeVisible = activeIndex >= 4;

  return (
    <div
      aria-label={`${description} Step ${activeIndex + 1} of ${steps.length}: ${activeStep.label}.`}
      className={styles.scope}
      role="img"
    >
      <div aria-hidden="true" className={styles.readout}>
        <span>{isQuestionOpen ? "Roadmap question" : "Feature ticket"}</span>
        <strong>{activeStep.label}</strong>
      </div>

      <svg
        aria-hidden="true"
        className={styles.visual}
        focusable="false"
        preserveAspectRatio="xMidYMid meet"
        viewBox="0 0 760 430"
      >
        <g className={`${styles.ticket} ${isQuestionOpen ? styles.folded : ""}`}>
          <rect height="142" rx="13" width="190" x="32" y="144" />
          <path d="M 54 177 H 116 M 54 194 H 178 M 54 211 H 156" />
          <text x="127" y="248">Build search bar</text>
        </g>

        <path
          className={`${styles.beam} ${isQuestionOpen ? styles.visible : ""}`}
          d="M 64 215 H 303"
        />

        <g className={`${styles.aperture} ${isQuestionOpen ? styles.open : ""}`}>
          <path d="M 318 78 V 179 L 300 215 L 318 251 V 352" />
          <path d="M 354 78 V 179 L 372 215 L 354 251 V 352" />
          <circle cx="336" cy="215" r="23" />
          <text x="336" y="224">?</text>
        </g>

        <g className={`${styles.options} ${areOptionsVisible ? styles.visible : ""}`}>
          {OPTIONS.map((option, index) => (
            <g
              key={option.label}
              className={`${styles.option} ${isOutcomeVisible && index !== 1 ? styles.muted : ""}`}
            >
              <path d={`M 372 215 C 440 215, 448 ${option.y}, 515 ${option.y}`} />
              <rect height="46" rx="9" width="124" x="515" y={option.y - 23} />
              <text x="577" y={option.y + 5}>{option.label}</text>
            </g>
          ))}
        </g>

        <g className={`${styles.evidence} ${isEvidenceVisible ? styles.visible : ""}`}>
          <path d="M 496 382 H 658" />
          {[520, 558, 596, 634].map((x) => (
            <circle key={x} cx={x} cy="382" r="5" />
          ))}
          <text x="577" y="408">Time · wrong turns · failed queries</text>
        </g>

        <g className={`${styles.outcome} ${isOutcomeVisible ? styles.visible : ""}`}>
          <path d="M 639 166 C 690 166 690 215 704 215" />
          <circle cx="704" cy="215" r="34" />
          <path d="M 688 216 L 700 228 L 721 201" />
        </g>
      </svg>

      <div
        aria-hidden="true"
        className={`${styles.question} ${isQuestionOpen ? styles.visible : ""}`}
      >
        <span>Keep this fixed</span>
        <strong>Reduce the time to a specific document</strong>
      </div>

      <div aria-hidden="true" className={styles.footer}>
        <span>
          Inquiry {String(activeIndex + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
        </span>
        <span className={isOutcomeVisible ? styles.proven : ""}>
          Keep the outcome. Replace the answer.
        </span>
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
        Inquiry {String(index + 1).padStart(2, "0")} · {step.label}
      </p>
      <h2>{step.title}</h2>
      <p>{step.body}</p>
    </div>
  </article>
);

export const RoadmapApertureScrolly = ({
  spec,
}: RoadmapApertureScrollyProps) => {
  const titleId = useId();
  const { activeIndex, registerStep, sectionRef, stageRef } =
    useActiveScrollyStep({ stepCount: spec.steps.length });

  return (
    <section
      ref={sectionRef}
      aria-labelledby={titleId}
      className={`interactive-breakout ${styles.root}`}
      data-active-step={activeIndex + 1}
    >
      <div className={styles.layout}>
        <div ref={stageRef} className={styles.stage}>
          <div className={styles.stageInner}>
            <p className={styles.eyebrow}>{spec.eyebrow}</p>
            <h2 id={titleId}>{spec.title}</h2>
            <RoadmapScope
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
