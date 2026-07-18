import { z } from "zod";
import {
  createScrollySpecSchema,
  type ScrollyStep,
} from "../contracts/scrolly";

export const assumptionAvalancheSpecSchema =
  createScrollySpecSchema("assumption-avalanche");

export type AssumptionAvalancheSpec = z.infer<
  typeof assumptionAvalancheSpecSchema
>;
export type AssumptionAvalancheStep = ScrollyStep;
