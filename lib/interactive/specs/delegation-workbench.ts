import { z } from "zod";
import {
  createScrollySpecSchema,
  type ScrollyStep,
} from "../contracts/scrolly";

export const delegationWorkbenchSpecSchema =
  createScrollySpecSchema("delegation-workbench");

export type DelegationWorkbenchSpec = z.infer<
  typeof delegationWorkbenchSpecSchema
>;
export type DelegationWorkbenchStep = ScrollyStep;
