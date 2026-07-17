import { z } from "zod";
import {
  createScrollySpecSchema,
  type ScrollyStep,
} from "../contracts/scrolly";

export const constraintDescentSpecSchema = createScrollySpecSchema(
  "constraint-descent",
);

export type ConstraintDescentSpec = z.infer<
  typeof constraintDescentSpecSchema
>;

export type ConstraintDescentStep = ScrollyStep;
