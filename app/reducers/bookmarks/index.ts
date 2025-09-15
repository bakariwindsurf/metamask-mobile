import { BookmarkAction, BookmarkActionType } from '../../actions/bookmarks/types';
import { BookmarksState } from './types';

export * from './types';

/**
 * Initial bookmarks state
 */
export const bookmarksInitialState: BookmarksState = [];

/**
 * Bookmarks reducer
 */
/* eslint-disable @typescript-eslint/default-param-last */
const bookmarksReducer = (
  state: BookmarksState = bookmarksInitialState,
  action: BookmarkAction,
): BookmarksState => {
  switch (action.type) {
    case BookmarkActionType.ADD_BOOKMARK:
      return [...state, action.bookmark];
    case BookmarkActionType.REMOVE_BOOKMARK:
      return state.filter((item) => item.url !== action.bookmark.url);
    default:
      return state;
  }
};

export default bookmarksReducer;
