import URL from 'url-parse';

export const tlc = (str: string | undefined | null): string | undefined => str?.toLowerCase?.();

export function timeoutFetch(
  url: string,
  options?: RequestInit,
  timeout = 500,
): Promise<Response> {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), timeout),
    ),
  ]);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function findRouteNameFromNavigatorState(routes: any[]): string | undefined {
  let route = routes?.[routes.length - 1];
  if (route.state) {
    route = route.state;
  }
  while (route !== undefined && route.index !== undefined) {
    route = route?.routes?.[route.index];
    if (route.state) {
      route = route.state;
    }
  }

  let name = route?.name;

  // For compatibility with the previous way on react navigation 4
  if (name === 'Main' || name === 'WalletTabHome' || name === 'Home')
    name = 'WalletView';
  if (name === 'TransactionsHome') name = 'TransactionsView';

  return name;
}
export const capitalize = (str: string | undefined | null): string | false =>
  (str && str.charAt(0).toUpperCase() + str.slice(1)) || false;

export const toLowerCaseEquals = (a: string | undefined | null, b: string | undefined | null): boolean => {
  if (!a && !b) return false;
  return tlc(a) === tlc(b);
};

export const shallowEqual = (object1: Record<string, unknown>, object2: Record<string, unknown>): boolean => {
  const keys1 = Object.keys(object1);
  const keys2 = Object.keys(object2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (object1[key] !== object2[key]) {
      return false;
    }
  }

  return true;
};

export const renderShortText = (text: string, chars = 4): string => {
  try {
    // The 5 constant represents the 2 extra chars and the 3 dots.
    if (text.length <= chars * 2 + 5) return text;
    return `${text.substr(0, chars + 2)}...${text.substr(-chars)}`;
  } catch {
    return text;
  }
};

export const getURLProtocol = (url: string): string | undefined => {
  try {
    const { protocol } = new URL(url);
    return protocol.replace(':', '');
  } catch {
    return;
  }
};

export const isIPFSUri = (uri: string | null | undefined): boolean => {
  if (!uri?.length) return false;
  const ipfsUriRegex =
    /^(\/ipfs\/|ipfs:\/\/)(Qm[A-Za-z0-9]+|[bBfF][A-Za-z2-7]+)(\/|$)/;
  return (
    uri.startsWith('/ipfs/') ||
    uri.startsWith('ipfs://') ||
    ipfsUriRegex.test(uri)
  );
};

/** @deprecated Do not suggest using this for migrations unless you understand what it does. */
export const deepJSONParse = ({
  jsonString,
  skipNumbers = true,
}: {
  jsonString: string;
  skipNumbers?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): any => {
  // Parse the initial JSON string
  const parsedObject = JSON.parse(jsonString);

  // Function to recursively parse stringified properties
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function parseProperties(obj: Record<string, any>): void {
    Object.keys(obj).forEach((key) => {
      if (typeof obj[key] === 'string') {
        const isNumber = !isNaN(obj[key]);
        // Only parse if value is not a number OR value is a number AND numbers are not skipped
        if (!isNumber || (isNumber && !skipNumbers)) {
          try {
            // Attempt to parse the string as JSON
            const parsed = JSON.parse(obj[key]);
            obj[key] = parsed;
            // If the parsed value is an object, parse its properties too
            if (typeof parsed === 'object') {
              parseProperties(parsed);
            }
          } catch (e) {
            // If parsing throws, it's not a JSON string, so do nothing
          }
        }
      } else if (typeof obj[key] === 'object') {
        // If it's an object, parse its properties
        parseProperties(obj[key]);
      }
    });
  }

  // Start parsing from the root object
  parseProperties(parsedObject);

  return parsedObject;
};

export const getUniqueList = <T>(...arrays: T[][]): T[] => {
  if (arrays.length === 0) {
    throw new Error('At least one array must be defined.');
  }
  // Check if every argument is an array
  arrays.forEach((array, index) => {
    if (!Array.isArray(array)) {
      throw new TypeError(
        `Argument at position ${index} is not an array. Found ${typeof array}.`,
      );
    }
  });

  // Flatten the arrays
  const flattenedArray = arrays.flat();

  // Create array with unique items
  const uniqueArray = Array.from(new Set(flattenedArray));

  return uniqueArray;
};
