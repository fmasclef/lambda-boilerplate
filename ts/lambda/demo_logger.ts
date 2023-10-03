import { Context, APIGatewayEvent } from "aws-lambda";
import logger from "../utils/logger";

const handler = async (event?: APIGatewayEvent, context?: Context) => {
  // verbose
  logger.silly({
    message: "silly",
  });

  // verbose
  logger.verbose({
    message: "verbose",
  });

  // debug
  logger.debug({
    message: "debug",
  });

  // http
  logger.http({
    message: "http",
  });

  // info
  logger.info({
    message: "info",
    data: { context: context },
    event: event,
  });

  // warn
  logger.warn({
    message: "warn",
  });

  // error
  logger.error({
    message: "error",
  });

  // then Goodbye!
  return {
    body: "We went thru all log levels!",
    statusCode: 200,
  };
};

export { handler };
