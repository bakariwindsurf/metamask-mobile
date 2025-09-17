import type { Action as ReduxAction } from 'redux';
import { Bookmark } from './state';

export enum ActionType {
  ADD_BOOKMARK = 'ADD_BOOKMARK',
  REMOVE_BOOKMARK = 'REMOVE_BOOKMARK',
}

export interface AddBookmarkAction extends ReduxAction<ActionType.ADD_BOOKMARK> {
  bookmark: Bookmark;
}

export interface RemoveBookmarkAction extends ReduxAction<ActionType.REMOVE_BOOKMARK> {
  bookmark: Bookmark;
}

export type Action = AddBookmarkAction | RemoveBookmarkAction;

export const addBookmark = (bookmark: Bookmark): AddBookmarkAction => ({
  type: ActionType.ADD_BOOKMARK,
  bookmark,
});

export const removeBookmark = (bookmark: Bookmark): RemoveBookmarkAction => ({
  type: ActionType.REMOVE_BOOKMARK,
  bookmark,
});
