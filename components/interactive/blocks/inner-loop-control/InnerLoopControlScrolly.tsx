"use client";

import { useId } from "react";
import type {
  InnerLoopControlSpec,
  InnerLoopControlStep,
} from "@/lib/interactive/specs/inner-loop-control";
import {
  getScrollyStepStatus,
  useActiveScrollyStep,
  type ScrollyStepStatus,
} from "../../primitives/useActiveScrollyStep";
import styles from "./InnerLoopControlScrolly.module.css";

export type InnerLoopControlScrollyProps = {
  spec: InnerLoopControlSpec;
};

type StoryBeatProps = {
  index: number;
  setRef: (node: HTMLElement | null) => void;
  status: ScrollyStepStatus;
  step: InnerLoopControlStep;
};

const VIEWBOX_WIDTH = 820;
const VIEWBOX_HEIGHT = 390;
const CONTROL_POINTS = [
  { x: 108, y: 176 },
  { x: 258, y: 134 },
  { x: 410, y: 176 },
  { x: 562, y: 134 },
  { x: 712, y: 176 },
] as const;
const CONTROL_PATH = "M108 176 L258 134 L410 176 L562 134 L712 176";
const RETURN_PATH = "M712 176 C760 298 640 330 410 330 C180 330 62 298 108 176";
const CHECK_LABELS = ["Intent", "Risk", "Scope", "Checks", "Direction"] as const;

const ControlDiagram = ({
  activeIndex,
  description,
  steps,
}: {
  activeIndex: number;
  description: string;
  steps: InnerLoopControlStep[];
}) => {
  const gridId = useId();
  const activeStep = steps[activeIndex];
  const packet = CONTROL_POINTS[activeIndex];
  const progress = activeIndex === 0 ? 1 : (activeIndex / (steps.length - 1)) * 100;
  const showsReturn = activeIndex === steps.length - 1;

  return (
    <div
      aria-label={`${description} Step ${activeIndex + 1} of ${steps.length}: ${activeStep.label}.`}
      className={styles.diagram}
      role="img"
    >
      <div aria-hidden="true" className={styles.readout}>
        <span>Bounded task · control circuit</span>
        <strong>
          Point {String(activeIndex + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
        </strong>
      </div>

      <svg
        aria-hidden="true"
        className={styles.visual}
        focusable="false"
        preserveAspectRatio="xMidYMid meet"
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      >
        <defs>
          <pattern height="28" id={gridId} patternUnits="userSpaceOnUse" width="28">
            <path d="M28 0H0V28" />
          </pattern>
        </defs>
        <rect className={styles.grid} fill={`url(#${gridId})`} height={VIEWBOX_HEIGHT} width={VIEWBOX_WIDTH} />

        <path className={styles.controlTrack} d={CONTROL_PATH} pathLength="100" />
        <path
          className={styles.controlTrace}
          d={CONTROL_PATH}
          pathLength="100"
          strokeDasharray={`${progress} 100`}
        />
        <path className={`${styles.returnTrack} ${showsReturn ? styles.visible : ""}`} d={RETURN_PATH} />

        {steps.map((step, index) => {
          const point = CONTROL_POINTS[index];
          const status = getScrollyStepStatus(index, activeIndex);

          return (
            <g
              className={`${styles.gate} ${styles[status]}`}
              key={`${step.label}-${step.title}`}
              transform={`translate(${point.x} ${point.y})`}
            >
              <circle className={styles.gateHalo} r="28" />
              <circle className={styles.gateCore} r="14" />
              <text y="4">{index + 1}</text>
              <text className={styles.gateLabel} y="57">{step.label}</text>
            </g>
          );
        })}

        <g className={styles.packet} transform={`translate(${packet.x} ${packet.y})`}>
          <circle r="8" />
          <path d="M-3 0H3M0-3V3" />
        </g>

        <g className={styles.constraintBus}>
          <line x1="86" x2="734" y1="270" y2="270" />
          {CHECK_LABELS.map((label, index) => (
            <g
              className={index <= activeIndex ? styles.reached : ""}
              key={label}
              transform={`translate(${CONTROL_POINTS[index].x} 270)`}
            >
              <circle r="6" />
              <text y="30">{label}</text>
            </g>
          ))}
        </g>
      </svg>

      <div aria-hidden="true" className={styles.statusPanel}>
        <span>Human judgment</span>
        <strong>{activeIndex === 2 ? "Watching the boundary" : "Changing the conditions"}</strong>
      </div>

      <div aria-hidden="true" className={`${styles.returnLabel} ${showsReturn ? styles.visible : ""}`}>
        New evidence returns to the brief
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
        Control point {String(index + 1).padStart(2, "0")} · {step.label}
      </p>
      <h2>{step.title}</h2>
      <p>{step.body}</p>
    </div>
  </article>
);

export const InnerLoopControlScrolly = ({
  spec,
}: InnerLoopControlScrollyProps) => {
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
            <ControlDiagram
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
