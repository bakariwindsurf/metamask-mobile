import { BookmarkActionType, AddBookmarkAction, RemoveBookmarkAction } from './types';
import { Bookmark } from '../../reducers/bookmarks/types';

export function addBookmark(bookmark: Bookmark): AddBookmarkAction {
  return {
    type: BookmarkActionType.ADD_BOOKMARK,
    bookmark,
  };
}

export function removeBookmark(bookmark: Bookmark): RemoveBookmarkAction {
  return {
    type: BookmarkActionType.REMOVE_BOOKMARK,
    bookmark,
  };
}

export * from './types';
