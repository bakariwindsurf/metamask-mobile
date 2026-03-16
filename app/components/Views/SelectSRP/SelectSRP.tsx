import React from 'react';
import SRPList from '../../UI/SRPList';
import { useNavigation } from '@react-navigation/native';
import Routes from '../../../constants/navigation/Routes';
import { StyleProp, ViewStyle } from 'react-native';

interface SelectSRPProps {
  containerStyle?: unknown;
  showArrowName: boolean;
  }: {?: unknown;
  containerStyle?: StyleProp<ViewStyle>;?: unknown;
  showArrowName?: string;: boolean;
}

const SelectSRP = ({
  containerStyle,
  showArrowName,
}: {
  containerStyle?: StyleProp<ViewStyle>;
  showArrowName?: string;
}: SelectSRPProps) => {
  const navigation = useNavigation();

  const onKeyringSelect = (keyringId: string) => {
    navigation.navigate(Routes.MODAL.ROOT_MODAL_FLOW, {
      screen: Routes.MODAL.SRP_REVEAL_QUIZ,
      keyringId,
    });
  };

  return (
    <SRPList
      onKeyringSelect={onKeyringSelect}
      containerStyle={containerStyle}
      showArrowName={showArrowName}
    />
  );
};

export default SelectSRP;
