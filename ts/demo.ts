import { Context, APIGatewayEvent } from "aws-lambda";

const handler = async (event: APIGatewayEvent, context: Context) => {
  process.stdout.write(`\x1b[1mI am a demo λ function!\x1b[0m\n`);
  process.stdout.write(`\x1b[32mevent:\x1b[0m\n`);
  process.stdout.write(`${JSON.stringify(event, null, 2)}\n`);
  process.stdout.write(`\x1b[32mcontext:\x1b[0m\n`);
  process.stdout.write(`${JSON.stringify(context, null, 2)}\n`);
  process.stdout.write(`\x1b[32menvvars:\x1b[0m\n`);
  process.stdout.write(`${JSON.stringify(process.env, null, 2)}\n`);
};

export { handler };
