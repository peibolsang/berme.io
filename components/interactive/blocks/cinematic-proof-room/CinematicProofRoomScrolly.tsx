"use client";

import { useId } from "react";
import type {
  CinematicProofRoomSpec,
  CinematicProofRoomStep,
} from "@/lib/interactive/specs/cinematic-proof-room";
import {
  getScrollyStepStatus,
  useActiveScrollyStep,
  type ScrollyStepStatus,
} from "../../primitives/useActiveScrollyStep";
import styles from "./CinematicProofRoomScrolly.module.css";

export type CinematicProofRoomScrollyProps = {
  spec: CinematicProofRoomSpec;
};

type StoryBeatProps = {
  index: number;
  setRef: (node: HTMLElement | null) => void;
  status: ScrollyStepStatus;
  step: CinematicProofRoomStep;
};

const CinematicRoom = ({
  activeIndex,
  description,
  steps,
}: {
  activeIndex: number;
  description: string;
  steps: CinematicProofRoomStep[];
}) => {
  const activeStep = steps[activeIndex];
  const showsBoards = activeIndex >= 1;
  const showsBuild = activeIndex >= 2;
  const showsInspection = activeIndex >= 3;
  const showsRepair = activeIndex === 4;
  const showsDelivery = activeIndex === steps.length - 1;

  return (
    <div
      aria-label={`${description} Step ${activeIndex + 1} of ${steps.length}: ${activeStep.label}.`}
      className={styles.room}
      role="img"
    >
      <div aria-hidden="true" className={styles.roomHeader}>
        <span>Remotion proof room · scene 01</span>
        <strong>{showsDelivery ? "Ready to deliver" : activeStep.label}</strong>
      </div>

      <svg
        aria-hidden="true"
        className={styles.visual}
        focusable="false"
        preserveAspectRatio="xMidYMid meet"
        viewBox="0 0 900 500"
      >
        <g className={styles.perforations}>
          {[60, 126, 192, 258, 324, 390, 456].map((y) => (
            <g key={y}>
              <rect height="22" rx="4" width="13" x="22" y={y} />
              <rect height="22" rx="4" width="13" x="865" y={y} />
            </g>
          ))}
        </g>

        <g className={styles.monitor}>
          <rect height="274" rx="13" width="530" x="77" y="57" />
          <path className={styles.cropMark} d="M96 88V76H110M574 76H588V88M96 300V312H110M574 312H588V300" />
          <circle className={styles.worldSun} cx="214" cy="157" r="39" />
          <path className={styles.worldFar} d="M105 278L231 170L335 247L424 151L578 278Z" />
          <path className={styles.worldNear} d="M105 278L255 216L338 275L464 202L578 278Z" />
          <g className={`${styles.subject} ${showsBoards ? styles.obscured : ""}`}>
            <rect height="54" rx="4" width="78" x="304" y="196" />
            <circle cx="343" cy="181" r="18" />
          </g>
          <text className={styles.monitorLabel} x="104" y="92">VISUAL ARGUMENT</text>
          <text className={styles.monitorTitle} x="343" y="304">ONE CHANGE THE VIEWER CAN FOLLOW</text>
        </g>

        <g className={`${styles.storyboards} ${showsBoards ? styles.visible : ""}`}>
          {[0, 1, 2].map((index) => (
            <g key={index} transform={`translate(${112 + index * 158} 104)`}>
              <rect height="112" rx="6" width="132" />
              <circle cx={34 + index * 24} cy={40 + index * 9} r="14" />
              <path d={`M14 91L${52 + index * 9} 56L84 82L118 ${42 + index * 7}V98H14Z`} />
              <text x="66" y="128">BEAT {String(index + 1).padStart(2, "0")}</text>
            </g>
          ))}
          <g className={styles.storyGate}>
            <rect height="31" rx="15.5" width="178" x="256" y="259" />
            <text x="345" y="279">ANTI-INFOGRAPHIC GATE</text>
          </g>
        </g>

        <g className={`${styles.timeline} ${showsBuild ? styles.visible : ""}`}>
          <text x="77" y="370">REMOTION PROJECT</text>
          <line x1="77" x2="606" y1="390" y2="390" />
          {[
            { color: styles.trackAmber, width: 176, x: 96 },
            { color: styles.trackTeal, width: 238, x: 246 },
            { color: styles.trackRose, width: 166, x: 422 },
          ].map((track, index) => (
            <rect className={track.color} height="17" key={index} rx="4" width={track.width} x={track.x} y={405 + index * 24} />
          ))}
          <line className={styles.playhead} x1="422" x2="422" y1="382" y2="476" />
        </g>

        <g className={`${styles.inspectionRack} ${showsInspection ? styles.visible : ""}`}>
          <text className={styles.rackTitle} x="643" y="77">PARALLEL INSPECTION</text>
          {[
            "Build & contract",
            "Stills & motion",
            "Narration & timing",
          ].map((label, index) => (
            <g
              className={`${styles.meter} ${showsRepair && index === 1 ? styles.failed : ""} ${showsDelivery ? styles.passed : ""}`}
              key={label}
              transform={`translate(643 ${105 + index * 92})`}
            >
              <rect height="67" rx="7" width="191" />
              <text x="15" y="24">{label}</text>
              <line x1="15" x2="174" y1="43" y2="43" />
              <circle cx={showsRepair && index === 1 ? 87 : 163} cy="43" r="7" />
            </g>
          ))}
          <g className={`${styles.combinedGate} ${showsDelivery ? styles.passed : ""}`}>
            <rect height="58" rx="9" width="191" x="643" y="397" />
            <text x="658" y="420">COMBINED GATE</text>
            <text className={styles.gateState} x="658" y="440">{showsDelivery ? "PASS · DELIVER PROJECT" : showsRepair ? "FAIL · REPAIR MOTION" : "WAITING FOR EVIDENCE"}</text>
          </g>
        </g>

        <path className={`${styles.repairPath} ${showsRepair ? styles.visible : ""}`} d="M738 289C738 355 635 358 606 315" />
        <text className={`${styles.repairLabel} ${showsRepair ? styles.visible : ""}`} x="692" y="360">REPAIR THE RELEVANT LAYER</text>
      </svg>
    </div>
  );
};

const StoryBeat = ({ index, setRef, status, step }: StoryBeatProps) => (
  <article
    ref={setRef}
    aria-current={status === "active" ? "step" : undefined}
    className={`${styles.beat} ${styles[status]}`}
  >
    <div>
      <p className={styles.beatLabel}>
        Scene check {String(index + 1).padStart(2, "0")} · {step.label}
      </p>
      <h2>{step.title}</h2>
      <p>{step.body}</p>
    </div>
  </article>
);

export const CinematicProofRoomScrolly = ({
  spec,
}: CinematicProofRoomScrollyProps) => {
  const titleId = useId();
  const { activeIndex, registerStep, sectionRef, stageRef } =
    useActiveScrollyStep({ stepCount: spec.steps.length });

  return (
    <section
      ref={sectionRef}
      aria-labelledby={titleId}
      className={`interactive-breakout ${styles.section}`}
      data-active-step={activeIndex + 1}
    >
      <div className={styles.layout}>
        <div ref={stageRef} className={styles.stage}>
          <div className={styles.stageInner}>
            <p className={styles.eyebrow}>{spec.eyebrow}</p>
            <h2 id={titleId}>{spec.title}</h2>
            <CinematicRoom
              activeIndex={activeIndex}
              description={spec.description}
              steps={spec.steps}
            />
          </div>
        </div>

        <div className={styles.steps}>
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
