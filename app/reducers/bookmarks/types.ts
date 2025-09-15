/**
 * Bookmark interface
 */
export interface Bookmark {
  name: string;
  url: string;
}

/**
 * Bookmarks state - array of bookmarks
 */
export type BookmarksState = Bookmark[];
