import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createClient } from "redis";

const POST_READS_RANKING_KEY = "post:reads:ranking";
const POST_READS_KEY_PREFIX = "post:reads:";

const defaultCsvPath = "temp/top.csv";

const printUsage = () => {
  console.log(`Usage:
  npm run import:top
  npm run import:top -- temp/top.csv
  npm run import:top -- --dry-run
  npm run import:top -- temp/top.csv --dry-run
`);
};

const getPostReadsKey = (postUrl) => `${POST_READS_KEY_PREFIX}${postUrl}`;

const parseArgs = (argv) => {
  const args = argv.slice(2);
  let csvPath = defaultCsvPath;
  let dryRun = false;

  for (const arg of args) {
    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    }
    csvPath = arg;
  }

  return {
    csvPath,
    dryRun,
  };
};

const parseCsvLine = (line, lineNumber) => {
  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(/^"?([^",]+(?:,[^",]+)*)"?\s*,\s*([0-9]+)$/);
  if (!match) {
    throw new Error(`Invalid CSV row at line ${lineNumber}: ${line}`);
  }

  const [, rawPage, rawTotal] = match;
  const page = rawPage.trim().replace(/^"|"$/g, "");
  const total = Number(rawTotal);

  if (!page.startsWith("/")) {
    throw new Error(`Invalid post URL at line ${lineNumber}: ${page}`);
  }
  if (!Number.isFinite(total) || total < 0) {
    throw new Error(`Invalid views total at line ${lineNumber}: ${rawTotal}`);
  }

  return {
    page,
    total,
  };
};

const parseCsv = (source) => {
  const lines = source.split(/\r?\n/);
  if (lines.length === 0) {
    return [];
  }

  const [header, ...rows] = lines;
  if (header.trim() !== "Page,Total") {
    throw new Error(`Unexpected CSV header: ${header}`);
  }

  return rows
    .map((line, index) => parseCsvLine(line, index + 2))
    .filter(Boolean);
};

const loadRowsToRedis = async (rows) => {
  const redisUrl = process.env.REDIS_URL?.trim();
  if (!redisUrl) {
    throw new Error("Missing REDIS_URL environment variable");
  }

  const client = createClient({ url: redisUrl });
  client.on("error", (error) => {
    console.error("Redis client error", error);
  });

  await client.connect();

  try {
    const transaction = client.multi();

    for (const row of rows) {
      transaction.set(getPostReadsKey(row.page), String(row.total));
      transaction.zAdd(POST_READS_RANKING_KEY, {
        score: row.total,
        value: row.page,
      });
    }

    await transaction.exec();
  } finally {
    await client.quit();
  }
};

const main = async () => {
  const { csvPath, dryRun } = parseArgs(process.argv);
  const resolvedPath = path.resolve(process.cwd(), csvPath);
  const source = await readFile(resolvedPath, "utf8");
  const rows = parseCsv(source);

  if (rows.length === 0) {
    console.log(`No rows found in ${resolvedPath}`);
    return;
  }

  if (dryRun) {
    console.log(`Dry run: ${rows.length} rows parsed from ${resolvedPath}`);
    rows.forEach((row) => {
      console.log(
        `${getPostReadsKey(row.page)} = ${row.total}; ${POST_READS_RANKING_KEY} -> (${row.page}, ${row.total})`,
      );
    });
    return;
  }

  await loadRowsToRedis(rows);
  console.log(`Imported ${rows.length} rows from ${resolvedPath} into Redis.`);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
