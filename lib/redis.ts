import { createClient } from "redis";
import { config } from "./config";

type AppRedisClient = ReturnType<typeof createClient>;

let redisClient: AppRedisClient | null = null;
let redisClientPromise: Promise<AppRedisClient | null> | null = null;

const logRedisError = (message: string, error: unknown) => {
  if (process.env.NODE_ENV !== "production") {
    console.error(message, error);
  }
};

const resetRedisClient = (client: AppRedisClient | null) => {
  if (redisClient !== client) {
    return;
  }

  redisClient = null;
  redisClientPromise = null;
};

const destroyRedisClient = (client: AppRedisClient | null) => {
  if (!client) {
    return;
  }

  try {
    client.destroy();
  } catch {
    // Ignore teardown failures during reconnect attempts.
  }
};

const createAppRedisClient = (url: string) => {
  const client = createClient({ url });

  client.on("error", (error) => {
    logRedisError("Redis client error", error);
  });

  client.on("end", () => {
    resetRedisClient(client);
  });

  return client;
};

export const getRedisClient = async () => {
  const url = config.redis.url.trim();
  if (!url) {
    return null;
  }

  if (redisClient?.isReady) {
    return redisClient;
  }

  if (redisClientPromise) {
    return redisClientPromise;
  }

  if (redisClient) {
    destroyRedisClient(redisClient);
    resetRedisClient(redisClient);
  }

  const client = createAppRedisClient(url);
  redisClient = client;
  redisClientPromise = client
    .connect()
    .then(() => {
      redisClientPromise = null;
      return client;
    })
    .catch((error) => {
      logRedisError("Unable to connect to Redis", error);
      destroyRedisClient(client);
      resetRedisClient(client);
      return null;
    });

  return redisClientPromise;
};
