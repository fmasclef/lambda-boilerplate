import { Context, APIGatewayEvent } from "aws-lambda";
import logger from "../utils/logger";

const handler = async (event?: APIGatewayEvent, context?: Context) => {
  // Hello
  logger.info({
    message: "test",
    data: { context: context },
    event: event,
  });

  // then Goodbye!
  return {
    body: "Demo!",
    statusCode: 200,
  };
};

export { handler };
