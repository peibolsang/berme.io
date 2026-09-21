import { z } from "zod";
import { createScrollySpecSchema, type ScrollyStep } from "../contracts/scrolly";

export const fdeLearningLoopsSpecSchema = createScrollySpecSchema("fde-learning-loops");
export type FdeLearningLoopsSpec = z.infer<typeof fdeLearningLoopsSpecSchema>;
export type FdeLearningLoopsStep = ScrollyStep;
