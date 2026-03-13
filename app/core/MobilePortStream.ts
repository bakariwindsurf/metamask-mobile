// eslint-disable-next-line import/no-nodejs-modules
import { Buffer } from 'buffer';
import { Duplex } from 'readable-stream';

interface Port {
  addListener(event: string, listener: (...args: unknown[]) => void): void;
  postMessage(message: unknown, url: string): void;
}

// eslint-disable-next-line no-empty-function
const noop = (): void => {};

export default class PortDuplexStream extends Duplex {
  _port: Port;
  _url: string;

  constructor(port: Port, url: string) {
    super({
      objectMode: true,
    });
    this._port = port;
    this._url = url;
    this._port.addListener('message', this._onMessage.bind(this));
    this._port.addListener('disconnect', this._onDisconnect.bind(this));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _onMessage = function (this: PortDuplexStream, msg: any): void {
    if (Buffer.isBuffer(msg)) {
      delete msg._isBuffer;
      const data = new Buffer(msg);
      this.push(data);
    } else {
      this.push(msg);
    }
  };

  _onDisconnect = function (this: PortDuplexStream): void {
    this.destroy && this.destroy();
  };

  _read = noop;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _write = function (this: PortDuplexStream, msg: any, _encoding: string, cb: (error?: Error | null) => void): void {
    try {
      if (Buffer.isBuffer(msg)) {
        const data = msg.toJSON();
        data._isBuffer = true;
        this._port.postMessage(data, this._url);
      } else {
        this._port.postMessage(msg, this._url);
      }
    } catch (err) {
      return cb(new Error('PortDuplexStream - disconnected'));
    }
    cb();
  };
}
