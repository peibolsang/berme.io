"use client";

import { useId } from "react";
import type {
  AlignmentRelaySpec,
  AlignmentRelayStep,
} from "@/lib/interactive/specs/alignment-relay";
import {
  getScrollyStepStatus,
  useActiveScrollyStep,
  type ScrollyStepStatus,
} from "../../primitives/useActiveScrollyStep";
import styles from "./AlignmentRelayScrolly.module.css";

export type AlignmentRelayScrollyProps = {
  spec: AlignmentRelaySpec;
};

type StoryBeatProps = {
  index: number;
  setRef: (node: HTMLElement | null) => void;
  status: ScrollyStepStatus;
  step: AlignmentRelayStep;
};

const VIEWBOX_WIDTH = 600;
const SIGNAL_Y = 210;

const getNodeX = (index: number, count: number) =>
  72 + (index * (VIEWBOX_WIDTH - 144)) / (count - 1);

const RelayBoard = ({
  activeIndex,
  description,
  steps,
}: {
  activeIndex: number;
  description: string;
  steps: AlignmentRelayStep[];
}) => {
  const activeStep = steps[activeIndex];
  const signalX = getNodeX(activeIndex, steps.length);
  const firstX = getNodeX(0, steps.length);
  const lastX = getNodeX(steps.length - 1, steps.length);

  return (
    <div
      aria-label={`${description} Step ${activeIndex + 1} of ${steps.length}: ${activeStep.label}.`}
      className={styles.board}
      role="img"
    >
      <div aria-hidden="true" className={styles.readout}>
        <span>The story in motion</span>
        <strong>{activeStep.label}</strong>
      </div>

      <svg
        aria-hidden="true"
        className={styles.visual}
        focusable="false"
        preserveAspectRatio="xMidYMid meet"
        viewBox={`0 0 ${VIEWBOX_WIDTH} 390`}
      >
        <g className={styles.fragments}>
          <path d={`M 18 150 H ${firstX - 34} V ${SIGNAL_Y}`} />
          <path d={`M 18 210 H ${firstX - 34}`} />
          <path d={`M 18 270 H ${firstX - 34} V ${SIGNAL_Y}`} />
          <circle cx="18" cy="150" r="4" />
          <circle cx="18" cy="210" r="4" />
          <circle cx="18" cy="270" r="4" />
        </g>

        {steps.slice(0, -1).map((step, index) => {
          const startX = getNodeX(index, steps.length);
          const endX = getNodeX(index + 1, steps.length);

          return (
            <path
              key={`${step.label}-wire`}
              className={`${styles.wire} ${index < activeIndex ? styles.reached : ""}`}
              d={`M ${startX + 24} ${SIGNAL_Y} H ${endX - 24}`}
            />
          );
        })}

        <path
          className={`${styles.feedback} ${activeIndex === steps.length - 1 ? styles.visible : ""}`}
          d={`M ${lastX} ${SIGNAL_Y + 27} C ${lastX} 346, ${firstX} 346, ${firstX} ${SIGNAL_Y + 27}`}
        />

        {steps.map((step, index) => {
          const status = getScrollyStepStatus(index, activeIndex);
          const x = getNodeX(index, steps.length);

          return (
            <g
              key={`${step.label}-${step.title}`}
              className={`${styles.node} ${styles[status]}`}
              transform={`translate(${x} ${SIGNAL_Y})`}
            >
              <circle className={styles.halo} r="29" />
              <circle className={styles.socket} r="18" />
              <circle className={styles.contact} r="5" />
              <text className={styles.number} y="-43">
                {String(index + 1).padStart(2, "0")}
              </text>
              <text className={styles.label} y="52">
                {step.label}
              </text>
            </g>
          );
        })}

        <g
          className={styles.signal}
          transform={`translate(${signalX} ${SIGNAL_Y})`}
        >
          <circle r="12" />
          <circle r="3" />
        </g>
      </svg>

      <div aria-hidden="true" className={styles.footer}>
        <span>
          Relay {String(activeIndex + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
        </span>
        <span className={activeIndex === steps.length - 1 ? styles.returning : ""}>
          User evidence returns to the story
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
        Relay {String(index + 1).padStart(2, "0")} · {step.label}
      </p>
      <h2>{step.title}</h2>
      <p>{step.body}</p>
    </div>
  </article>
);

export const AlignmentRelayScrolly = ({
  spec,
}: AlignmentRelayScrollyProps) => {
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
            <RelayBoard
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
