import { z } from "zod";
import {
  createScrollySpecSchema,
  type ScrollyStep,
} from "../contracts/scrolly";

export const certaintyPhaseChangeSpecSchema =
  createScrollySpecSchema("certainty-phase-change");

export type CertaintyPhaseChangeSpec = z.infer<
  typeof certaintyPhaseChangeSpecSchema
>;
export type CertaintyPhaseChangeStep = ScrollyStep;
