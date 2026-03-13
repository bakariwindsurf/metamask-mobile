/* eslint-disable no-bitwise */

// helper functions for PNG generation - optimized for batch operations
function write(buffer: Uint8Array, offs: number, ...args: string[]): void {
  let offset = offs;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const len = arg.length;
    for (let j = 0; j < len; j++) {
      buffer[offset++] = arg.charCodeAt(j);
    }
  }
}

function byte2(w: number): string {
  return String.fromCharCode((w >> 8) & 255, w & 255);
}

function byte4(w: number): string {
  return String.fromCharCode(
    (w >> 24) & 255,
    (w >> 16) & 255,
    (w >> 8) & 255,
    w & 255,
  );
}

function byte2lsb(w: number): string {
  return String.fromCharCode(w & 255, (w >> 8) & 255);
}

// Create crc32 lookup table once when module loads
const _crc32 = new Uint32Array(256);
(function initCrc32Table() {
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      if (c & 1) {
        c = -306674912 ^ ((c >> 1) & 0x7fffffff);
      } else {
        c = (c >> 1) & 0x7fffffff;
      }
    }
    _crc32[i] = c >>> 0; // Ensure unsigned 32-bit integer
  }
})();

// Cache for HSL->RGB conversions to avoid redundant calculations
const hslToRgbCache = new Map<string, Uint8Array>();
const MAX_HSL_CACHE_SIZE = 1000; // Prevent memory leaks

// Optimized function to convert Uint8Array to string in chunks
function uint8ArrayToString(uint8Array: Uint8Array): string {
  const chunkSize = 8192; // Process in 8KB chunks to avoid stack overflow
  let result = '';
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, i + chunkSize);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result += String.fromCharCode.apply(null, chunk as any);
  }
  return result;
}

class PNG {
  width: number;
  height: number;
  depth: number;
  pix_size: number;
  data_size: number;
  ihdr_offs: number;
  ihdr_size: number;
  plte_offs: number;
  plte_size: number;
  trns_offs: number;
  trns_size: number;
  idat_offs: number;
  idat_size: number;
  iend_offs: number;
  iend_size: number;
  buffer_size: number;
  buffer: Uint8Array;
  palette: Record<number, number>;
  pindex: number;

  constructor(width: number, height: number, depth: number) {
    this.width = width;
    this.height = height;
    this.depth = depth;

    // pixel data and row filter identifier size
    this.pix_size = height * (width + 1);

    // deflate header, pix_size, block headers, adler32 checksum
    this.data_size =
      2 +
      this.pix_size +
      5 * Math.floor((0xfffe + this.pix_size) / 0xffff) +
      4;

    // offsets and sizes of Png chunks
    this.ihdr_offs = 0; // IHDR offset and size
    this.ihdr_size = 4 + 4 + 13 + 4;
    this.plte_offs = this.ihdr_offs + this.ihdr_size; // PLTE offset and size
    this.plte_size = 4 + 4 + 3 * depth + 4;
    this.trns_offs = this.plte_offs + this.plte_size; // tRNS offset and size
    this.trns_size = 4 + 4 + depth + 4;
    this.idat_offs = this.trns_offs + this.trns_size; // IDAT offset and size
    this.idat_size = 4 + 4 + this.data_size + 4;
    this.iend_offs = this.idat_offs + this.idat_size; // IEND offset and size
    this.iend_size = 4 + 4 + 4;
    this.buffer_size = this.iend_offs + this.iend_size; // total PNG size

    this.buffer = new Uint8Array(this.buffer_size);
    this.palette = {};
    this.pindex = 0;

    // buffer is already zero-initialized (Uint8Array)

    // initialize non-zero elements
    write(
      this.buffer,
      this.ihdr_offs,
      byte4(this.ihdr_size - 12),
      'IHDR',
      byte4(width),
      byte4(height),
      '\x08\x03',
    );
    write(this.buffer, this.plte_offs, byte4(this.plte_size - 12), 'PLTE');
    write(this.buffer, this.trns_offs, byte4(this.trns_size - 12), 'tRNS');
    write(this.buffer, this.idat_offs, byte4(this.idat_size - 12), 'IDAT');
    write(this.buffer, this.iend_offs, byte4(this.iend_size - 12), 'IEND');

    // initialize deflate header
    let header = ((8 + (7 << 4)) << 8) | (3 << 6);
    header += 31 - (header % 31);

    write(this.buffer, this.idat_offs + 8, byte2(header));

    // initialize deflate block headers
    for (let i = 0; (i << 16) - 1 < this.pix_size; i++) {
      let size: number;
      let bits: string;
      if (i + 0xffff < this.pix_size) {
        size = 0xffff;
        bits = '\x00';
      } else {
        size = this.pix_size - (i << 16) - i;
        bits = '\x01';
      }
      write(
        this.buffer,
        this.idat_offs + 8 + 2 + (i << 16) + (i << 2),
        bits,
        byte2lsb(size),
        byte2lsb(~size),
      );
    }
  }

