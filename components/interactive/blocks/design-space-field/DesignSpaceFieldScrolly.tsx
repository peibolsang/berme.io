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
const VIEWBOX_HEIGHT = 420;
const OUTER_FIELD = { x: 220, y: 58, width: 360, height: 286, radius: 26 };
const INNER_FIELD = { x: 268, y: 98, width: 264, height: 204, radius: 16 };
const PRIMITIVES = [
  { shape: "circle", x: 292 },
  { shape: "square", x: 346 },
  { shape: "circle", x: 400 },
  { shape: "square", x: 454 },
  { shape: "circle", x: 508 },
] as const;
const COMBINATION_TRACES = [
  "M 292 146 C 292 164 302 182 312 198",
  "M 346 146 C 342 165 334 182 328 201",
  "M 346 146 C 356 166 376 184 384 204",
  "M 400 146 V 204",
  "M 454 146 C 442 168 426 186 414 205",
  "M 400 146 C 424 168 454 188 472 207",
  "M 454 146 C 468 166 484 184 490 204",
  "M 508 146 C 508 166 505 187 503 207",
];

type PrimitiveGlyphProps = {
  className?: string;
  shape: "circle" | "square";
  size?: number;
  x: number;
  y: number;
};

const PrimitiveGlyph = ({
  className,
  shape,
  size = 10,
  x,
  y,
}: PrimitiveGlyphProps) => (
  <g className={className} transform={`translate(${x} ${y})`}>
    {shape === "circle" ? (
      <circle r={size} />
    ) : (
      <rect height={size * 2} rx={size * 0.3} width={size * 2} x={-size} y={-size} />
    )}
  </g>
);

