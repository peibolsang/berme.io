import { z } from "zod";
import {
  createScrollySpecSchema,
  type ScrollyStep,
} from "../contracts/scrolly";

export const practiceSpiralSpecSchema =
  createScrollySpecSchema("practice-spiral");

export type PracticeSpiralSpec = z.infer<typeof practiceSpiralSpecSchema>;
export type PracticeSpiralStep = ScrollyStep;
