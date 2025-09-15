export interface BrowserTab {
  url: string;
  id: number;
  linkType?: string;
  isArchived?: boolean;
  image?: string;
}

export interface BrowserHistoryEntry {
  url: string;
  name: string;
}

export interface BrowserFavicon {
  origin: string;
  url: string;
}

export interface BrowserState {
  history: BrowserHistoryEntry[];
  whitelist: string[];
  tabs: BrowserTab[];
  favicons: BrowserFavicon[];
  activeTab: number | null;
  visitedDappsByHostname: Record<string, boolean>;
}
