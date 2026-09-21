import { z } from "zod";
import { createScrollySpecSchema, type ScrollyStep } from "../contracts/scrolly";

export const disputeEvidencePathSpecSchema = createScrollySpecSchema("dispute-evidence-path");
export type DisputeEvidencePathSpec = z.infer<typeof disputeEvidencePathSpecSchema>;
export type DisputeEvidencePathStep = ScrollyStep;
