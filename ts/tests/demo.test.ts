/* eslint-disable @typescript-eslint/no-unused-vars */

import { handler } from "../demo";

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

describe("λ:demo", () => {
  it("should execute", async () => {
    const ret = await handler();
    expect(ret.statusCode).toEqual(200);
  });
});
