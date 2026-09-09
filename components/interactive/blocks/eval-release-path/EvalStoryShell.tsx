"use client";

import { useId, type ReactNode } from "react";
import type { ScrollySpec } from "@/lib/interactive/contracts/scrolly";
import { getScrollyStepStatus, useActiveScrollyStep } from "../../primitives/useActiveScrollyStep";
import styles from "./EvalStory.module.css";

export function EvalStoryShell({ spec, children }: { spec: ScrollySpec; children: (index: number) => ReactNode }) {
  const titleId = useId();
  const { activeIndex, registerStep, sectionRef, stageRef } = useActiveScrollyStep({ stepCount: spec.steps.length, mobileBreakpoint: Number.POSITIVE_INFINITY });
  return <section ref={sectionRef} aria-labelledby={titleId} className={`interactive-breakout ${styles.section}`} data-component={spec.component} data-active-step={activeIndex + 1}>
    <div ref={stageRef} className={styles.stage}>
      <p className={styles.eyebrow}>{spec.eyebrow}</p>
      <h2 id={titleId}>{spec.title}</h2>
      <div className={styles.instrument} role="img" aria-label={`${spec.description} Current step: ${spec.steps[activeIndex].title}`}>
        <div aria-hidden="true">
          <div className={styles.instrumentHeader}>
            <span>{spec.steps[activeIndex].label}</span>
            <div className={styles.stepTrack}>{spec.steps.map((step, i) => <i key={step.label} data-reached={i <= activeIndex} />)}</div>
            <strong>{String(activeIndex + 1).padStart(2, "0")} / {String(spec.steps.length).padStart(2, "0")}</strong>
          </div>
          <div className={styles.instrumentBody}>{children(activeIndex)}</div>
        </div>
      </div>
    </div>
    <div className={styles.steps}>{spec.steps.map((step, index) => <article key={step.label} ref={(node) => registerStep(index, node)} aria-current={activeIndex === index ? "step" : undefined} data-status={getScrollyStepStatus(index, activeIndex)} className={styles.beat}>
      <p className={styles.eyebrow}>{String(index + 1).padStart(2, "0")} · {step.label}</p>
      <h3>{step.title}</h3><p>{step.body}</p>
    </article>)}</div>
  </section>;
}

export function DiagramLabel({ x, y, children, tone = "ink" }: { x: number; y: number; children: ReactNode; tone?: "ink" | "amber" | "blue" | "red" }) {
  return <span className={styles.label} data-tone={tone} style={{ left: `${x}%`, top: `${y}%` }}>{children}</span>;
}
