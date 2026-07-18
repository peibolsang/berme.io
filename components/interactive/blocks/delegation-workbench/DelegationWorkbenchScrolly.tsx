"use client";

import { useId } from "react";
import type {
  DelegationWorkbenchSpec,
  DelegationWorkbenchStep,
} from "@/lib/interactive/specs/delegation-workbench";
import {
  getScrollyStepStatus,
  useActiveScrollyStep,
  type ScrollyStepStatus,
} from "../../primitives/useActiveScrollyStep";

export type DelegationWorkbenchScrollyProps = {
  spec: DelegationWorkbenchSpec;
};

type StoryBeatProps = {
  index: number;
  setRef: (node: HTMLElement | null) => void;
  status: ScrollyStepStatus;
  step: DelegationWorkbenchStep;
};

const SIGNAL_DESCRIPTIONS = [
  "Goal · scope · constraints",
  "Files · state · local history",
  "Progress · divergence · boundaries",
  "Risk · ambiguity · blast radius",
];

const WorkbenchDiagram = ({
  activeIndex,
  description,
  steps,
}: {
  activeIndex: number;
  description: string;
  steps: DelegationWorkbenchStep[];
}) => {
  const activeStep = steps[activeIndex];
  const isTaskMode = activeIndex > 0;

  return (
    <div
      aria-label={`${description} Step ${activeIndex + 1} of ${steps.length}: ${activeStep.label}.`}
      className="delegation-workbench__diagram"
      role="img"
    >
      <div aria-hidden="true" className="delegation-workbench__chrome">
        <span />
        <span />
        <span />
        <strong>{isTaskMode ? "Task workspace" : "File editor"}</strong>
        <em>{isTaskMode ? "Unit · task" : "Unit · file"}</em>
      </div>

      <div
        aria-hidden="true"
        className={`delegation-workbench__surface ${isTaskMode ? "is-task-mode" : "is-file-mode"}`}
      >
        <div className="delegation-workbench__file-pane">
          <div className="delegation-workbench__pane-heading">
            <span>Unit of work</span>
            <strong>checkout.ts</strong>
          </div>
          <div className="delegation-workbench__editor">
            <div className="delegation-workbench__code">
              {[72, 88, 61, 79, 46, 68, 84].map((width, index) => (
                <i key={`${width}-${index}`} style={{ width: `${width}%` }} />
              ))}
            </div>
            <div className="delegation-workbench__file-note">
              <span>Visible now</span>
              <strong>The implementation</strong>
              <p>The goal, scope, and risk still live outside the editor.</p>
            </div>
          </div>
          <div className="delegation-workbench__file-signals">
            <span>Code</span>
            <span>Errors</span>
            <span>Tests</span>
          </div>
        </div>

        <div className="delegation-workbench__task-pane">
          <div className="delegation-workbench__task-header">
            <div>
              <span>Bounded task</span>
              <strong>Change checkout safely</strong>
            </div>
            <em className={activeIndex === 4 ? "is-review" : ""}>
              {activeIndex === 4 ? "Human review" : "In progress"}
            </em>
          </div>

          <div className="delegation-workbench__signals">
            {steps.slice(1).map((step, index) => {
              const stepIndex = index + 1;
              const status = getScrollyStepStatus(stepIndex, activeIndex);

              return (
                <div
                  key={`${step.label}-${step.title}`}
                  className={`delegation-workbench__signal is-${status}`}
                >
                  <span>{String(stepIndex).padStart(2, "0")}</span>
                  <strong>{step.label}</strong>
                  <p>{SIGNAL_DESCRIPTIONS[index]}</p>
                </div>
              );
            })}
          </div>

          <div className="delegation-workbench__attention-line">
            <span>System confidence</span>
            <div>
              <i style={{ width: `${24 + activeIndex * 16}%` }} />
            </div>
            <strong>{activeIndex === 4 ? "Judgment required" : "Observe"}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

const StoryBeat = ({ index, setRef, status, step }: StoryBeatProps) => (
  <article
    ref={setRef}
    aria-current={status === "active" ? "step" : undefined}
    className={`delegation-workbench__beat is-${status}`}
  >
    <div>
      <p className="delegation-workbench__beat-label">
        Step {String(index + 1).padStart(2, "0")} · {step.label}
      </p>
      <h2>{step.title}</h2>
      <p>{step.body}</p>
    </div>
  </article>
);

export const DelegationWorkbenchScrolly = ({
  spec,
}: DelegationWorkbenchScrollyProps) => {
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
      className="interactive-breakout delegation-workbench"
      data-active-step={activeIndex + 1}
    >
      <div className="delegation-workbench__layout">
        <div ref={stageRef} className="delegation-workbench__stage">
          <div className="delegation-workbench__stage-inner">
            <p className="delegation-workbench__eyebrow">{spec.eyebrow}</p>
            <h2 id={titleId}>{spec.title}</h2>
            <WorkbenchDiagram
              activeIndex={activeIndex}
              description={spec.description}
              steps={spec.steps}
            />
          </div>
        </div>

        <div className="delegation-workbench__steps">
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
