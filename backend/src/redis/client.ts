import { RedisClient } from "bun";
import { logger } from "../utils/logger";

export const client = new RedisClient();

client.onconnect = () => {
  logger.info("Connected to the Redis server!");
};

client.onclose = (err) => {
  logger.error("Disconnected from Redis server: ", err);
};

export async function connectRedis() {
  if (!client.connected) await client.connect();
}
