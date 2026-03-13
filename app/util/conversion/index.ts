import BigNumber from 'bignumber.js';
import BN from 'bnjs4';

import { stripHexPrefix } from 'ethereumjs-util';

type NumericBase = 'hex' | 'dec' | 'BN';
type EthDenomination = 'WEI' | 'GWEI' | 'ETH';

interface ConverterOptions {
  value: string | number | BigNumber;
  fromNumericBase?: NumericBase;
  fromDenomination?: EthDenomination;
  fromCurrency?: string | null;
  toNumericBase?: NumericBase;
  toDenomination?: EthDenomination;
  toCurrency?: string | null;
  numberOfDecimals?: number;
  conversionRate?: number | string | null;
  invertConversionRate?: boolean;
  roundDown?: number;
}

interface ConversionUtilOptions {
  fromCurrency?: string | null;
  toCurrency?: string | null;
  fromNumericBase?: NumericBase;
  toNumericBase?: NumericBase;
  fromDenomination?: EthDenomination;
  toDenomination?: EthDenomination;
  numberOfDecimals?: number;
  conversionRate?: number | string | null;
  invertConversionRate?: boolean;
}

interface AddSubtractOptions extends Partial<ConverterOptions> {
  aBase?: number;
  bBase?: number;
}

interface MultiplyOptions extends Partial<ConverterOptions> {
  multiplicandBase?: number;
  multiplierBase?: number;
}

// Big Number Constants
const BIG_NUMBER_WEI_MULTIPLIER = new BigNumber('1000000000000000000');
const BIG_NUMBER_GWEI_MULTIPLIER = new BigNumber('1000000000');
const BIG_NUMBER_ETH_MULTIPLIER = new BigNumber('1');

