import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { AlignmentRelayScrollyProps } from "./blocks/alignment-relay/AlignmentRelayScrolly";
import type { ConstraintDescentScrollyProps } from "./blocks/constraint-descent/ConstraintDescentScrolly";
import type { LearningPathsScrollyProps } from "./blocks/learning-paths/LearningPathsScrolly";
import type { PracticeSpiralScrollyProps } from "./blocks/practice-spiral/PracticeSpiralScrolly";
import type { RoadmapApertureScrollyProps } from "./blocks/roadmap-aperture/RoadmapApertureScrolly";
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

const AlignmentRelayScrolly = dynamic<AlignmentRelayScrollyProps>(() =>
  import("./blocks/alignment-relay/AlignmentRelayScrolly").then(
    (module) => module.AlignmentRelayScrolly,
  ),
);

const ConstraintDescentScrolly = dynamic<ConstraintDescentScrollyProps>(() =>
  import("./blocks/constraint-descent/ConstraintDescentScrolly").then(
    (module) => module.ConstraintDescentScrolly,
  ),
);

const LearningPathsScrolly = dynamic<LearningPathsScrollyProps>(() =>
  import("./blocks/learning-paths/LearningPathsScrolly").then(
    (module) => module.LearningPathsScrolly,
  ),
);

const PracticeSpiralScrolly = dynamic<PracticeSpiralScrollyProps>(() =>
  import("./blocks/practice-spiral/PracticeSpiralScrolly").then(
    (module) => module.PracticeSpiralScrolly,
  ),
);

const RoadmapApertureScrolly = dynamic<RoadmapApertureScrollyProps>(() =>
  import("./blocks/roadmap-aperture/RoadmapApertureScrolly").then(
    (module) => module.RoadmapApertureScrolly,
  ),
);

export const interactiveComponentRegistry = {
  "alignment-relay": AlignmentRelayScrolly,
  "constraint-descent": ConstraintDescentScrolly,
  "learning-paths": LearningPathsScrolly,
  "practice-spiral": PracticeSpiralScrolly,
  "roadmap-aperture": RoadmapApertureScrolly,
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
