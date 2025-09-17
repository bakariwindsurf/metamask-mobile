export interface Bookmark {
  url: string;
  name: string;
  [key: string]: unknown;
}

export type BookmarksState = Bookmark[];
