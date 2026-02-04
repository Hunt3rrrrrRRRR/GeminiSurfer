export interface HistoryEntry {
  url: string;
  title: string;
  timestamp: number;
}

export interface Bookmark {
  url: string;
  title: string;
  favicon: string;
  timestamp: number;
}

export interface Download {
  id: string;
  filename: string;
  url: string;
  progress: number;
  status: 'downloading' | 'completed' | 'failed' | 'canceled';
  timestamp: number;
  size: string;
  speed?: string;
  eta?: string;
}

export interface TabGroup {
  id: string;
  name: string;
  color: string;
}

export interface SiteSettings {
  jsEnabled: boolean;
  cssEnabled: boolean;
  cookies: Array<{ name: string; value: string; id: string }>;
}

export interface Tab {
  id: string;
  url: string;
  title: string;
  favicon: string;
  history: string[];
  historyIndex: number;
  isLoading: boolean;
  content: PageContent | null;
  error: string | null;
  groupId?: string;
}

export interface PageContent {
  title: string;
  favicon: string;
  htmlContent: string; // The full, functional HTML document
  metadata: {
    sources: Array<{
      title: string;
      uri: string;
    }>;
  };
}

export interface BrowserState {
  tabs: Tab[];
  activeTabId: string;
  globalHistory: HistoryEntry[];
  bookmarks: Bookmark[];
  downloads: Download[];
  tabGroups: TabGroup[];
  siteSettings: Record<string, SiteSettings>;
  devToolsOpen?: boolean;
}