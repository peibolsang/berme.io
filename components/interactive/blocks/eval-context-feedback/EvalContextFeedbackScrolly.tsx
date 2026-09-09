"use client";

import type { EvalContextFeedbackSpec } from "@/lib/interactive/specs/eval-context-feedback";
import { DiagramLabel as Label, EvalStoryShell } from "../eval-release-path/EvalStoryShell";
import { EvalGate, PathTraveller, PipelineRail } from "../eval-release-path/EvalPathPrimitives";
import styles from "../eval-release-path/EvalStory.module.css";

export type EvalContextFeedbackScrollyProps = { spec: EvalContextFeedbackSpec };
const LANES = ["M0 190 H95 C215 190 190 100 320 100 H760", "M0 190 H95 C215 190 190 280 320 280 H760"];
const OFFLINE = ["M95 190", "C215 190 190 100 320 100 H360", "H600"];
const ONLINE = ["M95 190", "C215 190 190 280 320 280 H360", "H600", "H600", "C810 330 810 45 600 100", "H600"];
const ENCODE = ["M600 100", "H360"];
const FEEDBACK = "M600 280 C810 330 810 45 600 100";
const CAPTIONS = [
  'Where an eval runs and how it judges are separate choices.', 'Stable rules apply to test cases and real runs.',
  'Rubrics test meaning in both contexts.', 'A real run exposes a missing check.',
  'A real failure becomes a case we can test.', 'Encode stable requirements; keep judging claim support.',
];

function ContextInstrument({ beat }: { beat: number }) {
  return <>
    <div className={`${styles.diagram} ${styles.taxonomy}`} data-beat={beat}>
      <svg viewBox="0 0 800 380" preserveAspectRatio="none" focusable="false">
        {LANES.map((d) => <PipelineRail key={d} d={d} />)}
        <g className={styles.loopReveal} data-visible={beat >= 4}>
          <path d={FEEDBACK} className={styles.returnRim} />
          <path d={FEEDBACK} className={styles.returnPipe} />
          <path d={FEEDBACK} className={styles.failure} />
          <path d="M619 88 L600 100 L620 106" className={styles.failure} />
        </g>
        {[100, 280].map((y) => <g key={y}>
          <EvalGate x={360} y={y} tone="amber" state={beat === 0 ? 'waiting' : beat === 1 || (beat === 5 && y === 100) ? 'active' : 'passed'} />
          <EvalGate x={600} y={y} tone="blue" state={beat < 2 ? 'waiting' : beat >= 3 && y === 280 ? 'failed' : beat === 2 || beat >= 4 ? 'active' : 'passed'} />
        </g>)}
        <g className={styles.reveal} data-visible={beat === 5}>
          <path d="M580 100 H380" className={styles.encoded} />
          <path d="M393 93 L379 100 L393 107" className={styles.encoded} />
        </g>
        <g className={styles.reveal} data-visible={beat < 3}>
          <PathTraveller segments={OFFLINE} stop={Math.min(beat, 2)} />
        </g>
        <PathTraveller segments={ONLINE} stop={beat} />
        <g className={styles.reveal} data-visible={beat === 5}>
          <PathTraveller segments={ENCODE} stop={beat === 5 ? 1 : 0} />
        </g>
      </svg>
      <Label x={19} y={13}>Offline<small>Controlled cases</small></Label>
      <Label x={19} y={83}>Online<small>Real runs</small></Label>
      <Label x={45} y={4} tone="amber">Deterministic<small>Stable rules · code</small></Label>
      <Label x={75} y={4} tone="blue">Non-deterministic<small>Model or human judgment</small></Label>
      <Label x={45} y={44}>Schema regression</Label>
      <Label x={75} y={44} tone={beat >= 4 ? 'blue' : 'ink'}>{beat >= 4 ? 'Claim-support regression' : 'Voice rubric on test drafts'}</Label>
      <Label x={45} y={94}>Live tool restriction</Label>
      <Label x={75} y={94} tone={beat >= 3 ? 'red' : 'ink'}>{beat >= 3 ? 'Unsupported claim' : 'Claim support in a real run'}</Label>
    </div>
    <div className={styles.evidence} aria-hidden="true">
      <span data-state={beat >= 1 ? 'passed' : 'waiting'}><i />Rules <b>{beat >= 1 ? 'Code' : 'Pending'}</b></span>
      <span data-state={beat >= 2 ? 'judgment' : 'waiting'}><i />Meaning <b>{beat >= 2 ? 'Rubric' : 'Pending'}</b></span>
      <span data-state={beat === 3 ? 'failed' : beat >= 4 ? 'judgment' : 'waiting'}><i />{beat >= 4 ? 'Offline case' : 'Real run'} <b>{beat >= 4 ? 'Captured' : beat === 3 ? 'Blocked' : 'Observe'}</b></span>
    </div>
    <div className={styles.captionStack}>{CAPTIONS.map((caption, i) => <p key={caption} className={styles.caption} data-visible={beat === i}>{caption}</p>)}</div>
  </>;
}

export function EvalContextFeedbackScrolly({ spec }: EvalContextFeedbackScrollyProps) {
  return <EvalStoryShell spec={spec}>{(index) => <ContextInstrument beat={Math.round(index * 5 / (spec.steps.length - 1))} />}</EvalStoryShell>;
}
