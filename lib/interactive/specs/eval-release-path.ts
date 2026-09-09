import { z } from "zod";
import { createScrollySpecSchema } from "../contracts/scrolly";

export const evalReleasePathSpecSchema = createScrollySpecSchema("eval-release-path");
export type EvalReleasePathSpec = z.infer<typeof evalReleasePathSpecSchema>;
