import type { z } from "zod";
import type {
  ScrollySpec,
  ScrollySpecSchema,
} from "./contracts/scrolly";
import type { AdoptionAmplifierSpec } from "./specs/adoption-amplifier";
import type { ArticleEvidenceWorkbenchSpec } from "./specs/article-evidence-workbench";
import type { AssumptionAvalancheSpec } from "./specs/assumption-avalanche";
import type { CertaintyPhaseChangeSpec } from "./specs/certainty-phase-change";
import type { CinematicProofRoomSpec } from "./specs/cinematic-proof-room";
import type { ConfidenceEvidenceLoopSpec } from "./specs/confidence-evidence-loop";
import type { ConstraintDescentSpec } from "./specs/constraint-descent";
import type { ConstraintMigrationSpec } from "./specs/constraint-migration";
import type { DelegationLoopShiftSpec } from "./specs/delegation-loop-shift";
import type { DelegationWorkbenchSpec } from "./specs/delegation-workbench";
import type { DesignSpaceFieldSpec } from "./specs/design-space-field";
import type { LearningPathsSpec } from "./specs/learning-paths";
import type { InnerLoopControlSpec } from "./specs/inner-loop-control";
import type { PracticeSpiralSpec } from "./specs/practice-spiral";

export type InteractiveKind = "chart" | "explorable" | "scrolly";

export type InteractiveSpecMap = {
  "adoption-amplifier": AdoptionAmplifierSpec;
  "article-evidence-workbench": ArticleEvidenceWorkbenchSpec;
  "assumption-avalanche": AssumptionAvalancheSpec;
  "certainty-phase-change": CertaintyPhaseChangeSpec;
  "cinematic-proof-room": CinematicProofRoomSpec;
  "confidence-evidence-loop": ConfidenceEvidenceLoopSpec;
  "constraint-descent": ConstraintDescentSpec;
  "constraint-migration": ConstraintMigrationSpec;
  "delegation-loop-shift": DelegationLoopShiftSpec;
  "delegation-workbench": DelegationWorkbenchSpec;
  "design-space-field": DesignSpaceFieldSpec;
  "learning-paths": LearningPathsSpec;
  "inner-loop-control": InnerLoopControlSpec;
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
