#!/usr/bin/env node

/**
 * cdk.ts
 *
 * This file stores the CDK logic to bundle this app. Modify at your own risks.
 */

import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import * as cdk from "aws-cdk-lib";

import * as packageinfo from "../utils/packageinfo";
import { LambdaStack } from "../stacks/lambda";

/**
 * Async wrapper
 */

(async () => {
  /**
   * Environment
   *
   * Determine the current environment by querying SSM. This should work from an
   * aws-vault shell as well as from an EC2 instance as long as its role grants
   * read permission on SSM
   */

  const ssmClient = new SSMClient({ region: "eu-west-1" });
  const ssmCommand = new GetParameterCommand({
    Name: "/environment",
    WithDecryption: true,
  });
  let environment: string = "development";
  try {
    const ssmResponse = await ssmClient.send(ssmCommand);
    if (ssmResponse.Parameter && ssmResponse.Parameter.Value)
      environment = ssmResponse.Parameter.Value;
  } catch (e) {
    environment = "docker";
  }

  process.stdout.write(
    `🔧 environment set to \x1b[1;3;38;5;214m${environment}\x1b[0m\n`
  );
  process.stdout.write(
    `🔧 account is \x1b[1;3;38;5;214m${process.env.CDK_DEFAULT_ACCOUNT}\x1b[0m\n`
  );
  process.stdout.write(
    `🔧 region is \x1b[1;3;38;5;214m${process.env.CDK_DEFAULT_REGION}\x1b[0m\n`
  );

  /**
   * Return if not an account
   */

  if (process.env.CDK_DEFAULT_ACCOUNT == undefined) {
    process.stdout.write(`🛑 no account, can't proceed with CDK\n`);
    return;
  }

  /**
   * Declare the app and its stacks
   */

  const app = new cdk.App({
    context: {
      environment: environment,
    },
  });

  new LambdaStack(app, packageinfo.json.name, {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
  });

  /**
   * End of async wrapper
   */
})();
