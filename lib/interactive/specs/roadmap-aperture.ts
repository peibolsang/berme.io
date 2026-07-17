import { z } from "zod";
import {
  createScrollySpecSchema,
  type ScrollyStep,
} from "../contracts/scrolly";

export const roadmapApertureSpecSchema =
  createScrollySpecSchema("roadmap-aperture");

export type RoadmapApertureSpec = z.infer<typeof roadmapApertureSpecSchema>;
export type RoadmapApertureStep = ScrollyStep;
