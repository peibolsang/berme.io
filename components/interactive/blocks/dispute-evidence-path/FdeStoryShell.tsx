"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import type { ScrollySpec } from "@/lib/interactive/contracts/scrolly";
import { getScrollyStepStatus, useActiveScrollyStep } from "../../primitives/useActiveScrollyStep";
import styles from "./FdeStory.module.css";

export function FdeStoryShell({ spec, children, landscape = false }: { spec: ScrollySpec; children: (phase: number) => ReactNode; landscape?: boolean }) {
  const titleId = useId();
  const [stageFits, setStageFits] = useState(true);
  const { activeIndex, registerStep, sectionRef, stageRef } = useActiveScrollyStep({ stepCount: spec.steps.length, mobileBreakpoint: landscape ? Number.POSITIVE_INFINITY : 768, useViewportWhenStageUnstuck: true });

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const viewport = window.visualViewport;
    const measure = () => {
      const availableHeight = viewport?.height ?? window.innerHeight;
      // Reserve room to read below a stacked diagram. Browser toolbars, larger
      // text, and orientation changes must not turn a fitting panel non-sticky.
      const readingSpace = landscape || window.innerWidth < 768 ? 160 : 64;
      setStageFits(stage.getBoundingClientRect().height + readingSpace <= availableHeight);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    window.addEventListener("resize", measure);
    viewport?.addEventListener("resize", measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      viewport?.removeEventListener("resize", measure);
    };
  }, [landscape, stageRef]);
  const phase = Math.round(activeIndex * 4 / (spec.steps.length - 1));
  return <section ref={sectionRef} aria-labelledby={titleId} className={`interactive-breakout ${styles.section} ${landscape ? styles.landscape : ""}`} data-component={spec.component} data-active-step={activeIndex + 1}>
    <header className={styles.heading}>
      <p className={styles.eyebrow}>{spec.eyebrow}</p>
      <h2 id={titleId}>{spec.title}</h2>
      <p>{spec.description}</p>
    </header>
    <div className={styles.layout}>
      <div ref={stageRef} className={styles.stage} data-sticky={stageFits}>
        <div className={styles.instrument} role="img" aria-label={`${spec.description} Current step: ${spec.steps[activeIndex].title}`}>
          <div aria-hidden="true">
            <div className={styles.counter}><span>{spec.steps[activeIndex].label}</span><span>{String(activeIndex + 1).padStart(2, "0")} / {String(spec.steps.length).padStart(2, "0")}</span></div>
            {children(phase)}
          </div>
        </div>
      </div>
      <div className={styles.steps}>{spec.steps.map((step, index) => <article key={index} ref={(node) => registerStep(index, node)} className={styles.beat} data-status={getScrollyStepStatus(index, activeIndex)} aria-current={activeIndex === index ? "step" : undefined}>
        <p className={styles.eyebrow}>{String(index + 1).padStart(2, "0")} · {step.label}</p>
        <h3>{step.title}</h3><p>{step.body}</p>
      </article>)}</div>
    </div>
  </section>;
}
