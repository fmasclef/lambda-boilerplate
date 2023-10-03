/* eslint-disable @typescript-eslint/no-unused-vars */

import * as fs from "fs-extra";
import { handler } from "../lambda/demo";
import { handler as handlerLogger } from "../lambda/demo_logger";

const event = fs.readJSONSync(`${__dirname}/../../.env/demo/event.json`);

beforeAll(() => {
  jest
    .spyOn(process.stdout, "write")
    .mockImplementation(
      (
        str: string | Uint8Array,
        encoding?: BufferEncoding | undefined,
        cb?: ((err?: Error | undefined) => void) | undefined
      ): boolean => {
        return true;
      }
    );
});

describe(`λ: demo`, () => {
  it("should execute", async () => {
    const ret = await handler(event);
    expect(ret.statusCode).toEqual(200);
  });
});

describe(`λ: logger demo`, () => {
  it("run thru all log levels", async () => {
    const ret = await handlerLogger(event);
    expect(ret.statusCode).toEqual(200);
  });
});
