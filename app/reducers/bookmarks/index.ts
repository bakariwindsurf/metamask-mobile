/* eslint-disable @typescript-eslint/default-param-last */
import { ActionType, Action } from '../../actions/bookmarks';
import { BookmarksState } from '../../actions/bookmarks/state';

export type { BookmarksState } from '../../actions/bookmarks/state';

export const initialState: BookmarksState = [];

const bookmarksReducer = (
  state: BookmarksState = initialState,
  action: Action,
): BookmarksState => {
  switch (action.type) {
    case ActionType.ADD_BOOKMARK:
      return [...state, action.bookmark];
    case ActionType.REMOVE_BOOKMARK:
      return state.filter((item) => item.url !== action.bookmark.url);
    default:
      return state;
  }
};

export default bookmarksReducer;
