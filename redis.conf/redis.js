// |+++++++++++++++++++++++++++++++++++++++|
// | REDIS CONFIGURATION FILE ✔
// |+++++++++++++++++++++++++++++++++++++++|
const Redis = require("ioredis");
process.env.NODE_CONFIG_DIR = "../config";
const config = require("config");
const RedisConnector = () => {
  const HOST = config.get("redis.host");
  const PORT = config.get("redis.port");
  const CREDENTIAL = config.get("redis.credential");
  if (
    !config.has("redis.host") ||
    !config.has("redis.port") ||
    !config.has("redis.credential")
  )
    return "Requires some credential";
  const connector = new Redis({
    host: HOST,
    port: PORT,
    password: CREDENTIAL,
  });
  connector.on("connect", () => {
    console.log("Connected to Redis");
  });
  // Event handler for connection failure
  connector.on("error", (error) => {
    console.error("Failed to connect to Redis:", error);
  });

  // Event handler for disconnection
  connector.on("close", () => {
    console.log("Connection to Redis closed");
  });
  return connector;
};

module.exports = { RedisConnector };
