"use client";

import type { FdeLearningLoopsSpec } from "@/lib/interactive/specs/fde-learning-loops";
import { useContainerSize } from "../../primitives/useContainerSize";
import { FdeStoryShell } from "../dispute-evidence-path/FdeStoryShell";
import shared from "../dispute-evidence-path/FdeStory.module.css";
import styles from "./NestedLoops.module.css";
import { loopGeometry, useLoopSignal } from "./useLoopSignal";

export type FdeLearningLoopsScrollyProps = { spec: FdeLearningLoopsSpec };
const loops = [
  { name: "Agent evaluation", question: "Does it behave correctly?" },
  { name: "Operational feedback", question: "Does it improve the work?" },
  { name: "Product learning", question: "Does the improvement travel?" },
];
const captions = [
  "Each loop needs its own evidence.",
  "Investigate the failure, fix the cause, and rerun the evals.",
  "Use feedback from users to improve the work, then measure again.",
  "Build the improvement into the product and test it with another customer.",
  "Another team can investigate problems, recover from failures, and test changes.",
];

function NestedLoops({ phase }: { phase: number }) {
  const { containerRef, size } = useContainerSize<HTMLDivElement>();
  const width = size.width || 520;
  const height = size.height || 330;
  const geometry = loopGeometry(width, height);
  const { signalRef, scene } = useLoopSignal(phase, width, height);

  return <>
    <div className={styles.composition} data-ready={scene.ready} data-phase={phase}>
      <div ref={containerRef} className={styles.graph}>
        <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
          {[2, 1, 0].map(index => {
            const { cx, cy, rx, ry, radius } = geometry[index];
            const active = scene.active === index;
            const complete = scene.complete >= index;
            return <g key={index} className={styles.ring} data-loop={index} data-lit={active || complete} data-complete={complete}>
              <rect data-signal-track={index} className={styles.track} x={cx - rx} y={cy - ry} width={rx * 2} height={ry * 2} rx={radius} />
              <rect className={styles.litTrack} x={cx - rx} y={cy - ry} width={rx * 2} height={ry * 2} rx={radius} />
              <path className={styles.arrow} d={`M${cx - 5} ${cy + ry - 5} l-6 5 6 5`} />
              <g className={styles.check} transform={`translate(${cx + rx}, ${cy})`}>
                <circle r="8" /><path d="m-3 0 2 2 4-4" />
              </g>
            </g>;
          })}
          <path className={styles.handoff} d={`M${geometry[0].cx + geometry[0].rx} ${height / 2} H${geometry[2].cx + geometry[2].rx}`} />
        </svg>
        {loops.map((loop, index) => <div key={loop.name} className={styles.loopLabel} data-loop={index} data-lit={scene.active === index || scene.complete >= index} style={{ top: `${(geometry[index].cy - geometry[index].ry) / height * 100}%` }}>
          <strong>{loop.name}</strong>
        </div>)}
        <span ref={signalRef} className={styles.signal} data-loop={scene.active} data-moving={scene.moving} />
      <div className={styles.capability} data-active={scene.ready} style={{ width: geometry[2].rx * 2, height: geometry[2].ry * 2, borderRadius: geometry[2].radius }}>
        <svg viewBox="0 0 32 32" fill="none"><path d="m4 10 12-6 12 6-12 6-12-6Zm0 6 12 6 12-6M4 22l12 6 12-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <div><span>What remains</span><strong>Software the next team can operate</strong></div>
      </div>
      </div>
    </div>
    <div className={styles.questions}>{loops.map((loop, i) => <span key={loop.name} data-loop={i} data-lit={scene.active === i || scene.complete >= i}>{loop.question}</span>)}</div>
    <div className={shared.captions}>{captions.map((caption, i) => <p key={caption} className={shared.caption} data-visible={i === phase}>{caption}</p>)}</div>
  </>;
}

export function FdeLearningLoopsScrolly({ spec }: FdeLearningLoopsScrollyProps) {
  return <FdeStoryShell spec={spec} landscape>{phase => <NestedLoops phase={phase} />}</FdeStoryShell>;
}
