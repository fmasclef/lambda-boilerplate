import { Context, APIGatewayEvent } from "aws-lambda";

const handler = async (event:APIGatewayEvent, context:Context) => {
  process.stdout.write(`I am a demo λ function!\n`);
  process.stdout.write(`${JSON.stringify(event, null, 2)}\n`);
}

export {
  handler
};