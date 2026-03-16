/**
 * This file contains all the actions related to the in app (old/v1) notification system.
 */
import { ACTIONS } from '../../reducers/notification';

interface TransactionNotificationParams {
  autodismiss: number;
  transaction: { id: string; [key: string]: unknown };
  status: string;
}

interface SimpleNotificationParams {
  autodismiss: number;
  title: string;
  description: string;
  status: string;
}

interface ShowSimpleNotificationParams extends SimpleNotificationParams {
  id: string;
}

interface Notification {
  id: string;
  [key: string]: unknown;
}

export function hideCurrentNotification() {
  return {
    type: ACTIONS.HIDE_CURRENT_NOTIFICATION as const,
  };
}

export function hideNotificationById(id: string) {
  return {
    type: ACTIONS.HIDE_NOTIFICATION_BY_ID as const,
    id,
  };
}

export function modifyOrShowTransactionNotificationById({
  autodismiss,
  transaction,
  status,
}: TransactionNotificationParams) {
  return {
    type: ACTIONS.MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION as const,
    autodismiss,
    transaction,
    status,
  };
}

export function modifyOrShowSimpleNotificationById({
  autodismiss,
  title,
  description,
  status,
}: SimpleNotificationParams) {
  return {
    type: ACTIONS.MODIFY_OR_SHOW_SIMPLE_NOTIFICATION as const,
    autodismiss,
    title,
    description,
    status,
  };
}

export function replaceNotificationById(notification: Notification) {
  return {
    type: ACTIONS.REPLACE_NOTIFICATION_BY_ID as const,
    notification,
    id: notification.id,
  };
}

export function removeNotificationById(id: string) {
  return {
    type: ACTIONS.REMOVE_NOTIFICATION_BY_ID as const,
    id,
  };
}

export function removeCurrentNotification() {
  return {
    type: ACTIONS.REMOVE_CURRENT_NOTIFICATION as const,
  };
}

export function showSimpleNotification({
  autodismiss,
  title,
  description,
  status,
  id,
}: ShowSimpleNotificationParams) {
  return {
    id,
    type: ACTIONS.SHOW_SIMPLE_NOTIFICATION as const,
    autodismiss,
    title,
    description,
    status,
  };
}

export function showTransactionNotification({
  autodismiss,
  transaction,
  status,
}: TransactionNotificationParams) {
  return {
    type: ACTIONS.SHOW_TRANSACTION_NOTIFICATION as const,
    autodismiss,
    transaction,
    status,
  };
}

export function removeNotVisibleNotifications() {
  return {
    type: ACTIONS.REMOVE_NOT_VISIBLE_NOTIFICATIONS as const,
  };
}