  // compute the index into a png for a given pixel
  index(x: number, y: number): number {
    const i = y * (this.width + 1) + x + 1;
    const j = this.idat_offs + 8 + 2 + 5 * Math.floor(i / 0xffff + 1) + i;
    return j;
  }

  // convert a color and build up the palette
  color(red: number, green: number, blue: number, alpha?: number): number {
    const a = alpha !== undefined && alpha >= 0 ? alpha : 255;
    const colorVal = (((((a << 8) | red) << 8) | green) << 8) | blue;

    if (typeof this.palette[colorVal] === 'undefined') {
      if (this.pindex === this.depth) return 0;

      const ndx = this.plte_offs + 8 + 3 * this.pindex;

      this.buffer[ndx + 0] = red;
      this.buffer[ndx + 1] = green;
      this.buffer[ndx + 2] = blue;
      this.buffer[this.trns_offs + 8 + this.pindex] = a;

      this.palette[colorVal] = this.pindex++;
    }
    return this.palette[colorVal];
  }

  // output a PNG string, Base64 encoded
  getBase64(): string {
    const s = this.getDump();
    return btoa(s);
  }

  // output a PNG string
  getDump(): string {
    // compute adler32 of output pixels + row filter bytes
    const BASE = 65521; /* largest prime smaller than 65536 */
    const NMAX = 5552; /* NMAX is the largest n such that 255n(n+1)/2 + (n+1)(BASE-1) <= 2^32-1 */
    let s1 = 1;
    let s2 = 0;
    let n = NMAX;

    for (let y = 0; y < this.height; y++) {
      for (let x = -1; x < this.width; x++) {
        s1 += this.buffer[this.index(x, y)];
        s2 += s1;
        if ((n -= 1) === 0) {
          s1 %= BASE;
          s2 %= BASE;
          n = NMAX;
        }
      }
    }
    s1 %= BASE;
    s2 %= BASE;
    write(
      this.buffer,
      this.idat_offs + this.idat_size - 8,
      byte4((s2 << 16) | s1),
    );

    // compute crc32 of the PNG chunks
    const crc32 = (png: Uint8Array, offs: number, size: number): void => {
      let crc = -1;
      for (let i = 4; i < size - 4; i += 1) {
        crc =
          _crc32[(crc ^ png[offs + i]) & 0xff] ^ ((crc >> 8) & 0x00ffffff);
      }
      write(png, offs + size - 4, byte4(crc ^ -1));
    };

    crc32(this.buffer, this.ihdr_offs, this.ihdr_size);
    crc32(this.buffer, this.plte_offs, this.plte_size);
    crc32(this.buffer, this.trns_offs, this.trns_size);
    crc32(this.buffer, this.idat_offs, this.idat_size);
    crc32(this.buffer, this.iend_offs, this.iend_size);

    // convert PNG to string
    return '\x89PNG\r\n\x1A\n' + uint8ArrayToString(this.buffer);
  }

  fillRect(x: number, y: number, w: number, h: number, color: number): void {
    for (let i = 0; i < w; i++) {
      for (let j = 0; j < h; j++) {
        this.buffer[this.index(x + i, y + j)] = color;
      }
    }
  }
}

function hue2rgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

function hsl2rgb(
  h: number,
  s: number,
  l: number,
): [number, number, number, number] {
  // Create cache key
  const key = `${h.toFixed(3)},${s.toFixed(3)},${l.toFixed(3)}`;

  const cached = hslToRgbCache.get(key);
  if (cached) {
    return [cached[0], cached[1], cached[2], cached[3]];
  }

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q2 = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p2 = 2 * l - q2;
    r = hue2rgb(p2, q2, h + 1 / 3);
    g = hue2rgb(p2, q2, h);
    b = hue2rgb(p2, q2, h - 1 / 3);
  }

  const result = new Uint8Array([
    Math.round(r * 255),
    Math.round(g * 255),
    Math.round(b * 255),
    255,
  ]);

  // Implement simple LRU: remove oldest if cache is full
  if (hslToRgbCache.size >= MAX_HSL_CACHE_SIZE) {
    const firstKey = hslToRgbCache.keys().next().value;
    if (firstKey !== undefined) {
      hslToRgbCache.delete(firstKey);
    }
  }

  hslToRgbCache.set(key, result);
  return [result[0], result[1], result[2], result[3]];
}

