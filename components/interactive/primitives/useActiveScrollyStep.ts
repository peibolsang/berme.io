"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ScrollyStepStatus = "active" | "future" | "past";

type UseActiveScrollyStepOptions = {
  desktopTargetViewportRatio?: number;
  mobileBreakpoint?: number;
  mobileStageOffset?: number;
  observerRootMargin?: string;
  stepCount: number;
};

export const getScrollyStepStatus = (
  index: number,
  activeIndex: number,
): ScrollyStepStatus => {
  if (index === activeIndex) {
    return "active";
  }

  return index < activeIndex ? "past" : "future";
};

export const useActiveScrollyStep = ({
  desktopTargetViewportRatio = 0.52,
  mobileBreakpoint = 768,
  mobileStageOffset = 44,
  observerRootMargin = "75% 0px",
  stepCount,
}: UseActiveScrollyStepOptions) => {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<Array<HTMLElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const registerStep = useCallback(
    (index: number, node: HTMLElement | null) => {
      stepRefs.current[index] = node;
    },
    [],
  );

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) {
      return;
    }

    stepRefs.current.length = stepCount;

    let frameId = 0;
    let sectionIsNearViewport = false;

    const measure = () => {
      frameId = 0;

      if (!sectionIsNearViewport) {
        return;
      }

      const usesStackedLayout = window.innerWidth < mobileBreakpoint;
      const stageBottom = stageRef.current?.getBoundingClientRect().bottom;
      const targetY = usesStackedLayout
        ? (stageBottom ?? window.innerHeight * 0.58) + mobileStageOffset
        : window.innerHeight * desktopTargetViewportRatio;
      let nextIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;

      stepRefs.current.forEach((step, index) => {
        if (!step) {
          return;
        }

        const rect = step.getBoundingClientRect();
        const stepAnchorY = usesStackedLayout
          ? rect.top + mobileStageOffset
          : rect.top + rect.height / 2;
        const distance = Math.abs(stepAnchorY - targetY);

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nextIndex = index;
        }
      });

      setActiveIndex((current) =>
        current === nextIndex ? current : nextIndex,
      );
    };

    const scheduleMeasure = () => {
      if (frameId === 0) {
        frameId = window.requestAnimationFrame(measure);
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        sectionIsNearViewport = entry.isIntersecting;

        if (sectionIsNearViewport) {
          scheduleMeasure();
        }
      },
      { rootMargin: observerRootMargin },
    );

    observer.observe(section);
    window.addEventListener("scroll", scheduleMeasure, { passive: true });
    window.addEventListener("resize", scheduleMeasure);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", scheduleMeasure);
      window.removeEventListener("resize", scheduleMeasure);
    };
  }, [
    desktopTargetViewportRatio,
    mobileBreakpoint,
    mobileStageOffset,
    observerRootMargin,
    stepCount,
  ]);

  return {
    activeIndex,
    registerStep,
    sectionRef,
    stageRef,
  };
};
