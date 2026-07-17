import { z } from "zod";
import {
  createScrollySpecSchema,
  type ScrollyStep,
} from "../contracts/scrolly";

export const designSpaceFieldSpecSchema =
  createScrollySpecSchema("design-space-field");

export type DesignSpaceFieldSpec = z.infer<
  typeof designSpaceFieldSpecSchema
>;
export type DesignSpaceFieldStep = ScrollyStep;
