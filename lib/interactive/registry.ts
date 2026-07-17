import { constraintDescentSpecSchema } from "./specs/constraint-descent";
import type {
  InteractiveComponentId,
  InteractiveDefinitionRegistry,
  InteractiveParseResult,
} from "./types";

export const interactiveDefinitionRegistry = {
  "constraint-descent": {
    kind: "scrolly",
    schema: constraintDescentSpecSchema,
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
