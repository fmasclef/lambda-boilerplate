import fs from "fs-extra";
import {
  LambdaClient,
  ListFunctionsCommand,
  UpdateFunctionCodeCommand,
} from "@aws-sdk/client-lambda";
import path from "path";
import zip from "adm-zip";

(async () => {
  process.stdout.write(`\x1b[1mDeployment service for AWS λ\x1b[0m\n`);

  // find suitable region from envvars, this is required to setup the lambda connector
  const region = process.env.AWS_REGION;
  if (!region) {
    process.stderr.write(
      `\x1b[1m\x1b[41m ERROR \x1b[0m \x1b[31mPlease set AWS_REGION envvar first\x1b[0m\n        Using aws-vault is a good option to set required envvars\n`
    );
    process.exit(1);
  }

  // creates a AWS clients
  const lambdaClient = new LambdaClient({
    region,
  });

  // get a list of existing lambda functions
  const functions = [];
  let marker: string | undefined;
  process.stdout.write(`\x1b[34mList existing λ functions `);
  do {
    process.stdout.write(`.`);
    const command = new ListFunctionsCommand({ MaxItems: 10, Marker: marker });
    const response = await lambdaClient.send(command);
    if (response.Functions)
      for (const f of response.Functions) functions.push(f);
    marker = response.NextMarker;
  } while (marker);
  process.stdout.write(`\x1b[0m\n`);

  // make sure all λ exist on targeted environment
  fs.ensureDirSync(`${__dirname}/../build`);
  for (const filename of fs.readdirSync(`${__dirname}/../build`)) {
    const lambdaName = path.parse(filename).name;
    const functionDescriptor = functions.find(
      (f) => f.FunctionName == lambdaName
    );
    if (!functionDescriptor) {
      process.stderr.write(
        `\x1b[1m\x1b[41m ERROR \x1b[0m \x1b[31mFunction ${lambdaName} does not exists! Deployment aborted.\x1b[0m\n`
      );
      process.exit(2);
    }
  }

  // deploy
  for (const filename of fs.readdirSync(`${__dirname}/../build`)) {
    try {
      const lambdaName = path.parse(filename).name;
      process.stdout.write(`\x1b[33mλ: ${lambdaName}\x1b[0m\n`);
      // code to buffer
      process.stdout.write(` | buffering packed code`);
      const code = fs.readFileSync(`${__dirname}/../build/${filename}`);
      process.stdout.write(` ✓\n`);
      // create archive
      process.stdout.write(` | creating archive`);
      const archive = new zip();
      archive.addFile(
        `index.js`,
        code,
        `Packed code for ${lambdaName} function`
      );
      process.stdout.write(` ✓\n`);
      // update function
      process.stdout.write(` | deploying archive to AWS\n`);
      const command = new UpdateFunctionCodeCommand({
        FunctionName: lambdaName,
        ZipFile: archive.toBuffer(),
      });
      const response = await lambdaClient.send(command);
      process.stdout.write(
        `   | request ID:  ${response.$metadata.requestId}\n`
      );
      process.stdout.write(
        `   | status code: ${response.$metadata.httpStatusCode}\n`
      );
      process.stdout.write(`   | code sha256: ${response.CodeSha256}\n`);
    } catch (e) {
      process.stdout.write(` ⨯\n`);
    }
  }
})();
