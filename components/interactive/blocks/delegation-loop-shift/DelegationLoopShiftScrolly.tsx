"use client";

import { useId } from "react";
import type {
  DelegationLoopShiftSpec,
  DelegationLoopShiftStep,
} from "@/lib/interactive/specs/delegation-loop-shift";
import {
  getScrollyStepStatus,
  useActiveScrollyStep,
  type ScrollyStepStatus,
} from "../../primitives/useActiveScrollyStep";

export type DelegationLoopShiftScrollyProps = {
  spec: DelegationLoopShiftSpec;
};

type StoryBeatProps = {
  index: number;
  setRef: (node: HTMLElement | null) => void;
  status: ScrollyStepStatus;
  step: DelegationLoopShiftStep;
};

const VIEWBOX_SIZE = 620;
const CENTER = VIEWBOX_SIZE / 2;
const LOOP_RADIUS = 194;

const getLoopPoint = (index: number, count: number) => {
  const angle = -Math.PI / 2 + (index / count) * Math.PI * 2;

  return {
    x: CENTER + Math.cos(angle) * LOOP_RADIUS,
    y: CENTER + Math.sin(angle) * LOOP_RADIUS,
  };
};

const LoopDiagram = ({
  activeIndex,
  description,
  steps,
}: {
  activeIndex: number;
  description: string;
  steps: DelegationLoopShiftStep[];
}) => {
  const activeStep = steps[activeIndex];
  const signal = getLoopPoint(activeIndex, steps.length);
  const progress = ((activeIndex + 1) / steps.length) * 100;

  return (
    <div
      aria-label={`${description} Step ${activeIndex + 1} of ${steps.length}: ${activeStep.label}.`}
      className="delegation-loop__diagram"
      role="img"
    >
      <div aria-hidden="true" className="delegation-loop__readout">
        <span>Trust loop</span>
        <strong>
          {String(activeIndex + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
        </strong>
      </div>

      <svg
        aria-hidden="true"
        className="delegation-loop__visual"
        focusable="false"
        preserveAspectRatio="xMidYMid meet"
        viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
      >
        <g className="delegation-loop__old-loop">
          <circle cx="86" cy="94" r="47" />
          <path d="M 62 94 H 110 M 86 70 V 118" />
        </g>

        <circle
          className="delegation-loop__orbit is-outer"
          cx={CENTER}
          cy={CENTER}
          r={LOOP_RADIUS + 25}
        />
        <circle
          className="delegation-loop__orbit is-inner"
          cx={CENTER}
          cy={CENTER}
          r={LOOP_RADIUS - 38}
        />
        <circle
          className="delegation-loop__track"
          cx={CENTER}
          cy={CENTER}
          pathLength="100"
          r={LOOP_RADIUS}
        />
        <circle
          className="delegation-loop__trace"
          cx={CENTER}
          cy={CENTER}
          pathLength="100"
          r={LOOP_RADIUS}
          strokeDasharray={`${progress} 100`}
        />

        {steps.map((step, index) => {
          const point = getLoopPoint(index, steps.length);
          const status = getScrollyStepStatus(index, activeIndex);

          return (
            <g
              key={`${step.label}-${step.title}`}
              className={`delegation-loop__gate is-${status}`}
              transform={`translate(${point.x.toFixed(2)} ${point.y.toFixed(2)})`}
            >
              <circle className="delegation-loop__gate-halo" r="24" />
              <circle className="delegation-loop__gate-core" r="11" />
              <text y="4">{index + 1}</text>
            </g>
          );
        })}

        <g
          className="delegation-loop__signal"
          transform={`translate(${signal.x.toFixed(2)} ${signal.y.toFixed(2)})`}
        >
          <circle r="19" />
          <circle r="4" />
        </g>
      </svg>

      <div aria-hidden="true" className="delegation-loop__core">
        <span>{activeStep.label}</span>
        <strong>{activeIndex < 2 ? "Shape intent" : "Bounded task"}</strong>
      </div>

      <div aria-hidden="true" className="delegation-loop__trust-rail">
        {steps.map((step, index) => (
          <span
            key={step.label}
            className={index <= activeIndex ? "is-reached" : ""}
          >
            {step.label}
          </span>
        ))}
      </div>
    </div>
  );
};

const StoryBeat = ({ index, setRef, status, step }: StoryBeatProps) => (
  <article
    ref={setRef}
    aria-current={status === "active" ? "step" : undefined}
    className={`delegation-loop__beat is-${status}`}
  >
    <div>
      <p className="delegation-loop__beat-label">
        Gate {String(index + 1).padStart(2, "0")} · {step.label}
      </p>
      <h2>{step.title}</h2>
      <p>{step.body}</p>
    </div>
  </article>
);

export const DelegationLoopShiftScrolly = ({
  spec,
}: DelegationLoopShiftScrollyProps) => {
  const titleId = useId();
  const { activeIndex, registerStep, sectionRef, stageRef } =
    useActiveScrollyStep({ stepCount: spec.steps.length });

  return (
    <section
      ref={sectionRef}
      aria-labelledby={titleId}
      className="interactive-breakout delegation-loop"
      data-active-step={activeIndex + 1}
    >
      <div className="delegation-loop__layout">
        <div ref={stageRef} className="delegation-loop__stage">
          <div className="delegation-loop__stage-inner">
            <p className="delegation-loop__eyebrow">{spec.eyebrow}</p>
            <h2 id={titleId}>{spec.title}</h2>
            <LoopDiagram
              activeIndex={activeIndex}
              description={spec.description}
              steps={spec.steps}
            />
          </div>
        </div>

        <div className="delegation-loop__steps">
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
