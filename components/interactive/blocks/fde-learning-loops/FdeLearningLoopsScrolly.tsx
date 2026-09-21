"use client";

import type { FdeLearningLoopsSpec } from "@/lib/interactive/specs/fde-learning-loops";
import { useContainerSize } from "../../primitives/useContainerSize";
import { FdeStoryShell } from "../dispute-evidence-path/FdeStoryShell";
import shared from "../dispute-evidence-path/FdeStory.module.css";
import styles from "./NestedLoops.module.css";
import { loopGeometry, signalExit, useLoopSignal } from "./useLoopSignal";

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
  const stacked = height < 300;
  const geometry = loopGeometry(width, height);
  const { signalRef, scene } = useLoopSignal(phase, width, height, stacked);
  const exit = signalExit(width, height, stacked);
  const exitPath = exit.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");

  return <>
    <div className={styles.composition} data-ready={scene.ready} data-phase={phase}>
      <div ref={containerRef} className={styles.graph}>
        <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
          {[2, 1, 0].map(index => {
            const { cx, cy, rx, ry } = geometry[index];
            const active = scene.active === index;
            const complete = scene.complete >= index;
            return <g key={index} className={styles.ring} data-loop={index} data-lit={active || complete} data-complete={complete}>
              <ellipse className={styles.track} cx={cx} cy={cy} rx={rx} ry={ry} />
              <ellipse className={styles.litTrack} cx={cx} cy={cy} rx={rx} ry={ry} />
              <path className={styles.arrow} d={`M${cx - 5} ${cy + ry - 5} l-6 5 6 5`} />
              <g className={styles.check} transform={`translate(${cx + rx}, ${cy})`}>
                <circle r="8" /><path d="m-3 0 2 2 4-4" />
              </g>
            </g>;
          })}
          <path className={styles.handoff} d={`M${width * .72} ${height / 2} H${width * .96}`} />
          <path className={styles.exit} d={exitPath} data-lit={scene.ready} />
        </svg>
        {loops.map((loop, index) => <div key={loop.name} className={styles.loopLabel} data-loop={index} data-lit={scene.active === index || scene.complete >= index} style={{ top: index === 0 ? "50%" : `${(geometry[index].cy - geometry[index].ry + (stacked ? 24 : 26)) / height * 100}%` }}>
          <strong>{loop.name}</strong>
        </div>)}
        <span ref={signalRef} className={styles.signal} data-loop={scene.active} data-moving={scene.moving} />
      </div>
      <div className={styles.capability} data-active={scene.ready}>
        <svg viewBox="0 0 32 32" fill="none"><path d="m4 10 12-6 12 6-12 6-12-6Zm0 6 12 6 12-6M4 22l12 6 12-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <div><span>What remains</span><strong>Software the next team can operate</strong></div>
      </div>
    </div>
    <div className={styles.questions}>{loops.map((loop, i) => <span key={loop.name} data-loop={i} data-lit={scene.active === i || scene.complete >= i}>{loop.question}</span>)}</div>
    <div className={shared.captions}>{captions.map((caption, i) => <p key={caption} className={shared.caption} data-visible={i === phase}>{caption}</p>)}</div>
  </>;
}

export function FdeLearningLoopsScrolly({ spec }: FdeLearningLoopsScrollyProps) {
  return <FdeStoryShell spec={spec} landscape>{phase => <NestedLoops phase={phase} />}</FdeStoryShell>;
}
