'use strict';

import Engine from './Engine';
import { hexToBN, renderFromWei } from '../util/number';
import Device from '../util/device';
import { strings } from '../../locales/i18n';
import { AppState } from 'react-native';
import NotificationsService from '../util/notifications/services/NotificationService';
import { NotificationTransactionTypes, ChannelId } from '../util/notifications';
import { safeToChecksumAddress } from '../util/address';
import ReviewManager from './ReviewManager';
import { selectEvmTicker } from '../selectors/networkController';
import { store } from '../store';
import { SmartTransactionStatuses } from '@metamask/smart-transactions-controller/dist/types';

import Logger from '../util/Logger';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { endTrace, trace, TraceName } from '../util/trace';
import type { TransactionMeta } from '@metamask/transaction-controller';

interface NotificationData {
  type?: string;
  autoHide?: boolean;
  transaction?: {
    id?: string;
    nonce?: string;
    amount?: string;
    assetType?: string;
  };
  duration?: number;
  data?: {
    title?: string;
    shortDescription?: string;
  };
}

interface SimpleNotificationData {
  duration?: number;
  title?: string;
  description?: string;
  status?: string;
}

interface TransactionNotificationData {
  autodismiss?: number;
  transaction?: NotificationData['transaction'];
  status?: string;
}

interface NavigationLike {
  navigate(view: string): void;
}

interface InitParams {
  navigation: NavigationLike;
  showTransactionNotification: (data: TransactionNotificationData) => void;
  hideCurrentNotification: () => void;
  showSimpleNotification: (data: { id: number; autodismiss?: number; title?: string; description?: string; status?: string }) => void;
  removeNotificationById: (id: string) => void;
}

interface WatchedTransaction {
  id: string;
  silent?: boolean;
  assetType?: string;
}

export const SKIP_NOTIFICATION_TRANSACTION_TYPES = [
  TransactionType.perpsDeposit,
];

export const PERPS_DEPOSIT_SKIP_STATUS = [
  TransactionStatus.unapproved,
  TransactionStatus.approved,
  TransactionStatus.signed,
  TransactionStatus.submitted,
];

export const constructTitleAndMessage = (notification: NotificationData): { title: string; message: string } => {
  let title, message;
  switch (notification.type) {
    case NotificationTransactionTypes.pending:
      title = strings('notifications.pending_title');
      message = strings('notifications.pending_message');
      break;
    case NotificationTransactionTypes.pending_deposit:
      title = strings('notifications.pending_deposit_title');
      message = strings('notifications.pending_deposit_message');
      break;
    case NotificationTransactionTypes.pending_withdrawal:
      title = strings('notifications.pending_withdrawal_title');
      message = strings('notifications.pending_withdrawal_message');
      break;
    case NotificationTransactionTypes.success:
      title = strings('notifications.success_title', {
        nonce: notification?.transaction?.nonce || '',
      });
      message = strings('notifications.success_message');
      break;
    case NotificationTransactionTypes.speedup:
      title = strings('notifications.speedup_title', {
        nonce: notification?.transaction?.nonce || '',
      });
      message = strings('notifications.speedup_message');
      break;
    case NotificationTransactionTypes.success_withdrawal:
      title = strings('notifications.success_withdrawal_title');
      message = strings('notifications.success_withdrawal_message');
      break;
    case NotificationTransactionTypes.success_deposit:
      title = strings('notifications.success_deposit_title');
      message = strings('notifications.success_deposit_message');
      break;
    case NotificationTransactionTypes.error:
      title = strings('notifications.error_title');
      message = strings('notifications.error_message');
      break;
    case NotificationTransactionTypes.cancelled:
      title = strings('notifications.cancelled_title');
      message = strings('notifications.cancelled_message');
      break;
    case NotificationTransactionTypes.received:
      title = strings('notifications.received_title', {
        amount: notification.transaction?.amount,
        assetType: notification.transaction?.assetType,
      });
      message = strings('notifications.received_message');
      break;
    case NotificationTransactionTypes.received_payment:
      title = strings('notifications.received_payment_title');
      message = strings('notifications.received_payment_message', {
        amount: notification.transaction?.amount,
      });
      break;
    default:
      title =
        notification?.data?.title ||
        strings('notifications.default_message_title');
      message =
        notification?.data?.shortDescription ||
        strings('notifications.default_message_description');
      break;
  }
  return { title, message };
};

/**
 * Singleton class responsible for managing all the
 * related notifications, which could be in-app or push
 * depending on the state of the app
 */
