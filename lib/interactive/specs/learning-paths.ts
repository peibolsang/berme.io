import { z } from "zod";
import {
  createScrollySpecSchema,
  type ScrollyStep,
} from "../contracts/scrolly";

export const learningPathsSpecSchema =
  createScrollySpecSchema("learning-paths");

export type LearningPathsSpec = z.infer<typeof learningPathsSpecSchema>;
export type LearningPathsStep = ScrollyStep;
