import Engine from '../../core/Engine';
import { MetaMetrics, MetaMetricsEvents } from '../../core/Analytics';
import { getAddressAccountType } from '../address';
import NotificationManager from '../../core/NotificationManager';
import { WALLET_CONNECT_ORIGIN } from '../walletconnect';
import AppConstants from '../../core/AppConstants';
import { InteractionManager } from 'react-native';
import { strings } from '../../../locales/i18n';
import { selectEvmChainId } from '../../selectors/networkController';
import { store } from '../../store';
import { getBlockaidMetricsParams } from '../blockaid';
import Device from '../device';
import { getDecimalChainId } from '../networks';
import Logger from '../Logger';
import { MetricsEventBuilder } from '../../core/Analytics/MetricsEventBuilder';

export const typedSign = {
  V1: 'eth_signTypedData',
  V3: 'eth_signTypedData_v3',
  V4: 'eth_signTypedData_v4',
};

interface MessageParams {
  from?: string;
  origin?: string;
  version?: string;
  currentPageInformation?: Record<string, any>;
  meta?: Record<string, any>;
  [key: string]: any;
}

interface LayoutEvent {
  nativeEvent: {
    layout: {
      height: number;
      width: number;
      x: number;
      y: number;
    };
  };
}

export const getAnalyticsParams = (
  messageParams: MessageParams,
  signType: string,
  securityAlertResponse?: Record<string, any>,
): Record<string, any> => {
  if (!messageParams || typeof messageParams !== 'object') {
    throw new Error('Invalid messageParams provided');
  }

  const { currentPageInformation = {}, meta = {} } = messageParams;
  const pageInfo = { ...currentPageInformation, ...meta };

  const analyticsParams: Record<string, any> = {
    account_type: getAddressAccountType(messageParams.from ?? ''),
    dapp_host_name: 'N/A' as string,
    chain_id: null as string | null,
    signature_type: signType,
    version: messageParams?.version || 'N/A',
    ...pageInfo.analytics,
  };

  try {
    const chainId = selectEvmChainId(store.getState());
    analyticsParams.chain_id = getDecimalChainId(chainId);

    if (pageInfo.url) {
      const url = new URL(pageInfo.url);
      analyticsParams.dapp_host_name = url.host;
    }

    if (securityAlertResponse) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blockaidParams = getBlockaidMetricsParams(securityAlertResponse as any);
      Object.assign(analyticsParams, blockaidParams);
    }
  } catch (error: any) {
    Logger.error(error, 'Error processing analytics parameters:');
  }

  return analyticsParams;
};

export const walletConnectNotificationTitle = (confirmation: boolean, isError: boolean): string => {
  if (isError) return strings('notifications.wc_signed_failed_title');
  return confirmation
    ? strings('notifications.wc_signed_title')
    : strings('notifications.wc_signed_rejected_title');
};

export const showWalletConnectNotification = (
  messageParams: MessageParams = {} as MessageParams,
  confirmation = false,
  isError = false,
): void => {
  InteractionManager.runAfterInteractions(() => {
    /**
     * FIXME: need to rewrite the way BackgroundBridge sets the origin.
     */
    const origin = (messageParams.origin ?? '').toLowerCase().split(':').join('');
    const isWCOrigin = origin.startsWith(
      WALLET_CONNECT_ORIGIN.split(':').join('').toLowerCase(),
    );
    const isSDKOrigin = origin.startsWith(
      AppConstants.MM_SDK.SDK_REMOTE_ORIGIN.split(':').join('').toLowerCase(),
    );

    if (isWCOrigin || isSDKOrigin) {
      NotificationManager.showSimpleNotification({
        status: `simple_notification${!confirmation ? '_rejected' : ''}`,
        duration: 5000,
        title: walletConnectNotificationTitle(confirmation, isError),
        description: strings('notifications.wc_description'),
      });
    }
  });
};

export const handleSignatureAction = async (
  onAction: () => void | Promise<void>,
  messageParams: MessageParams,
  signType: string,
  securityAlertResponseOrConfirmation?: Record<string, any> | boolean,
  confirmationArg?: boolean,
): Promise<void> => {
  // Support both call patterns:
  // (onAction, messageParams, signType, securityAlertResponse, confirmation)
  // (onAction, messageParams, signType, confirmation) -- from hardwareWallet
  let securityAlertResponse: Record<string, any> | undefined;
  let confirmation: boolean;
  if (typeof securityAlertResponseOrConfirmation === 'boolean') {
    securityAlertResponse = undefined;
    confirmation = securityAlertResponseOrConfirmation;
  } else {
    securityAlertResponse = securityAlertResponseOrConfirmation;
    confirmation = confirmationArg ?? false;
  }
  await onAction();
  showWalletConnectNotification(messageParams, confirmation);
  MetaMetrics.getInstance().trackEvent(
    MetricsEventBuilder.createEventBuilder(
      confirmation
        ? MetaMetricsEvents.SIGNATURE_APPROVED
        : MetaMetricsEvents.SIGNATURE_REJECTED,
    )
      .addProperties(
        getAnalyticsParams(messageParams, signType, securityAlertResponse),
      )
      .build(),
  );
};

export const addSignatureErrorListener = (metamaskId: string, onSignatureError: (...args: any[]) => void): void => {
  Engine.context.SignatureController.hub.on(
    `${metamaskId}:signError`,
    onSignatureError,
  );
};

export const removeSignatureErrorListener = (metamaskId: string, onSignatureError: (...args: any[]) => void): void => {
  Engine.context.SignatureController.hub.removeListener(
    `${metamaskId}:signError`,
    onSignatureError,
  );
};

export const shouldTruncateMessage = (e: LayoutEvent): boolean => {
  if (
    (Device.isIos() && e.nativeEvent.layout.height > 70) ||
    (Device.isAndroid() && e.nativeEvent.layout.height > 100)
  ) {
    return true;
  }

  return false;
};
