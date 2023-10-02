# λ boilerplate

This boilerplate is provided as-is. Use it at your own risks. Should you alter
it, please redistribute freely and state my name, this is CC-BY-SA 4.0.

![compliance](https://github.com/fmasclef/lambda-boilerplate/actions/workflows/compliance.yml/badge.svg?event=push)
[![codecov](https://codecov.io/gh/fmasclef/lambda-boilerplate/branch/main/graph/badge.svg?token=IBJWCN2U1X)](https://codecov.io/gh/fmasclef/lambda-boilerplate)
![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)

# Usage

## The one thing to do first

Update `.node-version` with the targeted Node.js version. I recommend targetting the latest AWS supported one, unless you must use something else (oh no, I'm stuck with v14). The build script relies on this file to target the right Node.js version and make this boilerplate more versatile, so don't mess up: set the right version.

## Develop

**Name your app**

Edit the name field of `package.json`, this will be your _AWS lambda app_ name. Make sure to avoid spaces or other funky characters. Go stick with ASCII chars to avoid trouble.

**Write your code**

Head to `ts/lambda/` folder. Your lambda function should be individual `.ts` files in this folder. Transpile with `npm run build` or in watch mode by running `npm run watch` in a terminal.

Should your lambda function requires additional envvars, set them in a file name by your function in `.env/<function_name>` folder. For instance, if your lambda function name is _demo_, then add files in `.env/demo/` folder. Required configuration files are :

- `docker.env` containing environment variables for debugging purpose
- `<environment>.env` containing environment variables for your targeted AWS environment (see below, synth & deploy)
- `event.json` a test event, you'll use it later
- `platform.json` everything needed to make your production lambda working flawlessly ;)

**Run locally**

You'll need Docker to do that. So first, install Docker Desktop. Then, pull AWS Lambda images:

```
docker image pull amazon/aws-lambda-nodejs:14
docker image pull amazon/aws-lambda-nodejs:16
docker image pull amazon/aws-lambda-nodejs:18
```

Well, you should stick with latest, but who knows? You might have some other funky dependencies on Node.js v14 somewhere. Version is up to you, that does not make any difference at the moment.

Start a container, map `dist/` folder, expose a TCP port and set a function handler:

```
docker run --rm -v "$PWD"/build:/var/task:ro,delegated -p 9000:8080 --env-file .env/demo/docker.env amazon/aws-lambda-nodejs:18 demo.handler
```

In the case above, the function `handler()` of file `dist/demo.js` will be available as **the** lambda function you're actually working on.

A handy convenience npm script is available so you don't have to remember the whole command. Use `FUNCTION=<your_function_name> npm run indocker` and you're done. A container will start, serving your lambda function.

Invoke your function with any event:

```
curl -X POST "http://localhost:9000/2015-03-31/functions/function/invocations" -d @.env/demo/event.json
```

:warning: Remember that your container works just like lambda on AWS. It only serve the latest version of the code you _uploaded_ to it. In our case, it will only serve the js code that was on your `build/` folder when you started it. The only way to refresh is stopping then starting again a container.

## Build & ship

First build you lambda app:

```
npm run lint
npm run build
npm run test
```

The `build/` folder is now filled with `.js` files. One for each lambda function of your application. If you're happy with that, deploy these files to AWS. We'll use the AWS CDK to do that. At first you need a _bootstraped_ AWS account. I recommend you use `aws-vault` to instantiate a sub-shell bound to your AWS account (check the Internet for more about this). Then, bootstrap your environment, you only need to do this once:

```
npm run bootstrap
```

Ready to deploy? Go ahead with the `synth` and `deploy` scripts:

```
npm run synth
npm run deploy
```

You really should try to _synth_ before trying to _deploy_. The first step generates an AWS CloudFormation template. The second step push this tempalte to S3, then executes the template on CloudFormation.

Unhappy with your app? _destroy_ it!

```
npm run destroy
```

Made & maintained with ❤️ in Lille.

![CC-BY-SA 4.0](https://i.creativecommons.org/l/by-sa/4.0/88x31.png)
