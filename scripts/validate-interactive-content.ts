import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { interactiveDefinitionRegistry, parseInteractiveSpec } from "../lib/interactive/registry";

const CONTENT_ROOT = path.join(process.cwd(), "content");
const INTERACTIVE_FENCE = /^```berme[^\S\r\n]*\r?\n([\s\S]*?)^```[^\S\r\n]*$/gm;
const RENDERER_SUFFIX = {
  chart: "Chart",
  explorable: "Explorable",
  scrolly: "Scrolly",
} as const;

const toPascalCase = (value: string) =>
  value
    .split("-")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join("");

const fileExists = async (filePath: string) => {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
};

const validateComponentStructure = async () => {
  const errors: string[] = [];

  for (const [componentId, definition] of Object.entries(
    interactiveDefinitionRegistry,
  )) {
    const componentName = `${toPascalCase(componentId)}${RENDERER_SUFFIX[definition.kind]}`;
    const expectedPaths = [
      `lib/interactive/specs/${componentId}.ts`,
      `components/interactive/blocks/${componentId}/${componentName}.tsx`,
    ];

    for (const expectedPath of expectedPaths) {
      if (!(await fileExists(path.join(process.cwd(), expectedPath)))) {
        errors.push(
          `Registered ${definition.kind} “${componentId}” is missing ${expectedPath}.`,
        );
      }
    }
  }

  return errors;
};

const readStdin = async () => {
  let source = "";
  process.stdin.setEncoding("utf8");

  for await (const chunk of process.stdin) {
    source += chunk;
  }

  return source;
};

const validateMarkdown = (
  markdown: string,
  sourceLabel: string,
  errors: string[],
) => {
  let blockCount = 0;
  let sourceBlockIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = INTERACTIVE_FENCE.exec(markdown)) !== null) {
    blockCount += 1;
    sourceBlockIndex += 1;
    const result = parseInteractiveSpec(match[1]);

    if (!result.ok) {
      errors.push(
        `${sourceLabel} (berme block ${sourceBlockIndex}): ${result.error}`,
      );
    }
  }

  INTERACTIVE_FENCE.lastIndex = 0;
  return blockCount;
};

const findMarkdownFiles = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return findMarkdownFiles(entryPath);
      }

      return entry.isFile() && entry.name.endsWith(".md") ? [entryPath] : [];
    }),
  );

  return files.flat();
};

const main = async () => {
  const stdinMode = process.argv.includes("--stdin");
  const errors = await validateComponentStructure();
  let blockCount = 0;
  let sourceCount = 0;

  if (stdinMode) {
    const markdown = await readStdin();
    sourceCount = 1;
    blockCount = validateMarkdown(markdown, "stdin", errors);

    if (blockCount === 0) {
      errors.push("stdin does not contain a berme fenced block.");
    }
  } else {
    const markdownFiles = await findMarkdownFiles(CONTENT_ROOT);
    sourceCount = markdownFiles.length;

    for (const filePath of markdownFiles) {
      const markdown = await readFile(filePath, "utf8");
      const relativePath = path.relative(process.cwd(), filePath);
      blockCount += validateMarkdown(markdown, relativePath, errors);
    }
  }

  if (errors.length > 0) {
    console.error("Interactive content validation failed:\n");
    errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
    return;
  }

  const registeredComponents = Object.keys(interactiveDefinitionRegistry).join(", ");
  console.log(
    `Validated ${blockCount} interactive block${blockCount === 1 ? "" : "s"} across ${sourceCount} Markdown source${sourceCount === 1 ? "" : "s"}.`,
  );
  console.log(`Registered components: ${registeredComponents}`);
};

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
