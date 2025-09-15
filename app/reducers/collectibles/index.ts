import { createSelector } from 'reselect';
import { KnownCaipNamespace } from '@metamask/utils';
import { selectChainId } from '../../selectors/networkController';
import {
  selectAllNftContracts,
  selectAllNfts,
} from '../../selectors/nftController';
import { selectSelectedInternalAccountAddress } from '../../selectors/accountsController';
import { compareTokenIds } from '../../util/tokens';
import { createDeepEqualSelector } from '../../selectors/util';
import { selectEnabledNetworksByNamespace } from '../../selectors/networkEnablementController';

export interface FavoriteCollectible {
  tokenId: string;
  address: string;
}

export interface CollectiblesState {
  favorites: {
    [address: string]: {
      [chainId: string]: FavoriteCollectible[];
    };
  };
  isNftFetchingProgress: boolean;
}

export enum ActionType {
  ADD_FAVORITE_COLLECTIBLE = 'ADD_FAVORITE_COLLECTIBLE',
  REMOVE_FAVORITE_COLLECTIBLE = 'REMOVE_FAVORITE_COLLECTIBLE',
  SHOW_NFT_FETCHING_LOADER = 'SHOW_NFT_FETCHING_LOADER',
  HIDE_NFT_FETCHING_LOADER = 'HIDE_NFT_FETCHING_LOADER',
}

interface AddFavoriteCollectibleAction {
  type: ActionType.ADD_FAVORITE_COLLECTIBLE;
  selectedAddress: string;
  chainId: string;
  collectible: FavoriteCollectible;
}

interface RemoveFavoriteCollectibleAction {
  type: ActionType.REMOVE_FAVORITE_COLLECTIBLE;
  selectedAddress: string;
  chainId: string;
  collectible: FavoriteCollectible;
}

interface ShowNftFetchingLoaderAction {
  type: ActionType.SHOW_NFT_FETCHING_LOADER;
}

interface HideNftFetchingLoaderAction {
  type: ActionType.HIDE_NFT_FETCHING_LOADER;
}

export type Action =
  | AddFavoriteCollectibleAction
  | RemoveFavoriteCollectibleAction
  | ShowNftFetchingLoaderAction
  | HideNftFetchingLoaderAction;

const favoritesSelector = (state: { collectibles: CollectiblesState }) => state.collectibles.favorites;

export const isNftFetchingProgressSelector = (state: { collectibles: CollectiblesState }): boolean =>
  state.collectibles.isNftFetchingProgress;

export const collectibleContractsSelector = createSelector(
  selectSelectedInternalAccountAddress,
  selectChainId,
  selectAllNftContracts,
  (address, chainId, allNftContracts) =>
    (address && chainId && (allNftContracts as any)[address]?.[chainId]) || [],
);

export const multichainCollectibleContractsSelector = createSelector(
  selectSelectedInternalAccountAddress,
  selectAllNftContracts,
  (address, allNftContracts) => (address && allNftContracts[address]) || {},
);

export const multichainCollectibleContractsByEnabledNetworksSelector =
  createDeepEqualSelector(
    selectSelectedInternalAccountAddress,
    selectAllNftContracts,
    selectEnabledNetworksByNamespace,
    (address, allNftContracts, enabledNetworks) => {
      const addressContracts = address ? allNftContracts[address] : undefined;

      if (!addressContracts || Object.keys(addressContracts).length === 0) {
        return {};
      }

      const enabledNetworksForEip155 =
        enabledNetworks?.[KnownCaipNamespace.Eip155] || {};

      if (
        !enabledNetworksForEip155 ||
        Object.keys(enabledNetworksForEip155).length === 0
      ) {
        return {};
      }

      const enabledChainIds = Object.keys(enabledNetworksForEip155).filter(
        (chainId) => (enabledNetworksForEip155 as any)[chainId],
      );

      if (enabledChainIds.length === 0) {
        return {};
      }

      return enabledChainIds.reduce((acc: any, chainId) => {
        acc[chainId] = (addressContracts as any)[chainId] || [];
        return acc;
      }, {});
    },
  );

export const collectiblesSelector = createDeepEqualSelector(
  selectSelectedInternalAccountAddress,
  selectChainId,
  selectAllNfts,
  (address, chainId, allNfts) => (address && chainId && (allNfts as any)[address]?.[chainId]) || [],
);

export const multichainCollectiblesSelector = createDeepEqualSelector(
  selectSelectedInternalAccountAddress,
  selectAllNfts,
  (address, allNfts) => (address && allNfts[address]) || {},
);

