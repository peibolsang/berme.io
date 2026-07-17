import { z } from "zod";
import {
  createScrollySpecSchema,
  type ScrollyStep,
} from "../contracts/scrolly";

export const delegationLoopShiftSpecSchema =
  createScrollySpecSchema("delegation-loop-shift");

export type DelegationLoopShiftSpec = z.infer<
  typeof delegationLoopShiftSpecSchema
>;
export type DelegationLoopShiftStep = ScrollyStep;
