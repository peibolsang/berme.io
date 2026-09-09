"use client";

import { useEffect, useRef } from "react";
import styles from "./EvalStory.module.css";

/** Arc-length sampling keeps the artifact on the pipe, including during reversal. */
export function PathTraveller({ segments, stop }: {
  segments: readonly string[];
  stop: number;
}) {
  const nodeRef = useRef<SVGGElement>(null);
  const distanceRef = useRef<number | null>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    const guide = document.createElementNS("http://www.w3.org/2000/svg", "path");
    guide.setAttribute("d", segments.slice(0, stop + 1).join(" "));
    const target = guide.getTotalLength();
    guide.setAttribute("d", segments.join(" "));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animation: Animation | undefined;
    let from = distanceRef.current ?? target;
    const transformAt = (distance: number) => {
      const point = guide.getPointAtLength(distance);
      return `translate(${point.x}px, ${point.y}px)`;
    };
    const settle = () => {
      animation?.cancel();
      animation = undefined;
      node.style.transform = transformAt(target);
      distanceRef.current = target;
    };
    if (reduced.matches || Math.abs(from - target) < 1) {
      settle();
    } else {
      // The longer repair / feedback arc needs time to remain traceable.
      const duration = Math.abs(target - from) > 300 ? 680 : 420;
      const frames = Array.from({ length: 81 }, (_, i) => ({
        transform: transformAt(from + (target - from) * i / 80),
      }));
      animation = node.animate(frames, {
        duration,
        easing: "cubic-bezier(0.77, 0, 0.175, 1)",
        fill: "forwards",
      });
    }
    const onPreferenceChange = () => { if (reduced.matches) settle(); };
    reduced.addEventListener("change", onPreferenceChange);
    return () => {
      // Capture eased arc progress before cancelling, so fast scrolling retargets
      // from the current position instead of restarting at the previous station.
      if (animation) {
        const progress = animation.effect?.getComputedTiming().progress ?? 0;
        from += (target - from) * progress;
        distanceRef.current = from;
        node.style.transform = transformAt(from);
        animation.cancel();
      }
      reduced.removeEventListener("change", onPreferenceChange);
    };
  }, [segments, stop]);

  return <g ref={nodeRef} transform={`translate(${segments[0].slice(1)})`} className={styles.traveller} aria-hidden="true">
    <circle r="18" className={styles.signalGlow} />
    <circle r="9" className={styles.signalCore} />
    <circle cx="-2.5" cy="-2.5" r="2.5" className={styles.signalHighlight} />
  </g>;
}

export function PipelineRail({ d, lit = true }: { d: string; lit?: boolean }) {
  return <g>
    <path d={d} className={styles.pipeRim} />
    <path d={d} className={styles.pipe} />
    <path d={d} className={styles.pipeInset} />
    <path d={d} className={styles.pipeAxis} />
    <path d={d} className={styles.thread} style={{ opacity: lit ? 1 : 0 }} />
  </g>;
}

export function EvalGate({ x, y, tone, state }: {
  x: number; y: number; tone: "amber" | "blue";
  state: "waiting" | "active" | "passed" | "failed";
}) {
  return <g transform={`translate(${x} ${y})`} className={styles.gate} data-tone={tone} data-state={state}>
    <g className={styles.gateAssembly}>
      <ellipse cx="7" rx="18" ry="47" className={styles.gateBack} />
      <path d="M0 -47 H7 M0 47 H7" className={styles.gateRib} />
      <ellipse rx="18" ry="47" className={styles.gateFace} />
      <ellipse rx="24" ry="54" className={styles.gateFocus} />
    </g>
    <g className={styles.gateBadge}>
      <circle cy="-52" r="10" />
      <path d={state === 'failed' ? 'M-4 -56 L4 -48 M4 -56 L-4 -48' : 'M-5 -52 L-1 -48 L6 -56'} />
    </g>
  </g>;
}
