"use client";

import type { DisputeEvidencePathSpec } from "@/lib/interactive/specs/dispute-evidence-path";
import { FdeStoryShell } from "./FdeStoryShell";
import styles from "./FdeStory.module.css";

export type DisputeEvidencePathScrollyProps = { spec: DisputeEvidencePathSpec };
const sources = [["ERP", "Invoice"], ["CRM", "Agreed price"]];
const captions = [
  "The invoice charges more than the agreed price.",
  "Finding the agreed price takes the time.",
  "Compare the records and suggest a correction.",
  "A person must approve before the correction is applied.",
  "Count the effort and mistakes, including review.",
];

export function DisputeEvidencePathScrolly({ spec }: DisputeEvidencePathScrollyProps) {
  return <FdeStoryShell spec={spec}>{(phase) => <>
    <div className={styles.dossier}>
      <div className={styles.caseHeading}><span>Disputed invoice</span><strong>Charged more than agreed</strong></div>
      <div className={styles.sources}>{sources.map(([system, document]) => <div key={system} className={styles.document} data-active={phase >= 1}>
        <span>{system}</span><strong>{document}</strong><small>Same customer</small>
      </div>)}</div>
      <div className={styles.caseRoute}>
        <svg viewBox="0 0 100 22" preserveAspectRatio="none"><path d="M25 0 V10 H75 V0 M50 10 V22" /><path className={styles.signal} data-visible={phase >= 1} d="M25 0 V10 H75 V0 M50 10 V22" /></svg>
      </div>
      <div className={styles.decision} data-active={phase >= 2}><span>Invoice vs. agreed price</span><strong>{phase >= 2 ? "Suggest a correction" : "Find and compare the records"}</strong><small className={styles.priceHelp}>If the agreed price is missing, ask for help.</small></div>
      <div className={styles.approval} data-active={phase >= 3}><span>↓</span><strong>Approval required</strong><span>↓</span></div>
      <div className={styles.ledger}><span>Billing system</span><strong>Apply only after approval</strong></div>
      <div className={styles.outcomes} data-active={phase === 4}><span>Time to resolve</span><span className={styles.totalEffort}><strong>Total effort</strong><small>Review + corrections</small></span><span>Mistakes</span></div>
    </div>
    <div className={styles.captions}>{captions.map((caption, i) => <p key={caption} className={styles.caption} data-visible={i === phase}>{caption}</p>)}</div>
  </>}</FdeStoryShell>;
}
