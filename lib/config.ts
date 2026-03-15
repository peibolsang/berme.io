const requireInProduction = (value: string, name: string) => {
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing ${name} environment variable`);
  }
  return value;
};

const truthyEnvValues = new Set(["1", "true", "yes", "on"]);

export const getBooleanEnv = (value: string | undefined) =>
  truthyEnvValues.has(String(value ?? "").trim().toLowerCase());

const normalizePopularityNamespace = (value: string | undefined) => {
  const normalized = value?.trim();
  return normalized || "berme.io";
};

export const config = {
  github: {
    token: process.env.GITHUB_TOKEN ?? "",
    owner: process.env.GITHUB_OWNER ?? "peibolsang",
    repo: process.env.GITHUB_REPO ?? "peibolsang",
  },
  localDev: getBooleanEnv(process.env.LOCAL_DEV),
  popularity: {
    namespace: normalizePopularityNamespace(process.env.POPULARITY_NAMESPACE),
  },
  redis: {
    url: process.env.REDIS_URL ?? "",
  },
  revalidateSeconds: Number(process.env.REVALIDATE_SECONDS ?? "3600"),
};

export const getGithubToken = () =>
  requireInProduction(config.github.token, "GITHUB_TOKEN");