class NotificationManager {
  /**
   * Navigation object from react-navigation
   */
  _navigation: NavigationLike | undefined;
  /**
   * Array containing the id of the transaction that should be
   * displayed while interacting with a notification
   */
  _transactionToView!: string[];
  /**
   * Boolean based on the current state of the app
   */
  _backgroundMode!: boolean;

  /**
   * Object containing watched transaction ids list by transaction nonce
   */
  _transactionsWatchTable: Record<string, string[]> = {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _transactionFailedListener: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _transactionConfirmedListener: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _transactionSpeedupListener: any;

  _showTransactionNotification!: (data: TransactionNotificationData) => void;
  _hideTransactionNotification!: () => void;
  _showSimpleNotification!: (data: { id: number; autodismiss?: number; title?: string; description?: string; status?: string }) => void;
  _removeNotificationById!: (id: string) => void;

  static instance: NotificationManager | undefined;

  _handleAppStateChange = (appState: string): void => {
    this._backgroundMode = appState === 'background';
  };

  _viewTransaction = (id: string): void => {
    this._transactionToView.push(id);
    this.goTo('TransactionsHome');
  };

  _removeListeners = (): void => {
    Engine.controllerMessenger.tryUnsubscribe(
      'TransactionController:transactionConfirmed',
      this._transactionConfirmedListener,
    );

    Engine.controllerMessenger.tryUnsubscribe(
      'TransactionController:transactionFailed',
      this._transactionFailedListener,
    );

    Engine.controllerMessenger.tryUnsubscribe(
      'TransactionController:speedupTransactionAdded',
      this._transactionSpeedupListener,
    );
  };

  _showNotification = async (data: NotificationData): Promise<void> => {
    if (this._backgroundMode) {
      const { title, message } = constructTitleAndMessage(data);
      const id = data?.transaction?.id;
      if (id) {
        this._transactionToView.push(id);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pushData: any = {
        channelId: ChannelId.DEFAULT_NOTIFICATION_CHANNEL_ID,
        title,
        body: message,
        data: {
          ...data?.transaction,
          action: 'tx',
          id,
        },
      };

      const extraData = { action: 'tx', id };
      pushData.data = { ...data?.transaction, ...extraData };
      if (Device.isAndroid()) {
        pushData.tag = JSON.stringify(extraData);
      } else {
        pushData.userInfo = extraData;
      }
      await NotificationsService.displayNotification(pushData);
    } else {
      this._showTransactionNotification({
        autodismiss: data.duration,
        transaction: data.transaction,
        status: data.type,
      });
    }
  };

  _failedCallback = (transactionMeta: TransactionMeta): void => {
    // If it fails we hide the pending tx notification
    this._removeNotificationById(transactionMeta.id);
    const nonce = transactionMeta.txParams.nonce as string;
    const transaction =
      this._transactionsWatchTable[nonce];
    transaction &&
      transaction.length &&
      setTimeout(() => {
        // Then we show the error notification
        !this.#shouldSkipNotification(transactionMeta) &&
          this._showNotification({
            type:
              transactionMeta.status === 'cancelled' ? 'cancelled' : 'error',
            autoHide: true,
            transaction: { id: transactionMeta.id },
            duration: 5000,
          });
        // Clean up
        this._removeListeners();
        delete this._transactionsWatchTable[nonce];
      }, 2000);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _confirmedCallback = (transactionMeta: TransactionMeta, originalTransaction: any): void => {
    // Once it's confirmed we hide the pending tx notification
    this._removeNotificationById(transactionMeta.id);
    const nonce = transactionMeta.txParams.nonce as string;
    this._transactionsWatchTable[nonce].length &&
      setTimeout(() => {
        // Then we show the success notification
        !this.#shouldSkipNotification(transactionMeta) &&
          this._showNotification({
            type: 'success',
            autoHide: true,
            transaction: {
              id: transactionMeta.id,
              nonce: `${hexToBN(transactionMeta.txParams.nonce).toString()}`,
            },
            duration: 5000,
          });
        // Clean up
        this._removeListeners();

        trace({
          name: TraceName.TransactionConfirmed,
          data: {
            chainId: transactionMeta.chainId,
            assetType: originalTransaction.assetType,
          },
        });
        const {
          TokenBalancesController,
          TokenDetectionController,
          AccountTrackerController,
          NetworkController,
        } = Engine.context;

        const networkClientId = NetworkController.findNetworkClientIdByChainId(
          transactionMeta.chainId,
        );
        // account balances for ETH txs
        // Detect assets and tokens for ERC20 txs
        // Detect assets for ERC721 txs
        // right after a transaction was confirmed
        const pollPromises = [
          AccountTrackerController.refresh([networkClientId]),
          TokenBalancesController.updateBalances({
            chainIds: [transactionMeta.chainId],
          }),
        ];
        switch (originalTransaction.assetType) {
          case 'ERC20': {
            pollPromises.push(
              ...[
                TokenDetectionController.detectTokens({
                  chainIds: [transactionMeta.chainId],
                }),
              ],
            );
            break;
          }
        }
        Promise.all(pollPromises);
        endTrace({
          name: TraceName.TransactionConfirmed,
          data: {
            chainId: transactionMeta.chainId,
            assetType: originalTransaction.assetType,
          },
        });

        // Prompt review
        ReviewManager.promptReview();

        this._removeListeners();
        delete this._transactionsWatchTable[nonce];
      }, 2000);
  };

  _speedupCallback = (transactionMeta: TransactionMeta): void => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.watchSubmittedTransaction(transactionMeta as any, true);
    setTimeout(() => {
      !this.#shouldSkipNotification(transactionMeta) &&
        this._showNotification({
          autoHide: false,
          type: 'speedup',
          transaction: {
            id: transactionMeta.id,
            nonce: `${hexToBN(transactionMeta.txParams.nonce).toString()}`,
          },
        });
    }, 2000);
  };

  /**
   * Creates a NotificationManager instance
   */
  constructor(
    _navigation: NavigationLike,
    _showTransactionNotification: (data: TransactionNotificationData) => void,
    _hideTransactionNotification: () => void,
    _showSimpleNotification: (data: { id: number; autodismiss?: number; title?: string; description?: string; status?: string }) => void,
    _removeNotificationById: (id: string) => void,
  ) {
    if (!NotificationManager.instance) {
      this._navigation = _navigation;
      this._showTransactionNotification = _showTransactionNotification;
      this._hideTransactionNotification = _hideTransactionNotification;
      this._showSimpleNotification = _showSimpleNotification;
      this._removeNotificationById = _removeNotificationById;
      this._transactionToView = [];
      this._backgroundMode = false;
      NotificationManager.instance = this;
      AppState.addEventListener('change', this._handleAppStateChange);
    }

    return NotificationManager.instance;
  }

  /**
   * Navigates to a specific view
   */
  goTo(view: string): void {
    this._navigation?.navigate(view);
  }

  onMessageReceived(data: NotificationData): void {
    this._showNotification(data);
  }

  /**
   * Returns the id of the transaction that should
   * be displayed and removes it from memory
   */
  getTransactionToView = (): string | undefined => this._transactionToView.pop();

  /**
   * Sets the id of the transaction that should
   * be displayed in memory
   */
  setTransactionToView = (id: string): void => {
    this._transactionToView.push(id);
  };

  /**
   * Shows a notification with title and description
   */
  showSimpleNotification = (data: SimpleNotificationData): number => {
    const id = Date.now();
    this._showSimpleNotification({
      id,
      autodismiss: data.duration,
      title: data.title,
      description: data.description,
      status: data.status,
    });
    return id;
  };

  /**
   * Listen for events of a submitted transaction
   * and generates the corresponding notification
   * based on the status of the transaction (failed or confirmed)
   */
  watchSubmittedTransaction(transaction: WatchedTransaction, speedUp = false): false | void {
    if (transaction.silent) return false;
    const { TransactionController } = Engine.context;
    const transactionMeta = TransactionController.state.transactions.find(
      ({ id }) => id === transaction.id,
    );
    if (!transactionMeta) return;

    const nonce = transactionMeta.txParams.nonce as string;
    // First we show the pending tx notification if is not an speed up tx
    !speedUp &&
      !this.#shouldSkipNotification(transactionMeta) &&
      this._showNotification({
        type: 'pending',
        autoHide: false,
        transaction: {
          id: transactionMeta.id,
        },
      });

    this._transactionsWatchTable[nonce]
      ? this._transactionsWatchTable[nonce].push(transactionMeta.id)
      : (this._transactionsWatchTable[nonce] = [transactionMeta.id]);

    this._transactionConfirmedListener =
      Engine.controllerMessenger.subscribeOnceIf(
        'TransactionController:transactionConfirmed',
        (transactionMeta) => {
          this._confirmedCallback(transactionMeta, transaction);
        },
        (transactionMeta) => transactionMeta.id === transaction.id,
      );

    this._transactionFailedListener =
      Engine.controllerMessenger.subscribeOnceIf(
        'TransactionController:transactionFailed',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (transactionMeta: any) => {
          this._failedCallback(transactionMeta);
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (transactionMeta: any) => transactionMeta.id === transaction.id,
      );

    this._transactionSpeedupListener =
      Engine.controllerMessenger.subscribeOnceIf(
        'TransactionController:speedupTransactionAdded',
        (transactionMeta) => {
          this._speedupCallback(transactionMeta);
        },
        (transactionMeta) => transactionMeta.id === transaction.id,
      );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const smartTransactionListener = async (smartTransaction: any) => {
      if (smartTransaction.status === SmartTransactionStatuses.PENDING) {
        return;
      }
      Engine.controllerMessenger.unsubscribe(
        'SmartTransactionsController:smartTransaction',
        smartTransactionListener,
      );
      if (smartTransaction.status !== SmartTransactionStatuses.CANCELLED) {
        // If the smart transaction is not cancelled, notifications are already handled.
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transactions = (TransactionController as any).getTransactions({
        filterToCurrentNetwork: false,
      });
      const foundTransaction = transactions.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (tx: any) => tx.id === smartTransaction.transactionId,
      );
      !this.#shouldSkipNotification(foundTransaction) &&
        this._showNotification({
          type: 'cancelled',
          autoHide: true,
          transaction: { id: foundTransaction?.id },
          duration: 5000,
        });
    };

    Engine.controllerMessenger.subscribe(
      'SmartTransactionsController:smartTransaction',
      smartTransactionListener,
    );
  }

  /**
   * Generates a notification for an incoming transaction
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gotIncomingTransaction = async (incomingTransactions: any[]): Promise<void> => {
    try {
      const {
        AccountTrackerController,
        AccountsController,
        NetworkController,
      } = Engine.context;

      const selectedInternalAccount = AccountsController.getSelectedAccount();

      const selectedInternalAccountChecksummedAddress = safeToChecksumAddress(
        selectedInternalAccount.address,
      );

      const ticker = selectEvmTicker(store.getState());

      // If a TX has been confirmed more than 10 min ago, it's considered old
      const oldestTimeAllowed = Date.now() - 1000 * 60 * 10;

      const filteredTransactions = incomingTransactions
        .reverse()
        .filter(
          (tx) =>
            safeToChecksumAddress(tx.txParams?.to) ===
              selectedInternalAccountChecksummedAddress &&
            safeToChecksumAddress(tx.txParams?.from) !==
              selectedInternalAccountChecksummedAddress &&
            tx.status === TransactionStatus.confirmed &&
            tx.time > oldestTimeAllowed,
        );

      if (!filteredTransactions.length) {
        return;
      }

      const txChainId = filteredTransactions[0]?.chainId;
      if (txChainId) {
        const networkClientId =
          NetworkController.findNetworkClientIdByChainId(txChainId);

        // Update balance upon detecting a new incoming transaction
        AccountTrackerController.refresh([networkClientId]);
      }
    } catch (error) {
      Logger.log(
        'Notifications',
        'Error while processing incoming transaction',
        error,
      );
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  #shouldSkipNotification(transactionMeta: any): boolean {
    const { TransactionController } = Engine.context;

    if (SKIP_NOTIFICATION_TRANSACTION_TYPES.includes(transactionMeta?.type)) {
      return true;
    }

    const isPerpsDepositInProgress =
      TransactionController.state.transactions.some(
        (tx) =>
          tx.type === TransactionType.perpsDeposit &&
          PERPS_DEPOSIT_SKIP_STATUS.includes(tx.status),
      );

    return isPerpsDepositInProgress;
  }
}

let instance: NotificationManager | undefined;

export default {
  init({
    navigation,
    showTransactionNotification,
    hideCurrentNotification,
    showSimpleNotification,
    removeNotificationById,
  }: InitParams) {
    instance = new NotificationManager(
      navigation,
      showTransactionNotification,
      hideCurrentNotification,
      showSimpleNotification,
      removeNotificationById,
    );
    return instance;
  },
  watchSubmittedTransaction(transaction: WatchedTransaction) {
    return instance?.watchSubmittedTransaction(transaction);
  },
  getTransactionToView() {
    return instance?.getTransactionToView();
  },
  setTransactionToView(id: string) {
    return instance?.setTransactionToView(id);
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gotIncomingTransaction(incomingTransactions: any[]) {
    return instance?.gotIncomingTransaction(incomingTransactions);
  },
  showSimpleNotification(data: SimpleNotificationData) {
    return instance?.showSimpleNotification(data);
  },
  onMessageReceived(data: NotificationData) {
    return instance?.onMessageReceived(data);
  },
};
