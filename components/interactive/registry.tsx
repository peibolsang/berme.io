import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { ConstraintDescentScrollyProps } from "./blocks/constraint-descent/ConstraintDescentScrolly";
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

const ConstraintDescentScrolly = dynamic<ConstraintDescentScrollyProps>(() =>
  import("./blocks/constraint-descent/ConstraintDescentScrolly").then(
    (module) => module.ConstraintDescentScrolly,
  ),
);

export const interactiveComponentRegistry = {
  "constraint-descent": ConstraintDescentScrolly,
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
