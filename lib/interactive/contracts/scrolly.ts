import { z } from "zod";

export const SCROLLY_CONTRACT_VERSION = 1 as const;
export const SCROLLY_COMPONENT_ID_PATTERN =
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const scrollyStepSchema = z.strictObject({
  body: z
    .string()
    .trim()
    .min(1)
    .max(360)
    .describe("The prose that explains this narrative step."),
  label: z
    .string()
    .trim()
    .min(1)
    .max(48)
    .describe("A short label used in the visual and step navigation."),
  title: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .describe("The heading for this narrative step."),
});

export const scrollyContractSchema = z.strictObject({
  component: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(SCROLLY_COMPONENT_ID_PATTERN)
    .describe("The kebab-case ID of the registered scrolly renderer."),
  description: z
    .string()
    .trim()
    .min(1)
    .max(280)
    .describe(
      "A portable summary of the scrolly. Renderers may keep it visually hidden.",
    ),
  eyebrow: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .describe("A short section label displayed above the scrolly title."),
  steps: z
    .array(scrollyStepSchema)
    .min(3)
    .max(8)
    .describe("The ordered narrative states represented by the scrolly."),
  title: z
    .string()
    .trim()
    .min(1)
    .max(140)
    .describe("The main title of the scrolly section."),
  version: z
    .literal(SCROLLY_CONTRACT_VERSION)
    .describe("The shared scrolly contract version."),
});

type ScrollyContract = z.infer<typeof scrollyContractSchema>;

export type ScrollyStep = z.infer<typeof scrollyStepSchema>;

export type ScrollySpec<ComponentId extends string = string> = Omit<
  ScrollyContract,
  "component"
> & {
  component: ComponentId;
};

const scrollySpecSchemaBrand = Symbol("scrolly-spec-schema");

export type ScrollySpecSchema<ComponentId extends string> = z.ZodType<
  ScrollySpec<ComponentId>
> & {
  readonly [scrollySpecSchemaBrand]: true;
};

export const createScrollySpecSchema = <const ComponentId extends string>(
  componentId: ComponentId,
): ScrollySpecSchema<ComponentId> => {
  if (!SCROLLY_COMPONENT_ID_PATTERN.test(componentId)) {
    throw new Error(
      `Scrolly component IDs must be kebab-case. Received “${componentId}”.`,
    );
  }

  return Object.assign(
    scrollyContractSchema.extend({
      component: z.literal(componentId),
    }),
    { [scrollySpecSchemaBrand]: true as const },
  );
};
