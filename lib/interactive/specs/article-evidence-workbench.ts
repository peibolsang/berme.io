import { z } from "zod";
import {
  createScrollySpecSchema,
  type ScrollyStep,
} from "../contracts/scrolly";

export const articleEvidenceWorkbenchSpecSchema =
  createScrollySpecSchema("article-evidence-workbench");

export type ArticleEvidenceWorkbenchSpec = z.infer<
  typeof articleEvidenceWorkbenchSpecSchema
>;
export type ArticleEvidenceWorkbenchStep = ScrollyStep;
