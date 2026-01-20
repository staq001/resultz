const pino = require("pino");
const dayjs = require("dayjs");


export const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
  base: {
    pid: false,
  },
  timestamp: () => `"time": "${dayjs().format()}"`,
});
