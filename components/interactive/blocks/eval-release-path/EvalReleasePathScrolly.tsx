"use client";

import type { EvalReleasePathSpec } from "@/lib/interactive/specs/eval-release-path";
import { DiagramLabel as Label, EvalStoryShell } from "./EvalStoryShell";
import { EvalGate, PathTraveller, PipelineRail } from "./EvalPathPrimitives";
import styles from "./EvalStory.module.css";

export type EvalReleasePathScrollyProps = { spec: EvalReleasePathSpec };
const TRACK = "M0 260 C120 260 145 155 280 155 H780";
const REPAIR = "M480 155 C480 320 260 325 260 155";
const JOURNEY = [
  "M55 254", "C135 235 170 155 260 155", "L390 155", "L480 155",
  "C480 320 260 325 260 155", "L570 155", "L740 155",
] as const;
const CAPTIONS = [
  'The task sets the standard.', 'The draft has to earn its way forward.',
  'Code checks the structure.', 'Unsupported claim · candidate blocked.',
  'Retry within a limit, or reject / escalate.', 'Review the argument against the original intent.',
  'Required checks passed · release approved.',
];

function ReleaseInstrument({ beat }: { beat: number }) {
  const failed = beat === 3 || beat === 4;
  return <>
    <div className={`${styles.diagram} ${styles.anatomy}`} data-beat={beat}>
      <svg viewBox="0 0 800 360" preserveAspectRatio="none" focusable="false">
        <PipelineRail d={TRACK} lit={false} />
        <path d="M0 260 C120 260 145 155 280 155 H480" className={styles.thread} />
        <path d="M480 155 H780" className={styles.thread} style={{ opacity: beat >= 5 ? 1 : 0.08 }} />
        <g className={styles.loopReveal} data-visible={failed}>
          <path d={REPAIR} className={styles.returnRim} />
          <path d={REPAIR} className={styles.returnPipe} />
          <path d={REPAIR} className={styles.failure} />
          <path d="M250 172 L260 155 L270 172" className={styles.failure} />
        </g>
        <EvalGate x={390} y={155} tone="amber" state={beat < 2 ? 'waiting' : beat === 2 ? 'active' : 'passed'} />
        <EvalGate x={480} y={155} tone="blue" state={beat < 3 ? 'waiting' : beat === 3 ? 'failed' : beat === 4 ? 'active' : 'passed'} />
        <EvalGate x={570} y={155} tone="blue" state={beat < 5 ? 'waiting' : beat === 5 ? 'active' : 'passed'} />
        <g className={styles.releaseDoor} data-open={beat === 6}>
          <path d="M650 126 V184" />
          <path d="M644 126 H656 M644 184 H656" />
        </g>
        <PathTraveller segments={JOURNEY} stop={beat} />
      </svg>
      <Label x={7} y={58}>Task</Label>
      <Label x={21} y={40}>Agent run</Label>
      <Label x={33} y={25}>Candidate</Label>
      <Label x={49} y={65} tone="amber">Structure</Label>
      <Label x={60} y={76} tone={failed ? 'red' : 'blue'}>Support</Label>
      <Label x={71} y={65} tone="blue">Intent</Label>
      <div className={styles.releaseLabels}>
        <Label x={60} y={0}>Evaluate</Label>
        <Label x={82} y={0}>Decision</Label>
        <Label x={94} y={0}>Release</Label>
      </div>
      <div className={styles.loopLabel} data-visible={failed}>
        <Label x={45} y={94} tone="red">Repair, then evaluate again</Label>
      </div>
    </div>
    <div className={styles.evidence} aria-hidden="true">
      <span data-state={beat >= 2 ? 'passed' : 'waiting'}><i />Structure <b>{beat >= 2 ? 'Valid' : 'Pending'}</b></span>
      <span data-state={failed ? 'failed' : beat >= 5 ? 'passed' : 'waiting'}><i />Support <b>{beat === 3 ? 'Blocked' : beat === 4 ? 'Recheck' : beat >= 5 ? 'Supported' : 'Pending'}</b></span>
      <span data-state={beat === 6 ? 'passed' : 'waiting'}><i />Release <b>{beat === 6 ? 'Approved' : 'Held'}</b></span>
    </div>
    <div className={styles.captionStack}>{CAPTIONS.map((caption, i) => <p key={caption} className={styles.caption} data-visible={beat === i}>{caption}</p>)}</div>
  </>;
}

export function EvalReleasePathScrolly({ spec }: EvalReleasePathScrollyProps) {
  return <EvalStoryShell spec={spec}>{(index) => <ReleaseInstrument beat={Math.round(index * 6 / (spec.steps.length - 1))} />}</EvalStoryShell>;
}
