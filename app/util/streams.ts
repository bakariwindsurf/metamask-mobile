import { Transform } from 'stream';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Through = require('through2');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ObjectMultiplex = require('@metamask/object-multiplex');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pump = require('pump');

function jsonParseStream(): Transform {
  return Through.obj(function (
    this: Transform,
    serialized: string,
    _: string,
    cb: () => void,
  ) {
    this.push(JSON.parse(serialized));
    cb();
  });
}

function jsonStringifyStream(): Transform {
  return Through.obj(function (
    this: Transform,
    obj: unknown,
    _: string,
    cb: () => void,
  ) {
    this.push(JSON.stringify(obj));
    cb();
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setupMultiplex(connectionStream: any): any {
  const mux = new ObjectMultiplex();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pump(connectionStream, mux, connectionStream, (err: any) => {
    if (err) {
      console.warn(err);
    }
  });
  return mux;
}

export { jsonParseStream, jsonStringifyStream, setupMultiplex };