const SolutionAssemblies = () => (
  <>
    <g className="design-space__solution is-pink">
      <path d="M 282 224 L 312 198 L 344 220 L 334 270 L 292 270 Z" />
      <PrimitiveGlyph className="design-space__ingredient" shape="circle" size={5} x={306} y={232} />
      <PrimitiveGlyph className="design-space__ingredient" shape="square" size={5} x={321} y={248} />
    </g>
    <g className="design-space__solution is-blue">
      <path d="M 370 206 L 420 206 L 434 250 L 396 278 L 358 250 Z" />
      <PrimitiveGlyph className="design-space__ingredient" shape="square" size={5} x={384} y={235} />
      <PrimitiveGlyph className="design-space__ingredient" shape="circle" size={5} x={401} y={248} />
      <PrimitiveGlyph className="design-space__ingredient" shape="square" size={5} x={416} y={230} />
    </g>
    <g className="design-space__solution is-green">
      <path d="M 452 222 L 484 204 L 522 222 L 514 270 L 466 270 Z" />
      <PrimitiveGlyph className="design-space__ingredient" shape="circle" size={5} x={476} y={237} />
      <PrimitiveGlyph className="design-space__ingredient" shape="square" size={5} x={493} y={251} />
      <PrimitiveGlyph className="design-space__ingredient" shape="circle" size={5} x={505} y={231} />
    </g>
  </>
);

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
  const dangerZoneMaskId = useId();
  const activeStep = steps[activeIndex];
  const isDesignSpaceVisible = activeIndex > 0;
  const isContractFocused = activeIndex >= 5;

  return (
    <div
      aria-label={`${description} Step ${activeIndex + 1} of ${steps.length}: ${activeStep.label}.`}
      className="design-space__diagram"
      role="img"
    >
      <div aria-hidden="true" className="design-space__readout">
        <span>{isDesignSpaceVisible ? "New model" : "Old model"}</span>
        <strong>{isDesignSpaceVisible ? activeStep.label : "One answer"}</strong>
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
          <mask id={dangerZoneMaskId}>
            <rect
              fill="white"
              height={OUTER_FIELD.height}
              rx={OUTER_FIELD.radius}
              width={OUTER_FIELD.width}
              x={OUTER_FIELD.x}
              y={OUTER_FIELD.y}
            />
            <rect
              fill="black"
              height={INNER_FIELD.height}
              rx={INNER_FIELD.radius}
              width={INNER_FIELD.width}
              x={INNER_FIELD.x}
              y={INNER_FIELD.y}
            />
          </mask>
        </defs>

        <rect
          className="design-space__grid"
          fill={`url(#${gridId})`}
          width={VIEWBOX_WIDTH}
          height={VIEWBOX_HEIGHT}
        />

        <g className={`design-space__artifact ${isDesignSpaceVisible ? "is-leaving" : ""}`}>
          <rect
            className="design-space__artifact-surface"
            height={OUTER_FIELD.height}
            rx={OUTER_FIELD.radius}
            width={OUTER_FIELD.width}
            x={OUTER_FIELD.x}
            y={OUTER_FIELD.y}
          />
          <rect
            className="design-space__artifact-solution"
            height={INNER_FIELD.height}
            rx={INNER_FIELD.radius}
            width={INNER_FIELD.width}
            x={INNER_FIELD.x}
            y={INNER_FIELD.y}
          />
          <text x="400" y="201">
            Answer
          </text>
        </g>

        <g
          className={`design-space__outer-frame ${isDesignSpaceVisible ? "is-visible" : "is-old-model"} ${activeIndex >= 3 ? "is-boundary" : ""} ${isContractFocused ? "is-contract-focus" : ""}`}
        >
          <rect
            height={OUTER_FIELD.height}
            rx={OUTER_FIELD.radius}
            width={OUTER_FIELD.width}
            x={OUTER_FIELD.x}
            y={OUTER_FIELD.y}
          />
        </g>

        <rect
          className={`design-space__danger-zone ${activeIndex >= 3 ? "is-visible" : ""} ${isContractFocused ? "is-contract-focus" : ""}`}
          height={OUTER_FIELD.height}
          mask={`url(#${dangerZoneMaskId})`}
          rx={OUTER_FIELD.radius}
          width={OUTER_FIELD.width}
          x={OUTER_FIELD.x}
          y={OUTER_FIELD.y}
        />

        <g
          className={`design-space__constraint-frame ${activeIndex >= 2 ? "is-visible" : ""} ${isContractFocused ? "is-contract-focus" : ""}`}
        >
          <rect
            height={INNER_FIELD.height}
            rx={INNER_FIELD.radius}
            width={INNER_FIELD.width}
            x={INNER_FIELD.x}
            y={INNER_FIELD.y}
          />
        </g>

        <g
          className={`design-space__source-primitives ${activeIndex >= 1 ? "is-visible" : ""} ${isContractFocused ? "is-contract-focus" : ""}`}
        >
          {PRIMITIVES.map((primitive) => (
            <PrimitiveGlyph
              key={primitive.x}
              shape={primitive.shape}
              x={primitive.x}
              y={132}
            />
          ))}
        </g>

        <g
          className={`design-space__combination-traces ${activeIndex >= 4 ? "is-visible" : ""} ${isContractFocused ? "is-muted" : ""}`}
        >
          {COMBINATION_TRACES.map((path) => (
            <path d={path} key={path} />
          ))}
        </g>

        <g
          className={`design-space__solutions ${activeIndex >= 4 ? "is-visible" : ""} ${isContractFocused ? "is-muted" : ""}`}
        >
          <SolutionAssemblies />
        </g>
      </svg>

      <div
        aria-hidden="true"
        className={`design-space__contract-note ${isContractFocused ? "is-visible" : ""}`}
      >
        <span>Contract candidate</span>
        <strong>Primitives · constraints · boundaries</strong>
      </div>

      <div
        aria-hidden="true"
        className={`design-space__rules ${isDesignSpaceVisible ? "is-visible" : ""}`}
      >
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
        {index === 0
          ? `Old model · ${step.label}`
          : `New model ${String(index).padStart(2, "0")} · ${step.label}`}
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
