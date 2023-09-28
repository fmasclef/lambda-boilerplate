/* eslint-disable @typescript-eslint/no-unused-vars */

import * as fs from "fs-extra";
import { handler } from "../lambda/demo";

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
