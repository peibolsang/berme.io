import { z } from "zod";
import {
  createScrollySpecSchema,
  type ScrollyStep,
} from "../contracts/scrolly";

export const adoptionAmplifierSpecSchema =
  createScrollySpecSchema("adoption-amplifier");

export type AdoptionAmplifierSpec = z.infer<
  typeof adoptionAmplifierSpecSchema
>;
export type AdoptionAmplifierStep = ScrollyStep;
