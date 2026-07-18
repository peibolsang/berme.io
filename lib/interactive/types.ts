import type { z } from "zod";
import type {
  ScrollySpec,
  ScrollySpecSchema,
} from "./contracts/scrolly";
import type { ConstraintDescentSpec } from "./specs/constraint-descent";
import type { LearningPathsSpec } from "./specs/learning-paths";
import type { PracticeSpiralSpec } from "./specs/practice-spiral";

export type InteractiveKind = "chart" | "explorable" | "scrolly";

export type InteractiveSpecMap = {
  "constraint-descent": ConstraintDescentSpec;
  "learning-paths": LearningPathsSpec;
  "practice-spiral": PracticeSpiralSpec;
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
