import { z } from "zod";
import {
  createScrollySpecSchema,
  type ScrollyStep,
} from "../contracts/scrolly";

export const confidenceEvidenceLoopSpecSchema =
  createScrollySpecSchema("confidence-evidence-loop");

export type ConfidenceEvidenceLoopSpec = z.infer<
  typeof confidenceEvidenceLoopSpecSchema
>;
export type ConfidenceEvidenceLoopStep = ScrollyStep;
