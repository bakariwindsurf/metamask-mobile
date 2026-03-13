/* eslint-disable import/no-commonjs, import/no-nodejs-modules */
import path from 'path';

export default {
  process(_: string, filename: string): { code: string } {
    const assetFilename = JSON.stringify(path.basename(filename));

    return {
      code: `module.exports = ${assetFilename};`,
    };
  },
};
