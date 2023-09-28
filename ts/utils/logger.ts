/**
 * logger.ts
 *
 * Winston wrapper
 */

import winston, { LogEntry } from "winston";

const log = async (level: string, record: LambdaUtils.LogEntry) => {
  let entry: LogEntry = {
    level: level,
    message: record.message,
    platform: process.env.AWS_LAMBDA_FUNCTION_NAME || "lambda",
    component: record.component || "handler",
  };
  if (record.data) {
    entry = {
      ...entry,
      data: record.data,
    };
  }
  if (record.event) {
    entry = {
      ...entry,
      event: record.event,
    };
  }
  winston.configure({
    level: process.env.LOG_LEVEL || "info",
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [new winston.transports.Console()],
  });
  winston.log(entry);
};

const error = async (record: LambdaUtils.LogEntry): Promise<void> => {
  log("error", record);
};
const warn = async (record: LambdaUtils.LogEntry): Promise<void> => {
  log("warn", record);
};
const info = async (record: LambdaUtils.LogEntry): Promise<void> => {
  log("info", record);
};
const http = async (record: LambdaUtils.LogEntry): Promise<void> => {
  log("http", record);
};
const verbose = async (record: LambdaUtils.LogEntry): Promise<void> => {
  log("verbose", record);
};
const debug = async (record: LambdaUtils.LogEntry): Promise<void> => {
  log("debug", record);
};
const silly = async (record: LambdaUtils.LogEntry): Promise<void> => {
  log("silly", record);
};

export default {
  error,
  warn,
  info,
  http,
  verbose,
  debug,
  silly,
};