// Setter Maps
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toBigNumber: Record<NumericBase, (n: any) => BigNumber> = {
  hex: (n) => new BigNumber(stripHexPrefix(String(n)), 16),
  dec: (n) => new BigNumber(String(n), 10),
  BN: (n) => new BigNumber(n.toString(16), 16),
};
const toNormalizedDenomination: Record<EthDenomination, (bigNumber: BigNumber) => BigNumber> = {
  WEI: (bigNumber) => bigNumber.div(BIG_NUMBER_WEI_MULTIPLIER),
  GWEI: (bigNumber) => bigNumber.div(BIG_NUMBER_GWEI_MULTIPLIER),
  ETH: (bigNumber) => bigNumber.div(BIG_NUMBER_ETH_MULTIPLIER),
};
const toSpecifiedDenomination: Record<EthDenomination, (bigNumber: BigNumber) => BigNumber> = {
  WEI: (bigNumber) =>
    bigNumber.times(BIG_NUMBER_WEI_MULTIPLIER).decimalPlaces(0),
  GWEI: (bigNumber) =>
    bigNumber.times(BIG_NUMBER_GWEI_MULTIPLIER).decimalPlaces(9),
  ETH: (bigNumber) =>
    bigNumber.times(BIG_NUMBER_ETH_MULTIPLIER).decimalPlaces(9),
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const baseChange: Record<NumericBase, (n: any) => any> = {
  hex: (n) => n.toString(16),
  dec: (n) => new BigNumber(n).toString(10),
  BN: (n) => new BN(n.toString(16)),
};

// Utility function for checking base types
const isValidBase = (base: number): boolean => Number.isInteger(base) && base > 1;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const converter = ({
  value,
  fromNumericBase,
  fromDenomination,
  fromCurrency,
  toNumericBase,
  toDenomination,
  toCurrency,
  numberOfDecimals,
  conversionRate,
  invertConversionRate,
  roundDown,
}: ConverterOptions): any => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let convertedValue: any = fromNumericBase
    ? toBigNumber[fromNumericBase](value)
    : value;

  if (fromDenomination) {
    convertedValue = toNormalizedDenomination[fromDenomination](convertedValue);
  }

  if (fromCurrency !== toCurrency) {
    if (conversionRate === null || conversionRate === undefined) {
      throw new Error(
        `Converting from ${fromCurrency} to ${toCurrency} requires a conversionRate, but one was not provided`,
      );
    }
    let rate: BigNumber = toBigNumber.dec(conversionRate);
    if (invertConversionRate) {
      rate = new BigNumber(1.0).div(conversionRate);
    }
    convertedValue = convertedValue.times(rate);
  }

  if (toDenomination) {
    convertedValue = toSpecifiedDenomination[toDenomination](convertedValue);
  }

  if (numberOfDecimals) {
    convertedValue = convertedValue.decimalPlaces(
      numberOfDecimals,
      BigNumber.ROUND_HALF_DOWN,
    );
  }

  if (roundDown) {
    convertedValue = convertedValue.decimalPlaces(
      roundDown,
      BigNumber.ROUND_DOWN,
    );
  }

  if (toNumericBase) {
    convertedValue = baseChange[toNumericBase](convertedValue);
  }
  return convertedValue;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const conversionUtil = (
  value: string | number | BigNumber | undefined,
  {
    fromCurrency = null,
    toCurrency = fromCurrency,
    fromNumericBase,
    toNumericBase,
    fromDenomination,
    toDenomination,
    numberOfDecimals,
    conversionRate,
    invertConversionRate,
  }: ConversionUtilOptions,
): any => {
  if (fromCurrency !== toCurrency && !conversionRate) {
    return 0;
  }
  return converter({
    fromCurrency,
    toCurrency,
    fromNumericBase,
    toNumericBase,
    fromDenomination,
    toDenomination,
    numberOfDecimals,
    conversionRate,
    invertConversionRate,
    value: value || '0',
  });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getBigNumber = (value: any, base: number): BigNumber => {
  if (!isValidBase(base)) {
    throw new Error('Must specify valid base');
  }

  // We don't include 'number' here, because BigNumber will throw if passed
  // a number primitive it considers unsafe.
  if (typeof value === 'string' || value instanceof BigNumber) {
    return new BigNumber(value, base);
  }

  return new BigNumber(String(value), base);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const addCurrencies = (a: any, b: any, options: AddSubtractOptions = {}): any => {
  const { aBase, bBase, ...conversionOptions } = options;

  if (!isValidBase(aBase) || !isValidBase(bBase)) {
    throw new Error('Must specify valid aBase and bBase');
  }
  const value = getBigNumber(a, aBase).plus(getBigNumber(b, bBase));

  return converter({
    value,
    ...conversionOptions,
  });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const subtractCurrencies = (a: any, b: any, options: AddSubtractOptions = {}): any => {
  const { aBase, bBase, ...conversionOptions } = options;

  if (!isValidBase(aBase) || !isValidBase(bBase)) {
    throw new Error('Must specify valid aBase and bBase');
  }

  const value = getBigNumber(a, aBase).minus(getBigNumber(b, bBase));

  return converter({
    value,
    ...conversionOptions,
  });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const multiplyCurrencies = (a: any, b: any, options: MultiplyOptions = {}): any => {
  const { multiplicandBase, multiplierBase, ...conversionOptions } = options;

  if (!isValidBase(multiplicandBase) || !isValidBase(multiplierBase)) {
    throw new Error('Must specify valid multiplicandBase and multiplierBase');
  }

  const value = getBigNumber(a, multiplicandBase).times(
    getBigNumber(b, multiplierBase),
  );

  return converter({
    value,
    ...conversionOptions,
  });
};

const conversionGreaterThan = ({ ...firstProps }: ConverterOptions, { ...secondProps }: ConverterOptions): boolean => {
  const firstValue = converter({ ...firstProps });
  const secondValue = converter({ ...secondProps });

  return firstValue.gt(secondValue);
};

const conversionLessThan = ({ ...firstProps }: ConverterOptions, { ...secondProps }: ConverterOptions): boolean => {
  const firstValue = converter({ ...firstProps });
  const secondValue = converter({ ...secondProps });

  return firstValue.lt(secondValue);
};

const conversionMax = ({ ...firstProps }: ConverterOptions, { ...secondProps }: ConverterOptions): string | number | BigNumber => {
  const firstIsGreater = conversionGreaterThan(
    { ...firstProps },
    { ...secondProps },
  );

  return firstIsGreater ? firstProps.value : secondProps.value;
};

const conversionGTE = ({ ...firstProps }: ConverterOptions, { ...secondProps }: ConverterOptions): boolean => {
  const firstValue = converter({ ...firstProps });
  const secondValue = converter({ ...secondProps });
  return firstValue.greaterThanOrEqualTo(secondValue);
};

const conversionLTE = ({ ...firstProps }: ConverterOptions, { ...secondProps }: ConverterOptions): boolean => {
  const firstValue = converter({ ...firstProps });
  const secondValue = converter({ ...secondProps });
  return firstValue.lessThanOrEqualTo(secondValue);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toNegative = (n: any, options: MultiplyOptions = {}): any => multiplyCurrencies(n, -1, options);

export {
  conversionUtil,
  addCurrencies,
  multiplyCurrencies,
  conversionGreaterThan,
  conversionLessThan,
  conversionGTE,
  conversionLTE,
  conversionMax,
  toNegative,
  subtractCurrencies,
};
