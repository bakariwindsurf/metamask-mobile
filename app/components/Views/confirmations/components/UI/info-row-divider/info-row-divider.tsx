import React from 'react';
import { View } from 'react-native';
import { useStyles } from '../../../../../../component-library/hooks';
import styleSheet, { InfoRowDividerVariant } from './info-row-divider.styles';

interface InfoRowDividerProps {
  variant?: string;
  }: {?: unknown;
  variant?: InfoRowDividerVariant;?: unknown;
}

const InfoRowDivider = ({
  variant = InfoRowDividerVariant.Default,
}: {
  variant?: InfoRowDividerVariant;
}: InfoRowDividerProps) => {
  const { styles } = useStyles(styleSheet, { variant });

  return <View style={styles.infoRowDivider} />;
};

export default InfoRowDivider;
