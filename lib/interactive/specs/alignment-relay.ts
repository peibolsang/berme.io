import { z } from "zod";
import {
  createScrollySpecSchema,
  type ScrollyStep,
} from "../contracts/scrolly";

export const alignmentRelaySpecSchema =
  createScrollySpecSchema("alignment-relay");

export type AlignmentRelaySpec = z.infer<typeof alignmentRelaySpecSchema>;
export type AlignmentRelayStep = ScrollyStep;
