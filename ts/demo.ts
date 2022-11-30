import { Context, APIGatewayEvent } from "aws-lambda";

const handler = async (event:APIGatewayEvent, context:Context) => {
  process.stdout.write(`I am a demo λ function!\n`);
  process.stdout.write(`event:\n`);
  process.stdout.write(`${JSON.stringify(event, null, 2)}\n`);
  process.stdout.write(`context:\n`);
  process.stdout.write(`${JSON.stringify(context, null, 2)}\n`);
  process.stdout.write(`envvars:\n`);
  process.stdout.write(`${JSON.stringify(process.env, null, 2)}\n`);
}

export {
  handler
};