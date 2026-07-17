"use client";

import { useId } from "react";
import type {
  LearningPathsSpec,
  LearningPathsStep,
} from "@/lib/interactive/specs/learning-paths";
import {
  getScrollyStepStatus,
  useActiveScrollyStep,
  type ScrollyStepStatus,
} from "../../primitives/useActiveScrollyStep";

export type LearningPathsScrollyProps = {
  spec: LearningPathsSpec;
};

type StoryBeatProps = {
  index: number;
  setRef: (node: HTMLElement | null) => void;
  status: ScrollyStepStatus;
  step: LearningPathsStep;
};

type StoryPreludeProps = {
  setRef: (node: HTMLElement | null) => void;
  status: ScrollyStepStatus;
};

type RouteState = "active" | "hidden" | "muted";

const VIEWBOX_WIDTH = 900;
const VIEWBOX_HEIGHT = 520;
const ORIGIN = { x: 100, y: 435 };
const QUICK_APP = { x: 265, y: 190 };
const TARGET = { x: 760, y: 90 };
const FOUNDATION_ACTIVE_STEPS = [1];
const AGENT_ACTIVE_STEPS = [2, 3];
const COMBINED_ACTIVE_STEPS = [4, 5];
const TRAVELER_POSITIONS = [
  ORIGIN,
  { x: 425, y: 430 },
  QUICK_APP,
  { x: 560, y: 128 },
  { x: 610, y: 200 },
  TARGET,
];

const FOUNDATION_PATH =
  "M 100 435 C 300 430 500 440 620 400 C 700 372 735 230 760 90";
const AGENT_PATH =
  "M 100 435 C 115 315 155 235 265 190 C 410 135 600 118 760 90";
const COMBINED_PATH =
  "M 100 435 C 120 300 170 230 270 210 C 400 190 500 250 610 200 C 690 165 730 110 760 90";

const getRouteState = (
  activeIndex: number,
  activeSteps: number[],
  revealAt: number,
): RouteState => {
  if (activeIndex < revealAt) {
    return "hidden";
  }

  return activeSteps.includes(activeIndex) ? "active" : "muted";
};

const getRouteProgress = (
  activeIndex: number,
  revealAt: number,
  partialAt?: { progress: number; step: number },
) => {
  if (activeIndex < revealAt) {
    return 0;
  }

  if (partialAt && activeIndex === partialAt.step) {
    return partialAt.progress;
  }

  return 100;
};

const RoutePath = ({
  className,
  d,
  dashWhenComplete = false,
  progress,
  state,
}: {
  className: string;
  d: string;
  dashWhenComplete?: boolean;
  progress: number;
  state: RouteState;
}) => (
  <path
    className={`learning-paths__route ${className} is-${state}`}
    d={d}
    pathLength="100"
    strokeDasharray={
      dashWhenComplete && progress === 100 ? "4 3" : `${progress} 100`
    }
  />
);

const ActiveTraveler = ({ activeIndex }: { activeIndex: number }) => {
  return (
    <g className="learning-paths__travelers">
      {TRAVELER_POSITIONS.map((position, index) => (
        <g
          key={`${position.x}-${position.y}`}
          className={`learning-paths__traveler ${
            index === activeIndex ? "is-active" : "is-hidden"
          }`}
          transform={`translate(${position.x} ${position.y})`}
        >
          <circle className="learning-paths__traveler-halo" r="15" />
          <circle className="learning-paths__traveler-core" r="5" />
        </g>
      ))}
    </g>
  );
};

