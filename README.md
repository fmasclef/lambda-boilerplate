# λ boilerplate

This boilerplate is provided as-is. Use it at your own risks. Should you alter
it, please redistribute freely and state my name, this is CC-BY-SA 4.0.

![compliance](https://github.com/fmasclef/lambda-boilerplate/actions/workflows/compliance.yml/badge.svg?event=push)
![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)

# Usage

## The one thing to do first

Update `.node-version` with the targeted Node.js version. I recommend targetting the latest AWS supported one, you still might want something else (oh no, I'm stuck with v14). The build script relies on this file to target the right Node.js version and make this boilerplate more versatile, so don't mess up: set the right version.

## Develop

**Write your code**

Head to `ts/lambda/` folder. Your lambda function should be individual `.ts` files in this folder. Transpile with `npm run build` or in watch mode by running `npm run watch` in a terminal.

Should your lambda function requires additional envvars, set them in a file name by your function in `.env/` folder. For instance, if your lambda function name is _demo_, then add a `.env/demo.json` file.

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
docker run --rm -v "$PWD"/build:/var/task:ro,delegated -p 9000:8080 --env-file .env/demo.env amazon/aws-lambda-nodejs:18 demo.handler
```

In the case above, the function `handler()` of file `dist/demo.js` will be available as **the** lambda function you're actually working on.

A handy convenience npm script is available so you don't have to remember the whole command. Use `FUNCTION=<your_function_name> npm run indocker` and you're done. A container will start, serving your lambda function.

Invoke your function with any event:

```
curl -X POST "http://localhost:9000/2015-03-31/functions/function/invocations" -d @events/demo.json
```

:warning: Remember that your container works just like lambda on AWS. It only serve the latest version of the code you _uploaded_ to it. In our case, it will only serve the js code that was on your `build/` folder when you started it. The only way to refresh is stopping then starting again a container.

## Build & ship

First build you lambda app:

```
npm run build
```

The `build/` folder is now filled with `.js` files. One for each lambda function of your application. If you're happy with that, deploy these files to AWS. For each `.js` file, an automated script will look for a lambda function with the same name, then your code will be published as the latest version of the lambda function. It's gonna be packages in a ZIP file as `index.js`. So the configured AWS handler should stick to default `index.handler`.

In the case no suitable lambda funciton already exists in the targeted AWS account, no code will be deployed. You should rely on the AWS CDK to create lambda functions accordingly.

Ready to try? Go ahead with the `deploy` script:

```
npm run deploy
```

This boilerplate is build with ❤️ in Lille.

![CC-BY-SA 4.0](https://i.creativecommons.org/l/by-sa/4.0/88x31.png)