export const multichainCollectiblesByEnabledNetworksSelector =
  createDeepEqualSelector(
    selectSelectedInternalAccountAddress,
    selectAllNfts,
    selectEnabledNetworksByNamespace,
    (address, allNfts, enabledNetworks) => {
      const addressNfts = address ? allNfts[address] : undefined;

      if (!addressNfts || Object.keys(addressNfts).length === 0) {
        return {};
      }

      const enabledNetworksForEip155 =
        enabledNetworks?.[KnownCaipNamespace.Eip155] || {};

      if (
        !enabledNetworksForEip155 ||
        Object.keys(enabledNetworksForEip155).length === 0
      ) {
        return {};
      }

      const enabledChainIds = Object.keys(enabledNetworksForEip155).filter(
        (chainId) => (enabledNetworksForEip155 as any)[chainId],
      );

      if (enabledChainIds.length === 0) {
        return {};
      }

      const enabledChainIdsSet = new Set(enabledChainIds);

      return Object.keys(addressNfts)
        .filter((chainId) => enabledChainIdsSet.has(chainId))
        .reduce((acc: any, chainId) => {
          acc[chainId] = (addressNfts as any)[chainId];
          return acc;
        }, {});
    },
  );

export const favoritesCollectiblesSelector = createSelector(
  selectSelectedInternalAccountAddress,
  selectChainId,
  favoritesSelector,
  (address, chainId, favorites) => (address && chainId && favorites[address]?.[chainId]) || [],
);

export const isCollectibleInFavoritesSelector = createSelector(
  favoritesCollectiblesSelector,
  (state, collectible) => collectible,
  (favoriteCollectibles, collectible) =>
    Boolean(
      favoriteCollectibles.find(
        ({ tokenId, address }: FavoriteCollectible) =>
          // TO DO: Remove after moving favorites to controllers.
          compareTokenIds(tokenId, collectible.tokenId) &&
          address === collectible.address,
      ),
    ),
);

const getFavoritesCollectibles = (
  favoriteCollectibles: CollectiblesState['favorites'],
  selectedAddress: string,
  chainId: string,
): FavoriteCollectible[] => favoriteCollectibles[selectedAddress]?.[chainId] || [];

export const ADD_FAVORITE_COLLECTIBLE = ActionType.ADD_FAVORITE_COLLECTIBLE;
export const REMOVE_FAVORITE_COLLECTIBLE = ActionType.REMOVE_FAVORITE_COLLECTIBLE;
export const SHOW_NFT_FETCHING_LOADER = ActionType.SHOW_NFT_FETCHING_LOADER;
export const HIDE_NFT_FETCHING_LOADER = ActionType.HIDE_NFT_FETCHING_LOADER;

const initialState: CollectiblesState = {
  favorites: {},
  isNftFetchingProgress: false,
};

const collectiblesFavoritesReducer = (
  state: CollectiblesState = initialState,
  action: Action,
): CollectiblesState => {
  switch (action.type) {
    case ADD_FAVORITE_COLLECTIBLE: {
      const { selectedAddress, chainId, collectible } = action;
      const collectibles = getFavoritesCollectibles(
        state.favorites,
        selectedAddress,
        chainId,
      );
      collectibles.push({
        tokenId: collectible.tokenId,
        address: collectible.address,
      });
      const selectedAddressCollectibles =
        state.favorites[selectedAddress] || {};
      return {
        ...state,
        favorites: {
          ...state.favorites,
          [selectedAddress]: {
            ...selectedAddressCollectibles,
            [chainId]: collectibles.slice(),
          },
        },
      };
    }
    case REMOVE_FAVORITE_COLLECTIBLE: {
      const { selectedAddress, chainId, collectible } = action;
      const collectibles = getFavoritesCollectibles(
        state.favorites,
        selectedAddress,
        chainId,
      );
      const indexToRemove = collectibles.findIndex(
        ({ tokenId, address }) =>
          // TO DO: Remove after moving favorites to controllers.
          compareTokenIds(tokenId, collectible.tokenId) &&
          address === collectible.address,
      );
      collectibles.splice(indexToRemove, 1);
      const selectedAddressCollectibles =
        state.favorites[selectedAddress] || {};
      return {
        ...state,
        favorites: {
          ...state.favorites,
          [selectedAddress]: {
            ...selectedAddressCollectibles,
            [chainId]: collectibles.slice(),
          },
        },
      };
    }
    case SHOW_NFT_FETCHING_LOADER: {
      return {
        ...state,
        isNftFetchingProgress: true,
      };
    }
    case HIDE_NFT_FETCHING_LOADER: {
      return {
        ...state,
        isNftFetchingProgress: false,
      };
    }
    default: {
      return state;
    }
  }
};

export const showNftFetchingLoadingIndicator = (): ShowNftFetchingLoaderAction => ({
  type: SHOW_NFT_FETCHING_LOADER,
});

export const hideNftFetchingLoadingIndicator = (): HideNftFetchingLoaderAction => ({
  type: HIDE_NFT_FETCHING_LOADER,
});

export default collectiblesFavoritesReducer;