// The random number is a js implementation of the Xorshift PRNG
const randseed = new Uint32Array(4); // Xorshift: [x, y, z, w] 32 bit values

function seedrand(seed: string): void {
  for (let i = 0; i < randseed.length; i++) {
    randseed[i] = 0;
  }
  for (let i = 0; i < seed.length; i++) {
    randseed[i % 4] =
      (randseed[i % 4] << 5) - randseed[i % 4] + seed.charCodeAt(i);
  }
}

function rand(): number {
  // based on Java's String.hashCode(), expanded to 4 32bit values
  const t = randseed[0] ^ (randseed[0] << 11);

  randseed[0] = randseed[1];
  randseed[1] = randseed[2];
  randseed[2] = randseed[3];
  randseed[3] = randseed[3] ^ (randseed[3] >> 19) ^ t ^ (t >> 8);

  return (randseed[3] >>> 0) / ((1 << 31) >>> 0);
}

function createColor(): [number, number, number] {
  //saturation is the whole color spectrum
  const h = Math.floor(rand() * 360);
  //saturation goes from 40 to 100, it avoids greyish colors
  const s = rand() * 60 + 40;
  //lightness can be anything from 0 to 100, but probabilities are a bell curve around 50%
  const l = (rand() + rand() + rand() + rand()) * 25;

  return [h / 360, s / 100, l / 100];
}


function createImageData(size: number): Uint8Array {
  const width = size; // Only support square icons for now
  const height = size;

  const dataWidth = Math.ceil(width / 2);
  const mirrorWidth = width - dataWidth;

  const data = new Uint8Array(size * size);
  let dataIndex = 0;

  for (let y = 0; y < height; y++) {
    const row = new Uint8Array(width);
    for (let x = 0; x < dataWidth; x++) {
      // this makes foreground and background color to have a 43% (1/2.3) probability
      // spot color has 13% chance
      row[x] = Math.floor(rand() * 2.3);
    }
    // Mirror the row
    for (let x = 0; x < mirrorWidth; x++) {
      row[dataWidth + x] = row[mirrorWidth - 1 - x];
    }

    // Copy row to data
    for (let i = 0; i < row.length; i++) {
      data[dataIndex++] = row[i];
    }
  }

  return data;
}

interface BlockiesOpts {
  seed: string;
  size?: number;
  scale?: number;
  color?: [number, number, number];
  bgcolor?: [number, number, number];
  spotcolor?: [number, number, number];
}

interface ResolvedBlockiesOpts {
  seed: string;
  size: number;
  scale: number;
  color: [number, number, number];
  bgcolor: [number, number, number];
  spotcolor: [number, number, number];
}

function buildOpts(opts: BlockiesOpts): ResolvedBlockiesOpts {
  if (!opts.seed) {
    throw new Error('No seed provided');
  }

  seedrand(opts.seed);

  return Object.assign(
    {
      size: 8,
      scale: 16,
      color: createColor(),
      bgcolor: createColor(),
      spotcolor: createColor(),
    },
    opts,
  );
}

/**
 * Utility class with the single responsibility
 * of caching Blockies Data URIs
 */
class BlockiesCache {
  static cache: Record<string, string> = {};
}

export function toDataUrl(address: string): string {
  const cache = BlockiesCache.cache[address];
  if (address && cache) {
    return cache;
  }

  const opts = buildOpts({ seed: address.toLowerCase() });

  const imageData = createImageData(opts.size);
  const width = opts.size; // We know it's square, so no need for Math.sqrt

  const p = new PNG(opts.size * opts.scale, opts.size * opts.scale, 3);
  const bgcolor = p.color(...hsl2rgb(...opts.bgcolor));
  const color = p.color(...hsl2rgb(...opts.color));
  const spotcolor = p.color(...hsl2rgb(...opts.spotcolor));

  for (let i = 0; i < imageData.length; i++) {
    const row = Math.floor(i / width);
    const col = i % width;
    // if data is 0, leave the background
    if (imageData[i]) {
      // if data is 2, choose spot color, if 1 choose foreground
      const pngColor = imageData[i] === 1 ? color : spotcolor;
      p.fillRect(
        col * opts.scale,
        row * opts.scale,
        opts.scale,
        opts.scale,
        pngColor,
      );
    }
  }
  const ret = `data:image/png;base64,${p.getBase64()}`;
  BlockiesCache.cache[address] = ret;
  return ret;
}
