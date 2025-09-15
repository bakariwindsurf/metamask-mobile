import { type Action } from 'redux';

export enum BrowserActionType {
  ADD_TO_VIEWED_DAPP = 'ADD_TO_VIEWED_DAPP',
  ADD_TO_BROWSER_HISTORY = 'ADD_TO_BROWSER_HISTORY',
  ADD_TO_BROWSER_WHITELIST = 'ADD_TO_BROWSER_WHITELIST',
  CLEAR_BROWSER_HISTORY = 'CLEAR_BROWSER_HISTORY',
  CLOSE_ALL_TABS = 'CLOSE_ALL_TABS',
  CREATE_NEW_TAB = 'CREATE_NEW_TAB',
  CLOSE_TAB = 'CLOSE_TAB',
  SET_ACTIVE_TAB = 'SET_ACTIVE_TAB',
  UPDATE_TAB = 'UPDATE_TAB',
  STORE_FAVICON_URL = 'STORE_FAVICON_URL',
}

export type AddToViewedDappAction = Action<BrowserActionType.ADD_TO_VIEWED_DAPP> & {
  hostname: string;
};

export type AddToBrowserHistoryAction = Action<BrowserActionType.ADD_TO_BROWSER_HISTORY> & {
  url: string;
  name: string;
};

export type AddToBrowserWhitelistAction = Action<BrowserActionType.ADD_TO_BROWSER_WHITELIST> & {
  url: string;
};

export type ClearBrowserHistoryAction = Action<BrowserActionType.CLEAR_BROWSER_HISTORY> & {
  id: number;
  metricsEnabled: boolean;
  marketingEnabled: boolean;
};

export type CloseAllTabsAction = Action<BrowserActionType.CLOSE_ALL_TABS>;

export type CreateNewTabAction = Action<BrowserActionType.CREATE_NEW_TAB> & {
  url: string;
  linkType?: string;
  id: number;
};

export type CloseTabAction = Action<BrowserActionType.CLOSE_TAB> & {
  id: number;
};

export type SetActiveTabAction = Action<BrowserActionType.SET_ACTIVE_TAB> & {
  id: number;
};

export type UpdateTabAction = Action<BrowserActionType.UPDATE_TAB> & {
  id: number;
  data: {
    isArchived?: boolean;
    url?: string;
    image?: string;
  };
};

export type StoreFaviconUrlAction = Action<BrowserActionType.STORE_FAVICON_URL> & {
  origin: string;
  url: string;
};

export type BrowserAction =
  | AddToViewedDappAction
  | AddToBrowserHistoryAction
  | AddToBrowserWhitelistAction
  | ClearBrowserHistoryAction
  | CloseAllTabsAction
  | CreateNewTabAction
  | CloseTabAction
  | SetActiveTabAction
  | UpdateTabAction
  | StoreFaviconUrlAction;
