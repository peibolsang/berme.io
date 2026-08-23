import { adoptionAmplifierSpecSchema } from "./specs/adoption-amplifier";
import { assumptionAvalancheSpecSchema } from "./specs/assumption-avalanche";
import { certaintyPhaseChangeSpecSchema } from "./specs/certainty-phase-change";
import { constraintDescentSpecSchema } from "./specs/constraint-descent";
import { constraintMigrationSpecSchema } from "./specs/constraint-migration";
import { delegationLoopShiftSpecSchema } from "./specs/delegation-loop-shift";
import { delegationWorkbenchSpecSchema } from "./specs/delegation-workbench";
import { designSpaceFieldSpecSchema } from "./specs/design-space-field";
import { learningPathsSpecSchema } from "./specs/learning-paths";
import { innerLoopControlSpecSchema } from "./specs/inner-loop-control";
import { practiceSpiralSpecSchema } from "./specs/practice-spiral";
import type {
  InteractiveComponentId,
  InteractiveDefinitionRegistry,
  InteractiveParseResult,
} from "./types";

export const interactiveDefinitionRegistry = {
  "adoption-amplifier": {
    kind: "scrolly",
    schema: adoptionAmplifierSpecSchema,
    version: 1,
  },
  "assumption-avalanche": {
    kind: "scrolly",
    schema: assumptionAvalancheSpecSchema,
    version: 1,
  },
  "certainty-phase-change": {
    kind: "scrolly",
    schema: certaintyPhaseChangeSpecSchema,
    version: 1,
  },
  "constraint-descent": {
    kind: "scrolly",
    schema: constraintDescentSpecSchema,
    version: 1,
  },
  "constraint-migration": {
    kind: "scrolly",
    schema: constraintMigrationSpecSchema,
    version: 1,
  },
  "delegation-loop-shift": {
    kind: "scrolly",
    schema: delegationLoopShiftSpecSchema,
    version: 1,
  },
  "delegation-workbench": {
    kind: "scrolly",
    schema: delegationWorkbenchSpecSchema,
    version: 1,
  },
  "design-space-field": {
    kind: "scrolly",
    schema: designSpaceFieldSpecSchema,
    version: 1,
  },
  "learning-paths": {
    kind: "scrolly",
    schema: learningPathsSpecSchema,
    version: 1,
  },
  "inner-loop-control": {
    kind: "scrolly",
    schema: innerLoopControlSpecSchema,
    version: 1,
  },
  "practice-spiral": {
    kind: "scrolly",
    schema: practiceSpiralSpecSchema,
    version: 1,
  },
} satisfies InteractiveDefinitionRegistry;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isInteractiveComponentId = (
  value: string,
): value is InteractiveComponentId =>
  Object.hasOwn(interactiveDefinitionRegistry, value);

const formatIssuePath = (path: PropertyKey[]) =>
  path.length > 0 ? ` at ${path.map(String).join(".")}` : "";

export const parseInteractiveSpec = (
  source: string,
): InteractiveParseResult => {
  let value: unknown;

  try {
    value = JSON.parse(source);
  } catch {
    return { error: "The interactive block must contain valid JSON.", ok: false };
  }

  if (!isRecord(value) || typeof value.component !== "string") {
    return {
      error: "The interactive block must declare a component ID.",
      ok: false,
    };
  }

  if (!isInteractiveComponentId(value.component)) {
    return {
      error: `The interactive component “${value.component}” is not registered.`,
      ok: false,
    };
  }

  const definition = interactiveDefinitionRegistry[value.component];
  const result = definition.schema.safeParse(value);

  if (!result.success) {
    const issue = result.error.issues[0];
    const location = issue ? formatIssuePath(issue.path) : "";
    const message = issue?.message ?? "The component configuration is invalid.";

    return {
      error: `Invalid ${value.component} configuration${location}: ${message}`,
      ok: false,
    };
  }

  return { ok: true, spec: result.data };
};
