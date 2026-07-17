"use client";

import { useId } from "react";
import type {
  PracticeSpiralSpec,
  PracticeSpiralStep,
} from "@/lib/interactive/specs/practice-spiral";
import {
  getScrollyStepStatus,
  useActiveScrollyStep,
  type ScrollyStepStatus,
} from "../../primitives/useActiveScrollyStep";

export type PracticeSpiralScrollyProps = {
  spec: PracticeSpiralSpec;
};

type SpiralPoint = {
  angle: number;
  x: number;
  y: number;
};

type PracticeNodeProps = {
  index: number;
  point: SpiralPoint;
  status: ScrollyStepStatus;
};

type StoryBeatProps = {
  index: number;
  setRef: (node: HTMLElement | null) => void;
  status: ScrollyStepStatus;
  step: PracticeSpiralStep;
};

const VIEWBOX_SIZE = 680;
const CENTER = VIEWBOX_SIZE / 2;
const OUTER_RADIUS = 286;
const INNER_RADIUS = 110;
const START_ANGLE = -Math.PI * 0.72;
const SPIRAL_ROTATIONS = 1.72;
const SPIRAL_SAMPLE_COUNT = 180;

const getSpiralPoint = (progress: number): SpiralPoint => {
  const radius = OUTER_RADIUS - (OUTER_RADIUS - INNER_RADIUS) * progress;
  const angle = START_ANGLE + progress * SPIRAL_ROTATIONS * Math.PI * 2;

  return {
    angle,
    x: CENTER + Math.cos(angle) * radius,
    y: CENTER + Math.sin(angle) * radius,
  };
};

const getStepProgress = (index: number, stepCount: number) =>
  stepCount === 1 ? 1 : index / (stepCount - 1);

const SPIRAL_PATH = Array.from(
  { length: SPIRAL_SAMPLE_COUNT + 1 },
  (_, index) => getSpiralPoint(index / SPIRAL_SAMPLE_COUNT),
)
  .map(
    ({ x, y }, index) =>
      `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`,
  )
  .join(" ");

const PracticeNode = ({ index, point, status }: PracticeNodeProps) => (
  <g
    className={`practice-spiral__node is-${status}`}
    data-repetition={index + 1}
    transform={`translate(${point.x.toFixed(2)} ${point.y.toFixed(2)}) rotate(${(
      (point.angle * 180) / Math.PI +
      90
    ).toFixed(2)})`}
  >
    <line
      className="practice-spiral__gate"
      x1="-18"
      x2="18"
      y1="0"
      y2="0"
    />
    <circle className="practice-spiral__node-halo" cx="0" cy="0" r="13" />
    <circle className="practice-spiral__node-core" cx="0" cy="0" r="4.5" />
  </g>
);

const PracticeSpiralDiagram = ({
  activeIndex,
  description,
  steps,
}: {
  activeIndex: number;
  description: string;
  steps: PracticeSpiralStep[];
}) => {
  const activeProgress = getStepProgress(activeIndex, steps.length);
  const traceLength = Math.max(1.5, activeProgress * 100);

  return (
    <div
      aria-label={`${description} Step ${activeIndex + 1} of ${steps.length}: ${steps[activeIndex]?.label}.`}
      className="practice-spiral__diagram"
      role="img"
    >
      <div aria-hidden="true" className="practice-spiral__readout">
        <span>
          Rep {String(activeIndex + 1).padStart(2, "0")} /{" "}
          {String(steps.length).padStart(2, "0")}
        </span>
        <strong>{steps[activeIndex]?.label}</strong>
      </div>

      <svg
        aria-hidden="true"
        className="practice-spiral__visual"
        focusable="false"
        preserveAspectRatio="xMidYMid meet"
        viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
      >
        <g className="practice-spiral__field">
          {[286, 220, 154].map((radius) => (
            <circle key={radius} cx={CENTER} cy={CENTER} r={radius} />
          ))}
          <line x1={CENTER} x2={CENTER} y1="40" y2="640" />
          <line x1="40" x2="640" y1={CENTER} y2={CENTER} />
        </g>

        <path className="practice-spiral__track" d={SPIRAL_PATH} />
        <path
          className="practice-spiral__trace"
          d={SPIRAL_PATH}
          pathLength="100"
          strokeDasharray={`${traceLength} 100`}
        />

        {steps.map((step, index) => (
          <PracticeNode
            key={`${step.label}-${step.title}`}
            index={index}
            point={getSpiralPoint(getStepProgress(index, steps.length))}
            status={getScrollyStepStatus(index, activeIndex)}
          />
        ))}

        <g className="practice-spiral__principles-core">
          <circle
            className="practice-spiral__core-orbit"
            cx={CENTER}
            cy={CENTER}
            r="84"
          />
          <circle
            className="practice-spiral__core-disc"
            cx={CENTER}
            cy={CENTER}
            r="68"
          />
          <text x={CENTER} y={CENTER - 8}>FIRST</text>
          <text x={CENTER} y={CENTER + 16}>PRINCIPLES</text>
        </g>
      </svg>
    </div>
  );
};

const StoryBeat = ({ index, setRef, status, step }: StoryBeatProps) => (
  <article
    ref={setRef}
    aria-current={status === "active" ? "step" : undefined}
    className={`practice-spiral__beat is-${status}`}
  >
    <div>
      <p className="practice-spiral__beat-label">
        Rep {String(index + 1).padStart(2, "0")} · {step.label}
      </p>
      <h2>{step.title}</h2>
      <p>{step.body}</p>
    </div>
  </article>
);

export const PracticeSpiralScrolly = ({ spec }: PracticeSpiralScrollyProps) => {
  const titleId = useId();
  const { activeIndex, registerStep, sectionRef, stageRef } =
    useActiveScrollyStep({ stepCount: spec.steps.length });

  return (
    <section
      ref={sectionRef}
      aria-labelledby={titleId}
      className="interactive-breakout practice-spiral"
      data-active-step={activeIndex + 1}
    >
      <div className="practice-spiral__layout">
        <div ref={stageRef} className="practice-spiral__stage">
          <div className="practice-spiral__stage-inner">
            <p className="practice-spiral__eyebrow">{spec.eyebrow}</p>
            <h2 id={titleId}>{spec.title}</h2>
            <PracticeSpiralDiagram
              activeIndex={activeIndex}
              description={spec.description}
              steps={spec.steps}
            />
          </div>
        </div>

        <div className="practice-spiral__steps">
          {spec.steps.map((step, index) => (
            <StoryBeat
              key={`${step.label}-${step.title}`}
              index={index}
              setRef={(node) => {
                registerStep(index, node);
              }}
              status={getScrollyStepStatus(index, activeIndex)}
              step={step}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
