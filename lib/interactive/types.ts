import type { z } from "zod";
import type {
  ScrollySpec,
  ScrollySpecSchema,
} from "./contracts/scrolly";
import type { AlignmentRelaySpec } from "./specs/alignment-relay";
import type { ConstraintDescentSpec } from "./specs/constraint-descent";
import type { LearningPathsSpec } from "./specs/learning-paths";
import type { PracticeSpiralSpec } from "./specs/practice-spiral";
import type { RoadmapApertureSpec } from "./specs/roadmap-aperture";

export type InteractiveKind = "chart" | "explorable" | "scrolly";

export type InteractiveSpecMap = {
  "alignment-relay": AlignmentRelaySpec;
  "constraint-descent": ConstraintDescentSpec;
  "learning-paths": LearningPathsSpec;
  "practice-spiral": PracticeSpiralSpec;
  "roadmap-aperture": RoadmapApertureSpec;
};

export type InteractiveComponentId = keyof InteractiveSpecMap;
export type InteractiveSpec = InteractiveSpecMap[InteractiveComponentId];

export type InteractiveParseResult =
  | { ok: true; spec: InteractiveSpec }
  | { error: string; ok: false };

export type InteractiveDefinitionRegistry = {
  [ComponentId in InteractiveComponentId]:
    InteractiveSpecMap[ComponentId] extends ScrollySpec<ComponentId>
      ? {
          kind: "scrolly";
          schema: ScrollySpecSchema<ComponentId> &
            z.ZodType<InteractiveSpecMap[ComponentId]>;
          version: InteractiveSpecMap[ComponentId]["version"];
        }
      : {
          kind: Exclude<InteractiveKind, "scrolly">;
          schema: z.ZodType<InteractiveSpecMap[ComponentId]>;
          version: InteractiveSpecMap[ComponentId]["version"];
        };
};
