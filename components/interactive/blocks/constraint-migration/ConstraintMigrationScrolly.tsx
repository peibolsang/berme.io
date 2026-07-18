"use client";

import { useId, type CSSProperties } from "react";
import type {
  ConstraintMigrationSpec,
  ConstraintMigrationStep,
} from "@/lib/interactive/specs/constraint-migration";
import {
  getScrollyStepStatus,
  useActiveScrollyStep,
  type ScrollyStepStatus,
} from "../../primitives/useActiveScrollyStep";
import styles from "./ConstraintMigrationScrolly.module.css";

export type ConstraintMigrationScrollyProps = {
  spec: ConstraintMigrationSpec;
};

type StoryBeatProps = {
  index: number;
  setRef: (node: HTMLElement | null) => void;
  status: ScrollyStepStatus;
  step: ConstraintMigrationStep;
};

const STAGES = [
  { label: "Intent", x: 104 },
  { label: "Code", x: 286 },
  { label: "Check", x: 468 },
  { label: "Release", x: 650 },
] as const;

const CONSTRAINT_X_BY_STEP = [650, 286, 198, 104, 104] as const;
const CONSTRAINT_LABELS = [
  "Infrastructure",
  "Implementation",
  "In transit",
  "Intent",
  "Intent",
] as const;

const getConstraintX = (activeIndex: number) =>
  CONSTRAINT_X_BY_STEP[
    Math.min(activeIndex, CONSTRAINT_X_BY_STEP.length - 1)
  ];

const ConstraintMigrationDiagram = ({
  activeIndex,
  description,
  steps,
}: {
  activeIndex: number;
  description: string;
  steps: ConstraintMigrationStep[];
}) => {
  const activeStep = steps[activeIndex];
  const constraintLabel =
    CONSTRAINT_LABELS[
      Math.min(activeIndex, CONSTRAINT_LABELS.length - 1)
    ];
  const showsAgentFlow = activeIndex >= 2;
  const showsReviewPressure = activeIndex === 3;
  const showsIntentInputs = activeIndex >= 3;
  const diagramStyle = {
    "--constraint-x": `${getConstraintX(activeIndex)}px`,
  } as CSSProperties;

  return (
    <div
      aria-label={`${description} Step ${activeIndex + 1} of ${steps.length}: ${activeStep.label}.`}
      className={styles.diagram}
      role="img"
      style={diagramStyle}
    >
      <div aria-hidden="true" className={styles.instrumentHeader}>
        <span>Delivery system · live constraint</span>
        <strong>{constraintLabel}</strong>
      </div>

      <svg
        aria-hidden="true"
        className={styles.visual}
        focusable="false"
        preserveAspectRatio="xMidYMid meet"
        viewBox="0 0 760 330"
      >
        <g className={styles.flowRail}>
          <line x1="104" x2="650" y1="168" y2="168" />
          {[195, 377, 559].map((x) => (
            <path d={`M ${x - 9} 162 L ${x} 168 L ${x - 9} 174`} key={x} />
          ))}
        </g>

        <g className={styles.workParcels}>
          {[142, 185, 328, 371, 510, 553, 596].map((x, index) => (
            <rect
              className={
                showsAgentFlow && index < 6 ? styles.parcelActive : undefined
              }
              height="10"
              key={x}
              rx="3"
              width="24"
              x={x}
              y="163"
            />
          ))}
        </g>

        {STAGES.map((stage, index) => {
          const isIntent = index === 0;
          const isReview = index === 2;

          return (
            <g
              className={`${styles.stageNode} ${
                isReview && showsReviewPressure ? styles.pressured : ""
              } ${isIntent && showsIntentInputs ? styles.intentActive : ""}`}
              key={stage.label}
              transform={`translate(${stage.x} 168)`}
            >
              <rect height="68" rx="14" width="112" x="-56" y="-34" />
              <circle cx="0" cy="0" r="7" />
              <text x="0" y="61">{stage.label}</text>
              {isReview && showsReviewPressure ? (
                <text className={styles.pressureLabel} x="0" y="-51">
                  PR QUEUE ↑
                </text>
              ) : null}
            </g>
          );
        })}

        <g className={styles.constraintCollar}>
          <path d="M -36 -42 H 36 M -36 42 H 36" />
          <path d="M -36 -42 V 42 M 36 -42 V 42" />
          <circle cx="0" cy="0" r="11" />
        </g>

        <g
          className={`${styles.intentInputs} ${
            showsIntentInputs ? styles.visible : ""
          }`}
        >
          <line x1="104" x2="104" y1="72" y2="122" />
          <g transform="translate(132 51)">
            <rect height="38" rx="7" width="256" x="-128" y="-19" />
            <text className={styles.intentLabelWide} x="0" y="4">
              PROBLEM · CONTEXT · GOALS · CONSTRAINTS
            </text>
            <text className={styles.intentLabelCompact} x="0" y="-3">
              <tspan x="0">PROBLEM · CONTEXT</tspan>
              <tspan x="0" dy="15">GOALS · CONSTRAINTS</tspan>
            </text>
          </g>
        </g>

        <g className={styles.engineerMarker}>
          <circle cx="0" cy="0" r="5" />
          <path d="M 0 7 V 20 M -9 13 H 9 M 0 20 L -7 30 M 0 20 L 7 30" />
        </g>
      </svg>

      <div aria-hidden="true" className={styles.footerReadout}>
        <span>Engineers follow leverage</span>
        <strong>
          {showsReviewPressure
            ? "Pressure is not the constraint"
            : activeIndex >= 4
              ? "Clarity sets meaningful throughput"
              : "The bottleneck sets the pace"}
        </strong>
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
        Shift {String(index + 1).padStart(2, "0")} · {step.label}
      </p>
      <h2>{step.title}</h2>
      <p>{step.body}</p>
    </div>
  </article>
);

export const ConstraintMigrationScrolly = ({
  spec,
}: ConstraintMigrationScrollyProps) => {
  const titleId = useId();
  const { activeIndex, registerStep, sectionRef, stageRef } =
    useActiveScrollyStep({
      desktopTargetViewportRatio: 0.82,
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
            <ConstraintMigrationDiagram
              activeIndex={activeIndex}
              description={spec.description}
              steps={spec.steps}
            />
          </div>
        </div>

        <div className={styles.steps}>
          {spec.steps.map((step, index) => (
            <StoryBeat
              index={index}
              key={`${step.label}-${step.title}`}
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
