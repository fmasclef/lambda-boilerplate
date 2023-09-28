/**
 * destroy.ts
 *
 * Call the AWS CDK stack destroyer. This should eventually delete stacks.
 */

import { AwsCdkCli } from "@aws-cdk/cli-lib-alpha";
import * as fs from "fs-extra";

import * as packageinfo from "./utils/packageinfo";

const path = `${__dirname}/../../cdk.json`;

if (fs.existsSync(path)) {
  process.stdout.write(
    `💣 \x1b[1;37;31mdestroying\x1b[0m \x1b[1;3;38;5;214m${packageinfo.json.name}\x1b[0m with CDK\n`
  );
  const cli = AwsCdkCli.fromCdkAppDirectory(`${__dirname}/../../`);
  cli.destroy({
    stacks: [packageinfo.json.name],
  });
} else {
  process.stdout.write(`🛑 no cdk.json file found\n`);
}
