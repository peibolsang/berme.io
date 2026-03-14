import { createClient } from "redis";
import { config } from "./config";

type AppRedisClient = ReturnType<typeof createClient>;

let redisClientPromise: Promise<AppRedisClient | null> | null = null;

export const getRedisClient = async () => {
  if (redisClientPromise) {
    return redisClientPromise;
  }

  const url = config.redis.url.trim();
  if (!url) {
    redisClientPromise = Promise.resolve(null);
    return redisClientPromise;
  }

  const client = createClient({
    url,
  });

  client.on("error", (error) => {
    if (process.env.NODE_ENV !== "production") {
      console.error("Redis client error", error);
    }
  });

  redisClientPromise = client
    .connect()
    .then(() => client)
    .catch((error) => {
      if (process.env.NODE_ENV !== "production") {
        console.error("Unable to connect to Redis", error);
      }
      redisClientPromise = Promise.resolve(null);
      return null;
    });
  return redisClientPromise;
};
