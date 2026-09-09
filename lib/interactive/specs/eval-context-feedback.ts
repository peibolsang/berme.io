import { z } from "zod";
import { createScrollySpecSchema } from "../contracts/scrolly";

export const evalContextFeedbackSpecSchema = createScrollySpecSchema("eval-context-feedback");
export type EvalContextFeedbackSpec = z.infer<typeof evalContextFeedbackSpecSchema>;
