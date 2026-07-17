import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { scrollyContractSchema } from "../lib/interactive/contracts/scrolly";

const SCHEMA_PATH = path.join(
  process.cwd(),
  "schemas/berme/scrolly.v1.schema.json",
);

const serializeScrollySchema = () => {
  const { $schema, ...schema } = z.toJSONSchema(scrollyContractSchema);

  return `${JSON.stringify(
    {
      $schema,
      $id: "https://berme.io/schemas/berme/scrolly.v1.schema.json",
      title: "berme scrolly contract v1",
      description:
        "The shared authoring contract for every v1 scrolly rendered from a berme fenced block.",
      ...schema,
    },
    null,
    2,
  )}\n`;
};

const main = async () => {
  const generatedSchema = serializeScrollySchema();

  if (process.argv.includes("--check")) {
    const committedSchema = await readFile(SCHEMA_PATH, "utf8").catch(
      () => null,
    );

    if (committedSchema !== generatedSchema) {
      console.error(
        "The committed scrolly JSON Schema is missing or stale. Run npm run generate:interactive-schemas.",
      );
      process.exitCode = 1;
      return;
    }

    console.log("The scrolly JSON Schema matches the runtime contract.");
    return;
  }

  await mkdir(path.dirname(SCHEMA_PATH), { recursive: true });
  await writeFile(SCHEMA_PATH, generatedSchema, "utf8");
  console.log(`Generated ${path.relative(process.cwd(), SCHEMA_PATH)}.`);
};

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
