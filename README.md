# λ boilerplate

This boilerplate is provided as-is. Use it at your own risks. Should you alter
it, please redistribute freely and state my name ;)

![CC-BY-SA 4.0](https://i.creativecommons.org/l/by-sa/4.0/88x31.png)

Build with ❤️ in Lille.

# Usage

## Develop

**Write your code**

Head to `ts/` folder. Your lambda function should be individual `.ts` files at the root of this folder. Transpile in watch mode by running `npm run watch` in a terminal.

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
docker run --rm -v "$PWD"/build:/var/task:ro,delegated -p 9000:8080 amazon/aws-lambda-nodejs:18 demo.handler
```

In the case above, the function `handler()` of file `dist/demo.js` will be available as **the** lambda function you're actually working on.

Invoke your function with any event:

```
curl -X POST "http://localhost:9000/2015-03-31/functions/function/invocations" -d @events/demo.json
```

## Build & ship

First build you lambda app:

```
npm run build
```

The `build/` folder is now filled with `.js` files. One for each lambda function of your application. If you're happy with that, push these files to AWS:

```
npm run push
```
