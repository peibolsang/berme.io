"use client";

import { useId } from "react";
import type {
  DesignSpaceFieldSpec,
  DesignSpaceFieldStep,
} from "@/lib/interactive/specs/design-space-field";
import {
  getScrollyStepStatus,
  useActiveScrollyStep,
  type ScrollyStepStatus,
} from "../../primitives/useActiveScrollyStep";

export type DesignSpaceFieldScrollyProps = {
  spec: DesignSpaceFieldSpec;
};

type StoryBeatProps = {
  index: number;
  setRef: (node: HTMLElement | null) => void;
  status: ScrollyStepStatus;
  step: DesignSpaceFieldStep;
};

const VIEWBOX_WIDTH = 760;
const VIEWBOX_HEIGHT = 480;
const CANDIDATES = [
  { color: "pink", path: "M 272 246 L 308 216 L 346 244 L 331 286 L 286 286 Z" },
  { color: "blue", path: "M 367 218 L 421 218 L 437 270 L 394 300 L 354 266 Z" },
  { color: "green", path: "M 482 228 L 530 245 L 518 294 L 466 294 L 451 252 Z" },
];

const DesignSpaceDiagram = ({
  activeIndex,
  description,
  steps,
}: {
  activeIndex: number;
  description: string;
  steps: DesignSpaceFieldStep[];
}) => {
  const gridId = useId();
  const activeStep = steps[activeIndex];

  return (
    <div
      aria-label={`${description} Step ${activeIndex + 1} of ${steps.length}: ${activeStep.label}.`}
      className="design-space__diagram"
      role="img"
    >
      <div aria-hidden="true" className="design-space__readout">
        <span>Design space</span>
        <strong>{activeStep.label}</strong>
      </div>

      <svg
        aria-hidden="true"
        className="design-space__visual"
        focusable="false"
        preserveAspectRatio="xMidYMid meet"
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      >
        <defs>
          <pattern
            id={gridId}
            width="26"
            height="26"
            patternUnits="userSpaceOnUse"
          >
            <circle className="design-space__grid-dot" cx="1" cy="1" r="1" />
          </pattern>
        </defs>

        <rect
          className="design-space__grid"
          fill={`url(#${gridId})`}
          width={VIEWBOX_WIDTH}
          height={VIEWBOX_HEIGHT}
        />

        <g className={`design-space__single-answer ${activeIndex > 0 ? "is-muted" : ""}`}>
          <rect x="68" y="176" width="112" height="112" rx="18" />
          <path d="M 97 232 H 151 M 124 205 V 259" />
        </g>

        <path
          className={`design-space__bridge ${activeIndex >= 1 ? "is-visible" : ""}`}
          d="M 190 232 C 225 232 226 150 256 150"
        />

        <g className={`design-space__boundary ${activeIndex >= 2 ? "is-visible" : ""}`}>
          <rect x="240" y="90" width="344" height="292" rx="28" />
          <path d="M 270 130 H 554" />
          <path d="M 270 342 H 554" />
          <path d="M 278 150 V 322" />
          <path d="M 546 150 V 322" />
        </g>

        <g className={`design-space__primitives ${activeIndex >= 1 ? "is-visible" : ""}`}>
          {[300, 356, 412, 468, 524].map((x, index) => (
            <g key={x} transform={`translate(${x} 164)`}>
              {index % 2 === 0 ? <circle r="10" /> : <rect x="-9" y="-9" width="18" height="18" rx="3" />}
            </g>
          ))}
        </g>

        <g className={`design-space__candidates ${activeIndex >= 4 ? "is-visible" : ""}`}>
          {CANDIDATES.map((candidate, index) => (
            <path
              key={candidate.color}
              className={`is-${candidate.color} ${activeIndex === 4 && index > 0 ? "is-delayed" : ""}`}
              d={candidate.path}
            />
          ))}
        </g>

        <g className={`design-space__invalid ${activeIndex >= 3 ? "is-visible" : ""}`}>
          <rect x="628" y="283" width="82" height="62" rx="12" />
          <path d="M 650 303 L 688 325 M 688 303 L 650 325" />
        </g>

        <g className={`design-space__contract ${activeIndex >= 5 ? "is-visible" : ""}`}>
          <circle cx="412" cy="236" r="118" />
          <path d="M 391 236 L 407 252 L 438 218" />
        </g>
      </svg>

      <div aria-hidden="true" className="design-space__rules">
        <span className={activeIndex >= 1 ? "is-active" : ""}>Primitives</span>
        <span className={activeIndex >= 2 ? "is-active" : ""}>Constraints</span>
        <span className={activeIndex >= 3 ? "is-active" : ""}>Boundaries</span>
        <span className={activeIndex >= 5 ? "is-active" : ""}>Verification</span>
      </div>
    </div>
  );
};

const StoryBeat = ({ index, setRef, status, step }: StoryBeatProps) => (
  <article
    ref={setRef}
    aria-current={status === "active" ? "step" : undefined}
    className={`design-space__beat is-${status}`}
  >
    <div>
      <p className="design-space__beat-label">
        Rule {String(index + 1).padStart(2, "0")} · {step.label}
      </p>
      <h2>{step.title}</h2>
      <p>{step.body}</p>
    </div>
  </article>
);

export const DesignSpaceFieldScrolly = ({
  spec,
}: DesignSpaceFieldScrollyProps) => {
  const titleId = useId();
  const { activeIndex, registerStep, sectionRef, stageRef } =
    useActiveScrollyStep({
      mobileBreakpoint: 10000,
      stepCount: spec.steps.length,
    });

  return (
    <section
      ref={sectionRef}
      aria-labelledby={titleId}
      className="interactive-breakout design-space"
      data-active-step={activeIndex + 1}
    >
      <div className="design-space__layout">
        <div ref={stageRef} className="design-space__stage">
          <div className="design-space__stage-inner">
            <p className="design-space__eyebrow">{spec.eyebrow}</p>
            <h2 id={titleId}>{spec.title}</h2>
            <DesignSpaceDiagram
              activeIndex={activeIndex}
              description={spec.description}
              steps={spec.steps}
            />
          </div>
        </div>

        <div className="design-space__steps">
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
