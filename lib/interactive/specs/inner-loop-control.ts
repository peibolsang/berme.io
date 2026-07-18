import { z } from "zod";
import {
  createScrollySpecSchema,
  type ScrollyStep,
} from "../contracts/scrolly";

export const innerLoopControlSpecSchema =
  createScrollySpecSchema("inner-loop-control");

export type InnerLoopControlSpec = z.infer<
  typeof innerLoopControlSpecSchema
>;
export type InnerLoopControlStep = ScrollyStep;
