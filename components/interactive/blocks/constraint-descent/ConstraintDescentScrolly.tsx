"use client";

import { useId, type CSSProperties } from "react";
import type {
  ConstraintDescentStep,
  ConstraintDescentSpec,
} from "@/lib/interactive/specs/constraint-descent";
import {
  getScrollyStepStatus,
  useActiveScrollyStep,
  type ScrollyStepStatus,
} from "../../primitives/useActiveScrollyStep";

export type ConstraintDescentScrollyProps = {
  spec: ConstraintDescentSpec;
};

type IsometricLayerProps = {
  index: number;
  status: ScrollyStepStatus;
};

type DiagramLabelProps = IsometricLayerProps & {
  step: ConstraintDescentStep;
};

type StoryBeatProps = DiagramLabelProps & {
  setRef: (node: HTMLElement | null) => void;
};

const VIEWBOX_WIDTH = 720;
const VIEWBOX_HEIGHT = 680;
const LAYER_CENTER_X = 360;
const LAYER_WIDTH = 360;
const LAYER_RISE = 31;
const FIRST_LAYER_Y = 54;
const LAYER_GAP = 101;

const getLayerY = (index: number) => FIRST_LAYER_Y + index * LAYER_GAP;
const getLayerThickness = (index: number) => 8 + index * 4;
const getSignalY = (index: number) => getLayerY(index) + LAYER_RISE;

const getDiamondPoints = (
  centerX: number,
  topY: number,
  width: number,
  rise: number,
) =>
  [
    `${centerX},${topY}`,
    `${centerX + width / 2},${topY + rise}`,
    `${centerX},${topY + rise * 2}`,
    `${centerX - width / 2},${topY + rise}`,
  ].join(" ");

const IsometricLayer = ({ index, status }: IsometricLayerProps) => {
  const y = getLayerY(index);
  const thickness = getLayerThickness(index);
  const leftX = LAYER_CENTER_X - LAYER_WIDTH / 2;
  const rightX = LAYER_CENTER_X + LAYER_WIDTH / 2;
  const centerY = y + LAYER_RISE;
  const labelOnLeft = index % 2 === 0;
  const leaderEndX = labelOnLeft ? 140 : VIEWBOX_WIDTH - 140;
  const insetWidth = LAYER_WIDTH - 84;
  const insetRise = LAYER_RISE - 8;
  const insetY = centerY - insetRise;

  return (
    <g
      className={`constraint-story__layer is-${status}`}
      data-depth={index + 1}
    >
      <polygon
        className="constraint-story__layer-left"
        points={`${leftX},${centerY} ${LAYER_CENTER_X},${y + LAYER_RISE * 2} ${LAYER_CENTER_X},${y + LAYER_RISE * 2 + thickness} ${leftX},${centerY + thickness}`}
      />
      <polygon
        className="constraint-story__layer-right"
        points={`${LAYER_CENTER_X},${y + LAYER_RISE * 2} ${rightX},${centerY} ${rightX},${centerY + thickness} ${LAYER_CENTER_X},${y + LAYER_RISE * 2 + thickness}`}
      />
      <polygon
        className="constraint-story__layer-top"
        points={getDiamondPoints(
          LAYER_CENTER_X,
          y,
          LAYER_WIDTH,
          LAYER_RISE,
        )}
      />

      {index >= 2 ? (
        <polygon
          className="constraint-story__layer-inset"
          points={getDiamondPoints(
            LAYER_CENTER_X,
            insetY,
            insetWidth,
            insetRise,
          )}
        />
      ) : null}

      {index >= 4 ? (
        <polygon
          className="constraint-story__layer-core"
          points={getDiamondPoints(
            LAYER_CENTER_X,
            centerY - 10,
            116,
            10,
          )}
        />
      ) : null}

      <polygon
        className="constraint-story__aperture"
        points={getDiamondPoints(LAYER_CENTER_X, centerY - 7, 28, 7)}
      />

      <g className="constraint-story__layer-leader">
        <line
          x1={labelOnLeft ? leftX : rightX}
          x2={leaderEndX}
          y1={centerY}
          y2={centerY}
        />
        <circle cx={leaderEndX} cy={centerY} r="2.5" />
      </g>
    </g>
  );
};

