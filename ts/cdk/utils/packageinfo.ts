/**
 * packageinfo.ts
 *
 * Exports `package.json`
 */

import * as fs from "fs-extra";

const json = fs.readJSONSync(`${__dirname}/../../../package.json`);

export { json };
