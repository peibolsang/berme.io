"use client";

import { useId } from "react";
import type {
  ArticleEvidenceWorkbenchSpec,
  ArticleEvidenceWorkbenchStep,
} from "@/lib/interactive/specs/article-evidence-workbench";
import {
  getScrollyStepStatus,
  useActiveScrollyStep,
  type ScrollyStepStatus,
} from "../../primitives/useActiveScrollyStep";
import styles from "./ArticleEvidenceWorkbenchScrolly.module.css";

export type ArticleEvidenceWorkbenchScrollyProps = {
  spec: ArticleEvidenceWorkbenchSpec;
};

type StoryBeatProps = {
  index: number;
  setRef: (node: HTMLElement | null) => void;
  status: ScrollyStepStatus;
  step: ArticleEvidenceWorkbenchStep;
};

const PROOF_LABELS = [
  "Notion intent",
  "Corpus evidence",
  "Voice contract",
  "Named findings",
  "Pablo's decision",
  "GitHub issue",
] as const;

const ArticleDesk = ({
  activeIndex,
  description,
  steps,
}: {
  activeIndex: number;
  description: string;
  steps: ArticleEvidenceWorkbenchStep[];
}) => {
  const activeStep = steps[activeIndex];
  const showsDraft = activeIndex >= 2;
  const showsFindings = activeIndex === 3;
  const showsReview = activeIndex === 4;
  const showsPublished = activeIndex === steps.length - 1;

  return (
    <div
      aria-label={`${description} Step ${activeIndex + 1} of ${steps.length}: ${activeStep.label}.`}
      className={styles.desk}
      role="img"
    >
      <div aria-hidden="true" className={styles.deskHeader}>
        <span>Article proof desk · issue draft</span>
        <strong>{showsPublished ? "Approved" : "Working"}</strong>
      </div>

      <div aria-hidden="true" className={styles.workspace}>
        <div className={styles.sourceTray}>
          <span className={styles.trayLabel}>Selected material</span>
          <div className={`${styles.sourceCard} ${activeIndex >= 0 ? styles.reached : ""}`}>
            <i>NT</i><span>Intent notes</span>
          </div>
          <div className={`${styles.sourceCard} ${activeIndex >= 1 ? styles.reached : ""}`}>
            <i>GH</i><span>Prior issues</span>
          </div>
          <div className={`${styles.sourceCard} ${activeIndex >= 1 ? styles.reached : ""}`}>
            <i>EV</i><span>Evidence handoff</span>
          </div>
        </div>

        <div className={`${styles.manuscript} ${showsPublished ? styles.published : ""}`}>
          <div className={styles.paperChrome}>
            <span>draft.md</span>
            <b>{String(activeIndex + 1).padStart(2, "0")}/{String(steps.length).padStart(2, "0")}</b>
          </div>
          <div className={styles.paperBody}>
            <span className={styles.paperEyebrow}>{activeStep.label}</span>
            <strong>{activeStep.title}</strong>
            <div className={styles.copyLines}>
              <i /><i /><i /><i /><i />
            </div>
            <div className={`${styles.findings} ${showsFindings ? styles.visible : ""}`}>
              <span>Unsupported claim</span>
              <span>Repeated cadence</span>
              <span>Prohibited formula</span>
            </div>
            <div className={`${styles.reviewMark} ${showsReview ? styles.visible : ""}`}>
              <span>Does this still sound like me?</span>
            </div>
            <div className={`${styles.publishMark} ${showsPublished ? styles.visible : ""}`}>
              <span>Publish as GitHub issue</span><b>✓</b>
            </div>
          </div>
          <div className={`${styles.cursor} ${showsDraft && !showsPublished ? styles.visible : ""}`} />
        </div>

        <div className={styles.proofRail}>
          <span className={styles.trayLabel}>Evidence attached</span>
          {steps.map((step, index) => {
            const status = getScrollyStepStatus(index, activeIndex);
            return (
              <div className={`${styles.proof} ${styles[status]}`} key={`${step.label}-${index}`}>
                <i>{status === "future" ? "○" : "✓"}</i>
                <span>{PROOF_LABELS[index] ?? step.label}</span>
              </div>
            );
          })}
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
        Draft pass {String(index + 1).padStart(2, "0")} · {step.label}
      </p>
      <h2>{step.title}</h2>
      <p>{step.body}</p>
    </div>
  </article>
);

export const ArticleEvidenceWorkbenchScrolly = ({
  spec,
}: ArticleEvidenceWorkbenchScrollyProps) => {
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
            <ArticleDesk
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
