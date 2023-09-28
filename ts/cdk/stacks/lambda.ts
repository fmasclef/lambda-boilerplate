/**
 * lambda.ts
 *
 * This CDK stack generates a suitable template to deploy your full app.
 */

import * as cdk from "aws-cdk-lib";
import * as dotenv from "dotenv";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as events from "aws-cdk-lib/aws-events";
import * as fs from "fs-extra";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as targets from "aws-cdk-lib/aws-events-targets";
import AdmZip from "adm-zip";
import { Construct } from "constructs";

import * as packageinfo from "../utils/packageinfo";

interface LambdaStackProps extends cdk.StackProps {}

interface CDKBuilderLambdaFunction {
  architecture: string;
  app: string;
  duration: number;
  events?: {
    bus?: string;
    list: Array<string>;
  };
  functionUrl: boolean;
  memorySize: number;
  name: string;
  path: string;
  s3?: {
    selfStorage?: boolean;
    sharedStorage?: Array<{
      name: string;
      read: boolean;
      write: boolean;
    }>;
  };
  schedules?: Array<{
    name: string;
    cron: string;
  }>;
  vpc?: {
    name: string;
    securityGroups: Array<string>;
  };
}

class LambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: LambdaStackProps) {
    super(scope, id, props);

    if (fs.existsSync(`${__dirname}/../../../build`)) {
      for (const f of fs
        .readdirSync(`${__dirname}/../../../build`)
        .filter((f) => f.endsWith(".js"))) {
        const lambdaname = f.substring(0, f.length - 3);
        const fullPath = `${__dirname}/../../../build/${lambdaname}.js`;

        process.stdout.write(`\n\x1b[1;3;38;5;214mλ\x1b[0m ${lambdaname}\n`);

        if (
          fs.existsSync(
            `${__dirname}/../../../.env/${lambdaname}/platform.json`
          )
        ) {
          this.makeLambdaFunction({
            app: packageinfo.json.name,
            name: lambdaname,
            path: fs.realpathSync(fullPath),
            ...fs.readJSONSync(
              `${__dirname}/../../../.env/${lambdaname}/platform.json`
            ),
          });
        } else {
          process.stdout.write(
            `  ⚠️  platform file missing, won't pack, check README.md\n`
          );
        }
      }
    } else {
      process.stdout.write(`🛑 build first!\n`);
    }
  }

  makeLambdaFunction(params: CDKBuilderLambdaFunction): void {
    /**
     * Execution role
     */

    const lambdaExecutionRole = new iam.Role(
      this,
      `${params.app}-${params.name}-role`,
      {
        assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      }
    );

    lambdaExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        resources: ["*"],
        actions: [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:DescribeLogStreams",
          "logs:PutLogEvents",
        ],
        effect: iam.Effect.ALLOW,
      })
    );

    lambdaExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        resources: ["*"],
        actions: [
          "ssm:DescribeParameters",
          "ssm:GetParametersByPath",
          "ssm:GetParameters",
          "ssm:GetParameter",
        ],
        effect: iam.Effect.ALLOW,
      })
    );

    /**
     * The function itself
     */
    const lambdaFunction: lambda.Function = this.createNodejsFunction(
      lambdaExecutionRole,
      params
    );

    if (params.functionUrl && params.functionUrl == true) {
      new lambda.FunctionUrl(this, `${params.app}-${params.name}-fnUrl`, {
        function: lambdaFunction,
      });
      process.stdout.write(`  🔗 function URL requested\n`);
    }

    /**
     * S3
     */

    if (params.s3) {
      /**
       * selfstorage
       */
      if (params.s3.selfStorage && params.s3.selfStorage == true) {
        process.stdout.write(`  🔧 S3 self storage required\n`);
        const selfstorage = new s3.Bucket(
          this,
          `${params.app}-${params.name}-s3`,
          {
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            bucketName: `${process.env.CDK_DEFAULT_ACCOUNT}-${params.app}-${params.name}`,
            encryption: s3.BucketEncryption.S3_MANAGED,
            intelligentTieringConfigurations: [
              {
                name: `tieringconf-${params.app}-${params.name}`,
                archiveAccessTierTime: cdk.Duration.days(90),
                deepArchiveAccessTierTime: cdk.Duration.days(180),
              },
            ],
            publicReadAccess: false,
            versioned: true,
          }
        );
        selfstorage.grantRead(lambdaExecutionRole, "/*");
        selfstorage.grantReadWrite(lambdaExecutionRole, "/*");
      }
      /**
       * shared storage
       */
      if (params.s3.sharedStorage && params.s3.sharedStorage.length > 0) {
        process.stdout.write(`  🔧 S3 shared storage access required\n`);
        for (const s of params.s3.sharedStorage) {
          const sharedStorage = s3.Bucket.fromBucketName(
            this,
            `${params.app}-${params.name}}-s3--${s.name}`,
            `${process.env.CDK_DEFAULT_ACCOUNT}-${s.name}`
          );
          if (s.read && s.read == true) {
            process.stdout.write(
              `    📦 grant R right on ${process.env.CDK_DEFAULT_ACCOUNT}-${s.name} \n`
            );
            sharedStorage.grantRead(lambdaExecutionRole, "/*");
          }
          if (s.write && s.write == true) {
            process.stdout.write(
              `    📦 grant W right on ${process.env.CDK_DEFAULT_ACCOUNT}-${s.name} \n`
            );
            sharedStorage.grantReadWrite(lambdaExecutionRole, "/*");
          }
        }
      }
    }

    /**
     * Events or schedule
     */

    if (params.events && params.events.list.length > 0) {
      const deadLetterQueue = new sqs.Queue(
        this,
        `${params.app}-${params.name}-dlq`,
        {
          queueName: `${params.app}-${params.name}-dlq`,
        }
      );

      const componentQueue = new sqs.Queue(
        this,
        `${params.app}-${params.name}-q`,
        {
          queueName: `${params.app}-${params.name}`,
          deadLetterQueue: {
            maxReceiveCount: 5,
            queue: deadLetterQueue,
          },
        }
      );

      lambdaFunction.addEventSource(
        new lambdaEventSources.SqsEventSource(componentQueue, {
          batchSize: 1,
          maxConcurrency: 10,
        })
      );

      const eventBus: events.IEventBus = events.EventBus.fromEventBusName(
        this,
        `${params.app}-${params.name}-eventbus`,
        params.events.bus || "default"
      );

      const rule = new events.Rule(this, `${params.app}-${params.name}-rule`, {
        enabled: true,
        eventBus,
        eventPattern: {
          source: [""], // dummy, overridden below
        },
        ruleName: `${params.app}-${params.name}`,
        targets: [new targets.SqsQueue(componentQueue)],
      });
      // This is a workaround to this issue: https://github.com/aws/aws-cdk/issues/6184
      (rule.node.defaultChild as events.CfnRule).eventPattern = {
        source: [{ "anything-but": `${params.app}.${params.name}` }],
        "detail-type": params.events.list,
      };
      process.stdout.write(`  ⌛ lambda function will receive events\n`);
    }

    if (params.schedules && params.schedules.length > 0) {
      for (const s of params.schedules) {
        const eventRule = new events.Rule(
          this,
          `${params.app}-${params.name}-schedule-${s.name}`,
          {
            ruleName: `schedule-${params.app}-${params.name}-${s.name}`,
            schedule: events.Schedule.expression(s.cron),
          }
        );

        eventRule.addTarget(new targets.LambdaFunction(lambdaFunction));
        process.stdout.write(`  ⏰ lambda function scheduled on ${s.cron}\n`);
      }
    }
  }

  /**
   * Create the lambda funciton itself
   * @param role IAM execution role bound to this lambda function
   * @param params Options
   * @returns a lambda function
   */
  createNodejsFunction(
    role: iam.IRole,
    params: CDKBuilderLambdaFunction
  ): lambda.Function {
    let architecture = lambda.Architecture.ARM_64;
    let runtime = lambda.Runtime.NODEJS_18_X;

    switch (params.architecture) {
      default:
        architecture = lambda.Architecture.ARM_64;
    }

    switch (process.versions.node.split(".")[0]) {
      case "14":
        runtime = lambda.Runtime.NODEJS_14_X;
        break;
      case "16":
        runtime = lambda.Runtime.NODEJS_16_X;
        break;
      default:
        runtime = lambda.Runtime.NODEJS_18_X;
    }

    process.stdout.write(`  🔧 architecture: ${params.architecture}\n`);
    process.stdout.write(`  🔧 memory size: ${params.memorySize}MB\n`);
    process.stdout.write(`  🔧 duration: ${params.duration}s\n`);

    let environment = undefined;
    if (
      fs.existsSync(
        `${__dirname}/../../../.env/${params.name}/${
          this.node.tryGetContext("environment") || "docker"
        }.env`
      )
    ) {
      process.stdout.write(`  🔧 environment file found\n`);
      environment = dotenv.parse(
        fs.readFileSync(
          `${__dirname}/../../../.env/${params.name}/${
            this.node.tryGetContext("environment") || "docker"
          }.env`
        )
      );
      for (const k of Object.keys(environment)) {
        process.stdout.write(`    🏷️  ${k}: ${environment[k]}\n`);
      }
    }

    try {
      const zip = new AdmZip();
      const jsData = fs.readFileSync(params.path);
      zip.addFile(`${params.name}.js`, jsData);
      zip.writeZip(`${params.path.substring(0, params.path.length - 3)}.zip`);
      process.stdout.write(`  🔧 js file zipped\n`);
    } catch (e) {
      process.stdout.write(`  🛑 failed to zip js code\n`);
    }

    let funcitonprops: lambda.FunctionProps = {
      architecture,
      code: lambda.Code.fromAsset(
        `${params.path.substring(0, params.path.length - 3)}.zip`
      ),
      environment,
      functionName: params.name,
      handler: `${params.name}.handler`,
      memorySize: params.memorySize,
      runtime,
      timeout: cdk.Duration.seconds(params.duration),
      role: role,
    };

    if (params.vpc) {
      process.stdout.write(
        `  🔧 this lambda requires a VPC named ${params.vpc.name}\n`
      );

      const vpc = ec2.Vpc.fromLookup(this, `${params.app}-${params.name}-vpc`, {
        vpcName: params.vpc.name,
      });

      const securityGroups: Array<ec2.ISecurityGroup> = [];
      for (const sg of params.vpc.securityGroups) {
        securityGroups.push(
          ec2.SecurityGroup.fromLookupByName(
            this,
            `${params.app}-${params.name}-secgrp-${sg}`,
            sg,
            vpc
          )
        );
      }

      funcitonprops = {
        ...funcitonprops,
        securityGroups,
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      };
    }

    return new lambda.Function(
      this,
      `${params.app}-${params.name}`,
      funcitonprops
    );
  }
}

export { LambdaStackProps, LambdaStack };
