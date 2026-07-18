import { z } from "zod";
import {
  createScrollySpecSchema,
  type ScrollyStep,
} from "../contracts/scrolly";

export const constraintMigrationSpecSchema =
  createScrollySpecSchema("constraint-migration");

export type ConstraintMigrationSpec = z.infer<
  typeof constraintMigrationSpecSchema
>;
export type ConstraintMigrationStep = ScrollyStep;
