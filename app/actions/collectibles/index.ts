import {
  ActionType,
  type FavoriteCollectible,
} from '../../reducers/collectibles';

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

export const addFavoriteCollectible = (
  selectedAddress: string,
  chainId: string,
  collectible: FavoriteCollectible,
): AddFavoriteCollectibleAction => ({
  type: ActionType.ADD_FAVORITE_COLLECTIBLE,
  selectedAddress,
  chainId,
  collectible,
});

export const removeFavoriteCollectible = (
  selectedAddress: string,
  chainId: string,
  collectible: FavoriteCollectible,
): RemoveFavoriteCollectibleAction => ({
  type: ActionType.REMOVE_FAVORITE_COLLECTIBLE,
  selectedAddress,
  chainId,
  collectible,
});
