const requireInProduction = (value: string, name: string) => {
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing ${name} environment variable`);
  }
  return value;
};

const truthyEnvValues = new Set(["1", "true", "yes", "on"]);

export const getBooleanEnv = (value: string | undefined) =>
  truthyEnvValues.has(String(value ?? "").trim().toLowerCase());

const requireConfigured = (value: string, name: string) => {
  if (!value) {
    throw new Error(`Missing ${name} environment variable`);
  }
  return value;
};

const normalizePopularityNamespace = (value: string | undefined) => {
  const normalized = value?.trim();
  return normalized || "berme.io";
};

const normalizeCsvEnv = (value: string | undefined) =>
  String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export const config = {
  github: {
    token: process.env.GITHUB_TOKEN ?? "",
    owner: process.env.GITHUB_OWNER ?? "peibolsang",
    repo: process.env.GITHUB_REPO ?? "peibolsang",
  },
  localDev: getBooleanEnv(process.env.LOCAL_DEV),
  notion: {
    token: process.env.NOTION_API_TOKEN ?? "",
    databaseId:
      process.env.NOTION_DATABASE_ID ?? "d7d86599-3901-4dbd-8997-98f4487e3182",
  },
  popularity: {
    namespace: normalizePopularityNamespace(process.env.POPULARITY_NAMESPACE),
  },
  redis: {
    url: process.env.REDIS_URL ?? "",
  },
  revalidateSeconds: Number(process.env.REVALIDATE_SECONDS ?? "3600"),
  showDrafts: getBooleanEnv(process.env.SHOW_DRAFTS),
  telegram: {
    allowedUserIds: normalizeCsvEnv(process.env.TELEGRAM_ALLOWED_USER_IDS),
    botToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
    webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET ?? "",
  },
};

export const contentVisibilityCacheKey = config.showDrafts
  ? "with-drafts"
  : "published-only";

export const getGithubToken = () =>
  requireInProduction(config.github.token, "GITHUB_TOKEN");

export const getNotionToken = () =>
  requireConfigured(config.notion.token, "NOTION_API_TOKEN");

export const getNotionDatabaseId = () =>
  requireConfigured(config.notion.databaseId, "NOTION_DATABASE_ID");

export const getTelegramAllowedUserIds = () => {
  const ids = config.telegram.allowedUserIds;
  if (!ids.length) {
    throw new Error("Missing TELEGRAM_ALLOWED_USER_IDS environment variable");
  }
  return ids;
};

export const getTelegramBotToken = () =>
  requireConfigured(config.telegram.botToken, "TELEGRAM_BOT_TOKEN");

export const getTelegramWebhookSecret = () =>
  requireConfigured(config.telegram.webhookSecret, "TELEGRAM_WEBHOOK_SECRET");
