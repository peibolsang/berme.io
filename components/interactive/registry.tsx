import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { AdoptionAmplifierScrollyProps } from "./blocks/adoption-amplifier/AdoptionAmplifierScrolly";
import type { AssumptionAvalancheScrollyProps } from "./blocks/assumption-avalanche/AssumptionAvalancheScrolly";
import type { CertaintyPhaseChangeScrollyProps } from "./blocks/certainty-phase-change/CertaintyPhaseChangeScrolly";
import type { ConstraintDescentScrollyProps } from "./blocks/constraint-descent/ConstraintDescentScrolly";
import type { ConstraintMigrationScrollyProps } from "./blocks/constraint-migration/ConstraintMigrationScrolly";
import type { DelegationLoopShiftScrollyProps } from "./blocks/delegation-loop-shift/DelegationLoopShiftScrolly";
import type { DelegationWorkbenchScrollyProps } from "./blocks/delegation-workbench/DelegationWorkbenchScrolly";
import type { DesignSpaceFieldScrollyProps } from "./blocks/design-space-field/DesignSpaceFieldScrolly";
import type { LearningPathsScrollyProps } from "./blocks/learning-paths/LearningPathsScrolly";
import type { InnerLoopControlScrollyProps } from "./blocks/inner-loop-control/InnerLoopControlScrolly";
import type { PracticeSpiralScrollyProps } from "./blocks/practice-spiral/PracticeSpiralScrolly";
import type {
  InteractiveComponentId,
  InteractiveSpec,
  InteractiveSpecMap,
} from "@/lib/interactive/types";

type InteractiveRendererRegistry = {
  [ComponentId in InteractiveComponentId]: ComponentType<{
    spec: InteractiveSpecMap[ComponentId];
  }>;
};

const AdoptionAmplifierScrolly = dynamic<AdoptionAmplifierScrollyProps>(() =>
  import("./blocks/adoption-amplifier/AdoptionAmplifierScrolly").then(
    (module) => module.AdoptionAmplifierScrolly,
  ),
);

const AssumptionAvalancheScrolly =
  dynamic<AssumptionAvalancheScrollyProps>(() =>
    import(
      "./blocks/assumption-avalanche/AssumptionAvalancheScrolly"
    ).then((module) => module.AssumptionAvalancheScrolly),
  );

const CertaintyPhaseChangeScrolly =
  dynamic<CertaintyPhaseChangeScrollyProps>(() =>
    import(
      "./blocks/certainty-phase-change/CertaintyPhaseChangeScrolly"
    ).then((module) => module.CertaintyPhaseChangeScrolly),
  );

const ConstraintDescentScrolly = dynamic<ConstraintDescentScrollyProps>(() =>
  import("./blocks/constraint-descent/ConstraintDescentScrolly").then(
    (module) => module.ConstraintDescentScrolly,
  ),
);

const ConstraintMigrationScrolly =
  dynamic<ConstraintMigrationScrollyProps>(() =>
    import(
      "./blocks/constraint-migration/ConstraintMigrationScrolly"
    ).then((module) => module.ConstraintMigrationScrolly),
  );

const DelegationLoopShiftScrolly = dynamic<DelegationLoopShiftScrollyProps>(
  () =>
    import("./blocks/delegation-loop-shift/DelegationLoopShiftScrolly").then(
      (module) => module.DelegationLoopShiftScrolly,
    ),
);

const DelegationWorkbenchScrolly = dynamic<DelegationWorkbenchScrollyProps>(
  () =>
    import("./blocks/delegation-workbench/DelegationWorkbenchScrolly").then(
      (module) => module.DelegationWorkbenchScrolly,
    ),
);

const DesignSpaceFieldScrolly = dynamic<DesignSpaceFieldScrollyProps>(() =>
  import("./blocks/design-space-field/DesignSpaceFieldScrolly").then(
    (module) => module.DesignSpaceFieldScrolly,
  ),
);

const LearningPathsScrolly = dynamic<LearningPathsScrollyProps>(() =>
  import("./blocks/learning-paths/LearningPathsScrolly").then(
    (module) => module.LearningPathsScrolly,
  ),
);

const InnerLoopControlScrolly = dynamic<InnerLoopControlScrollyProps>(() =>
  import("./blocks/inner-loop-control/InnerLoopControlScrolly").then(
    (module) => module.InnerLoopControlScrolly,
  ),
);

const PracticeSpiralScrolly = dynamic<PracticeSpiralScrollyProps>(() =>
  import("./blocks/practice-spiral/PracticeSpiralScrolly").then(
    (module) => module.PracticeSpiralScrolly,
  ),
);

export const interactiveComponentRegistry = {
  "adoption-amplifier": AdoptionAmplifierScrolly,
  "assumption-avalanche": AssumptionAvalancheScrolly,
  "certainty-phase-change": CertaintyPhaseChangeScrolly,
  "constraint-descent": ConstraintDescentScrolly,
  "constraint-migration": ConstraintMigrationScrolly,
  "delegation-loop-shift": DelegationLoopShiftScrolly,
  "delegation-workbench": DelegationWorkbenchScrolly,
  "design-space-field": DesignSpaceFieldScrolly,
  "learning-paths": LearningPathsScrolly,
  "inner-loop-control": InnerLoopControlScrolly,
  "practice-spiral": PracticeSpiralScrolly,
} satisfies InteractiveRendererRegistry;

type InteractiveRendererProps = {
  spec: InteractiveSpec;
};

export const InteractiveRenderer = ({ spec }: InteractiveRendererProps) => {
  // Every registry entry is checked against its corresponding spec type above.
  // The cast only joins those correlated types after runtime schema validation.
  const Component = interactiveComponentRegistry[
    spec.component
  ] as ComponentType<{ spec: InteractiveSpec }>;

  return <Component spec={spec} />;
};
