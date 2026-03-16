import React from 'react';
import Text, {
  TextColor,
  TextVariant,
} from '../../../../component-library/components/Texts/Text';
import { View } from 'react-native';

interface PercentageChangeProps {
  value: string;
  variant?: string;
  }: {?: unknown;
  value: number | null | undefined;?: unknown;
  variant?: TextVariant;?: unknown;
}

const PercentageChange = ({
  value,
  variant = TextVariant.BodySMMedium,
}: {
  value: number | null | undefined;
  variant?: TextVariant;
}: PercentageChangeProps) => {
  const percentageColorText =
    value && value >= 0 ? TextColor.Success : TextColor.Error;

  const isValidAmount = (amount: number | null | undefined): boolean =>
    amount !== null && amount !== undefined && !Number.isNaN(amount);

  const formattedValue = isValidAmount(value)
    ? `${(value as number) >= 0 ? '+' : ''}${(value as number).toFixed(2)}%`
    : '';

  return (
    <View>
      <Text color={percentageColorText} variant={variant}>
        {formattedValue}
      </Text>
    </View>
  );
};

export default PercentageChange;