const LearningPathsDiagram = ({
  activeIndex,
  description,
  steps,
}: {
  activeIndex: number;
  description: string;
  steps: LearningPathsStep[];
}) => {
  const foundationState = getRouteState(
    activeIndex,
    FOUNDATION_ACTIVE_STEPS,
    1,
  );
  const agentState = getRouteState(activeIndex, AGENT_ACTIVE_STEPS, 2);
  const combinedState = getRouteState(activeIndex, COMBINED_ACTIVE_STEPS, 4);
  const activeStep = steps[activeIndex];
  const hasSelectedPath = activeIndex >= 0;
  const activeLabel = activeStep?.label ?? "No path";

  return (
    <div
      aria-label={
        hasSelectedPath
          ? `${description} Step ${activeIndex + 1} of ${steps.length}: ${activeLabel}.`
          : `${description} No path selected.`
      }
      className="learning-paths__diagram"
      role="img"
    >
      <div aria-hidden="true" className="learning-paths__readout">
        <span>
          Route {hasSelectedPath ? String(activeIndex + 1).padStart(2, "0") : "--"} /{" "}
          {String(steps.length).padStart(2, "0")}
        </span>
        <strong>{activeLabel}</strong>
      </div>

      <svg
        aria-hidden="true"
        className="learning-paths__visual"
        focusable="false"
        preserveAspectRatio="xMidYMid meet"
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      >
        <g className="learning-paths__grid">
          {[150, 245, 340].map((y) => (
            <line key={y} x1="100" x2="820" y1={y} y2={y} />
          ))}
          {[250, 410, 570, 730].map((x) => (
            <line key={x} x1={x} x2={x} y1="54" y2="460" />
          ))}
        </g>

        <g className="learning-paths__axes">
          <line x1="70" x2="815" y1="460" y2="460" />
          <polygon points="815,460 796,451 796,469" />
          <line x1="80" x2="80" y1="480" y2="48" />
          <polygon points="80,48 71,67 89,67" />
        </g>

        <g
          className={`learning-paths__fundamentals-band ${
            activeIndex === 1 || activeIndex === 4 ? "is-active" : ""
          }`}
        >
          <line x1="190" x2="590" y1="407" y2="407" />
          {[238, 338, 438, 538].map((x) => (
            <line key={x} x1={x} x2={x} y1="401" y2="413" />
          ))}
          <text x="390" y="393">THE FUNDAMENTALS</text>
        </g>

        <RoutePath
          className="is-foundation"
          d={FOUNDATION_PATH}
          progress={getRouteProgress(activeIndex, 1)}
          state={foundationState}
        />
        <RoutePath
          className="is-agent"
          d={AGENT_PATH}
          dashWhenComplete
          progress={getRouteProgress(activeIndex, 2, {
            progress: 35,
            step: 2,
          })}
          state={agentState}
        />
        <RoutePath
          className="is-combined"
          d={COMBINED_PATH}
          progress={getRouteProgress(activeIndex, 4)}
          state={combinedState}
        />

        <g
          className={`learning-paths__quick-app ${
            activeIndex >= 2 ? "is-visible" : ""
          }`}
          transform={`translate(${QUICK_APP.x} ${QUICK_APP.y})`}
        >
          <circle r="20" />
        </g>

        <g
          className={`learning-paths__destination ${
            activeIndex === 5 ? "is-active" : ""
          }`}
          transform={`translate(${TARGET.x} ${TARGET.y})`}
        >
          <circle className="learning-paths__destination-orbit" r="31" />
          <circle className="learning-paths__destination-core" r="20" />
        </g>

        <ActiveTraveler activeIndex={activeIndex} />
      </svg>

      <span aria-hidden="true" className="learning-paths__axis-label is-expertise">
        Expertise
      </span>
      <span aria-hidden="true" className="learning-paths__axis-label is-time">
        Time
      </span>
      <span
        aria-hidden="true"
        className={`learning-paths__annotation is-quick-app ${
          activeIndex >= 2 ? "is-visible" : ""
        }`}
      >
        A working app
      </span>
      <span aria-hidden="true" className="learning-paths__annotation is-target">
        Scalable · reliable · secure
      </span>

      <div aria-hidden="true" className="learning-paths__legend">
        <span className={foundationState === "active" ? "is-active" : ""}>
          Fundamentals first
        </span>
        <span className={agentState === "active" ? "is-active" : ""}>
          Agent shortcut
        </span>
        <span className={combinedState === "active" ? "is-active" : ""}>
          Combined
        </span>
      </div>
    </div>
  );
};

const getBeatRoute = (index: number) => {
  if (index === 1) {
    return "foundation";
  }

  if (index === 2 || index === 3) {
    return "agent";
  }

  return index >= 4 ? "combined" : "origin";
};

const StoryPrelude = ({ setRef, status }: StoryPreludeProps) => (
  <article
    ref={setRef}
    aria-current={status === "active" ? "step" : undefined}
    className={`learning-paths__beat learning-paths__beat--prelude is-${status}`}
  >
    <div>
      <p className="learning-paths__beat-label">No path</p>
    </div>
  </article>
);

const StoryBeat = ({ index, setRef, status, step }: StoryBeatProps) => (
  <article
    ref={setRef}
    aria-current={status === "active" ? "step" : undefined}
    className={`learning-paths__beat learning-paths__beat--${getBeatRoute(
      index,
    )} is-${status}`}
  >
    <div>
      <p className="learning-paths__beat-label">
        Path {String(index + 1).padStart(2, "0")} · {step.label}
      </p>
      <h2>{step.title}</h2>
      <p>{step.body}</p>
    </div>
  </article>
);

export const LearningPathsScrolly = ({ spec }: LearningPathsScrollyProps) => {
  const titleId = useId();
  const { activeIndex, registerStep, sectionRef, stageRef } =
    useActiveScrollyStep({
      mobileBreakpoint: 10000,
      mobileStageOffset: 20,
      stepCount: spec.steps.length + 1,
    });
  const visualIndex = activeIndex - 1;

  return (
    <section
      ref={sectionRef}
      aria-labelledby={titleId}
      className="interactive-breakout learning-paths"
      data-active-step={visualIndex + 1}
    >
      <div className="learning-paths__layout">
        <div ref={stageRef} className="learning-paths__stage">
          <div className="learning-paths__stage-inner">
            <p className="learning-paths__eyebrow">{spec.eyebrow}</p>
            <h2 id={titleId}>{spec.title}</h2>
            <LearningPathsDiagram
              activeIndex={visualIndex}
              description={spec.description}
              steps={spec.steps}
            />
          </div>
        </div>

        <div className="learning-paths__steps">
          <StoryPrelude
            setRef={(node) => {
              registerStep(0, node);
            }}
            status={getScrollyStepStatus(0, activeIndex)}
          />
          {spec.steps.map((step, index) => (
            <StoryBeat
              key={`${step.label}-${step.title}`}
              index={index}
              setRef={(node) => {
                registerStep(index + 1, node);
              }}
              status={getScrollyStepStatus(index + 1, activeIndex)}
              step={step}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