const DiagramLabel = ({ index, status, step }: DiagramLabelProps) => {
  const labelPosition = {
    "--label-y": `${(getSignalY(index) / VIEWBOX_HEIGHT) * 100}%`,
  } as CSSProperties;

  return (
    <div
      aria-hidden="true"
      className={`constraint-story__diagram-label ${
        index % 2 === 0 ? "is-left" : "is-right"
      } is-${status}`}
      style={labelPosition}
    >
      <span className="constraint-story__layer-number">
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="constraint-story__layer-name">{step.label}</span>
    </div>
  );
};

const IntentSignal = ({ activeIndex }: { activeIndex: number }) => (
  <g
    className="constraint-story__intent-signal"
    style={{ transform: `translateY(${getSignalY(activeIndex)}px)` }}
  >
    <circle
      className="constraint-story__signal-orbit"
      cx={LAYER_CENTER_X}
      cy="0"
      r="18"
    />
    <polygon
      className="constraint-story__signal-core"
      points={getDiamondPoints(LAYER_CENTER_X, -9, 32, 9)}
    />
    <circle
      className="constraint-story__signal-point"
      cx={LAYER_CENTER_X}
      cy="0"
      r="3"
    />
  </g>
);

const ConstraintDescentDiagram = ({
  activeIndex,
  steps,
  titleId,
}: {
  activeIndex: number;
  steps: ConstraintDescentStep[];
  titleId: string;
}) => (
  <div
    aria-labelledby={titleId}
    className="constraint-story__diagram"
    role="img"
  >
    <div
      aria-hidden="true"
      className="constraint-story__phase-label is-interpreted"
    >
      Interpreted
    </div>
    <div
      aria-hidden="true"
      className="constraint-story__phase-label is-enforced"
    >
      Enforced
    </div>

    <svg
      aria-hidden="true"
      className="constraint-story__visual"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
    >
      <line
        className="constraint-story__intent-thread is-traversed"
        x1={LAYER_CENTER_X}
        x2={LAYER_CENTER_X}
        y1="22"
        y2={getSignalY(activeIndex)}
      />
      <line
        className="constraint-story__intent-thread is-ahead"
        x1={LAYER_CENTER_X}
        x2={LAYER_CENTER_X}
        y1={getSignalY(activeIndex)}
        y2={VIEWBOX_HEIGHT - 26}
      />

      {steps.map((step, index) => (
        <IsometricLayer
          key={`${step.label}-${step.title}`}
          index={index}
          status={getScrollyStepStatus(index, activeIndex)}
        />
      ))}

      <IntentSignal activeIndex={activeIndex} />
    </svg>

    {steps.map((step, index) => (
      <DiagramLabel
        key={`${step.label}-${step.title}`}
        index={index}
        status={getScrollyStepStatus(index, activeIndex)}
        step={step}
      />
    ))}
  </div>
);

const StoryBeat = ({ index, setRef, status, step }: StoryBeatProps) => (
  <article
    ref={setRef}
    aria-current={status === "active" ? "step" : undefined}
    className={`constraint-story__beat is-${status}`}
  >
    <div>
      <p className="constraint-story__beat-label">
        {String(index + 1).padStart(2, "0")} · {step.label}
      </p>
      <h2>{step.title}</h2>
      <p>{step.body}</p>
    </div>
  </article>
);

export const ConstraintDescentScrolly = ({
  spec,
}: ConstraintDescentScrollyProps) => {
  const titleId = useId();
  const { activeIndex, registerStep, sectionRef, stageRef } =
    useActiveScrollyStep({ stepCount: spec.steps.length });

  return (
    <section
      ref={sectionRef}
      aria-labelledby={titleId}
      className="interactive-breakout constraint-story"
      data-active-step={activeIndex + 1}
    >
      <div className="constraint-story__layout">
        <div ref={stageRef} className="constraint-story__stage">
          <div className="constraint-story__stage-inner">
            <p className="constraint-story__eyebrow">{spec.eyebrow}</p>
            <h2 id={titleId}>{spec.title}</h2>
            <ConstraintDescentDiagram
              activeIndex={activeIndex}
              steps={spec.steps}
              titleId={titleId}
            />
          </div>
        </div>

        <div className="constraint-story__steps">
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
