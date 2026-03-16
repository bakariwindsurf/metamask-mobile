///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { InstallSnapFlowProps } from '../../InstallSnapApproval.types';
import styleSheet from '../../InstallSnapApproval.styles';
import { strings } from '../../../../../../locales/i18n';
import SheetHeader from '../../../../../component-library/components/Sheet/SheetHeader';
import Text, {
  TextVariant,
} from '../../../../../component-library/components/Texts/Text';
import TagUrl from '../../../../../component-library/components/Tags/TagUrl';
import { getUrlObj, prefixUrlWithProtocol } from '../../../../../util/browser';
import { IconName } from '../../../../../component-library/components/Icons/Icon';
import {
  ButtonSize,
  ButtonVariants,
} from '../../../../../component-library/components/Buttons/Button';
import BottomSheetFooter, {
  ButtonsAlignment,
} from '../../../../../component-library/components/BottomSheets/BottomSheetFooter';
import { ButtonProps } from '../../../../../component-library/components/Buttons/Button/Button.types';
import { useStyles } from '../../../../hooks/useStyles';
import {
  SNAP_INSTALL_CANCEL,
  SNAP_INSTALL_CONNECT,
  SNAP_INSTALL_CONNECTION_REQUEST,
} from './InstallSnapConnectionRequest.constants';
import { useFavicon } from '../../../../hooks/useFavicon';
import { SnapAvatar } from '../../../../Snaps/SnapAvatar/SnapAvatar';

interface InstallSnapConnectionRequestProps {
  approvalRequest?: unknown;
  snapId?: unknown;
  snapName?: unknown;
  onConfirm: (...args: unknown[]) => void;
  onCancel: (...args: unknown[]) => void;
  }: Pick<?: unknown;
  InstallSnapFlowProps?: unknown;
  'approvalRequest' | 'onConfirm' | 'onCancel' | 'snapId' | 'snapName'?: unknown;
  >)?: unknown;
  const { styles }?: unknown;
  {});?: unknown;
  const origin?: unknown;
  ()?: unknown;
  [approvalRequest.origin]?: unknown;
  );?: unknown;
  const favicon?: unknown;
  const urlWithProtocol?: unknown;
  const secureIcon?: unknown;
  ()?: unknown;
  getUrlObj(origin).protocol?: unknown;
  ? IconName.Lock?: unknown;
  : IconName.LockSlash?: unknown;
  [origin]?: unknown;
  );?: unknown;
  const cancelButtonProps: ButtonProps?: unknown;
  variant: ButtonVariants.Secondary?: unknown;
  label: strings('accountApproval.cancel')?: unknown;
  size: ButtonSize.Lg?: unknown;
  onPress: onCancel: (...args: unknown[]) => void;
  testID: SNAP_INSTALL_CANCEL?: unknown;
  };?: unknown;
  const connectButtonProps: ButtonProps?: unknown;
  variant: ButtonVariants.Primary?: unknown;
  label: strings('accountApproval.connect')?: unknown;
  size: ButtonSize.Lg?: unknown;
  onPress: onConfirm: (...args: unknown[]) => void;
  testID: SNAP_INSTALL_CONNECT?: unknown;
  };?: unknown;
  return (?: unknown;
  <View testID?: unknown;
  <View style?: unknown;
  <TagUrl?: unknown;
  imageSource?: unknown;
  label?: string;
  iconName?: unknown;
  />?: unknown;
  <SnapAvatar?: unknown;
  snapId?: unknown;
  snapName?: unknown;
  style?: unknown;
  />?: unknown;
  <SheetHeader title?: unknown;
  <Text style?: unknown;
  {strings('install_snap.description'?: unknown;
  {?: unknown;
  origin: string;
  snap: snapName?: unknown;
}

const InstallSnapConnectionRequest = ({
  approvalRequest,
  snapId,
  snapName,
  onConfirm,
  onCancel,
}: Pick<
  InstallSnapFlowProps,
  'approvalRequest' | 'onConfirm' | 'onCancel' | 'snapId' | 'snapName'
>) => {
  const { styles } = useStyles(styleSheet, {});

  const origin = useMemo(
    () => approvalRequest.origin,
    [approvalRequest.origin],
  );

  const favicon = useFavicon(origin);

  const urlWithProtocol = prefixUrlWithProtocol(origin);

  const secureIcon = useMemo(
    () =>
      getUrlObj(origin).protocol === 'https:'
        ? IconName.Lock
        : IconName.LockSlash,
    [origin],
  );

  const cancelButtonProps: ButtonProps = {
    variant: ButtonVariants.Secondary,
    label: strings('accountApproval.cancel'),
    size: ButtonSize.Lg,
    onPress: onCancel,
    testID: SNAP_INSTALL_CANCEL,
  };

  const connectButtonProps: ButtonProps = {
    variant: ButtonVariants.Primary,
    label: strings('accountApproval.connect'),
    size: ButtonSize.Lg,
    onPress: onConfirm,
    testID: SNAP_INSTALL_CONNECT,
  };

  return (
    <View testID={SNAP_INSTALL_CONNECTION_REQUEST} style={styles.root}>
      <View style={styles.accountCardWrapper}>
        <TagUrl
          imageSource={favicon}
          label={urlWithProtocol}
          iconName={secureIcon}
        />
        <SnapAvatar
          snapId={snapId}
          snapName={snapName}
          style={styles.snapAvatar}
        />
        <SheetHeader title={strings('install_snap.title')} />
        <Text style={styles.description} variant={TextVariant.BodyMD}>
          {strings('install_snap.description', {
            origin,
            snap: snapName,
          }: InstallSnapConnectionRequestProps)}
        </Text>
        <View style={styles.actionContainer}>
          <BottomSheetFooter
            buttonsAlignment={ButtonsAlignment.Horizontal}
            buttonPropsArray={[cancelButtonProps, connectButtonProps]}
          />
        </View>
      </View>
    </View>
  );
};

export default React.memo(InstallSnapConnectionRequest);
///: END:ONLY_INCLUDE_IF
