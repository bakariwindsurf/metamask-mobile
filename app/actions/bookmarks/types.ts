import { type Action } from 'redux';
import { type Bookmark } from '../../reducers/bookmarks/types';

// Action type enum
export enum BookmarkActionType {
  ADD_BOOKMARK = 'ADD_BOOKMARK',
  REMOVE_BOOKMARK = 'REMOVE_BOOKMARK',
}

export type AddBookmarkAction = Action<BookmarkActionType.ADD_BOOKMARK> & {
  bookmark: Bookmark;
};

export type RemoveBookmarkAction = Action<BookmarkActionType.REMOVE_BOOKMARK> & {
  bookmark: Bookmark;
};

/**
 * Bookmark actions union type
 */
export type BookmarkAction = AddBookmarkAction | RemoveBookmarkAction;
