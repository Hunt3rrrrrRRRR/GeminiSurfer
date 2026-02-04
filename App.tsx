
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Tab, BrowserState, HistoryEntry, Bookmark, Download, TabGroup, SiteSettings, PageContent } from './types';
import { simulatePageLoad, fetchOmniboxSuggestions } from './services/geminiService';
import { 
  ArrowLeft, 
  ArrowRight,
  RotateCw, 
  HomeIcon, 
  XIcon, 
  PlusIcon, 
  LockIcon, 
  MagnifyingGlass,
  GlobeAlt,
  Clock,
  StarIcon,
  DownloadIcon,
  ShieldCheckIcon,
  FolderIcon,
  CodeBracketIcon,
  CommandLineIcon
} from './components/Icon';
import BrowserContent from './components/BrowserContent';

const PRESET_COLORS = [
  '#1a73e8', // Blue
  '#d93025', // Red
  '#188038', // Green
  '#f29900', // Yellow
  '#9334e6', // Purple
  '#ff63b1', // Pink
  '#00d1ff', // Cyan
  '#fa7b17', // Orange
];

const App: React.FC = () => {
  const [state, setState] = useState<BrowserState>({
    tabs: [
      {
        id: '1',
        url: 'about:home',
        title: 'New Tab',
        favicon: '',
        history: ['about:home'],
        historyIndex: 0,
        isLoading: false,
        content: null,
        error: null
      }
    ],
    activeTabId: '1',
    globalHistory: [],
    bookmarks: [],
    downloads: [],
    tabGroups: [],
    siteSettings: {},
    devToolsOpen: false
  });

  const [addressBarValue, setAddressBarValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [tabContextMenu, setTabContextMenu] = useState<{ x: number, y: number, tabId: string } | null>(null);
  
  const addressInputRef = useRef<HTMLInputElement>(null);
  const groupEditorRef = useRef<HTMLDivElement>(null);
  const activeTab = state.tabs.find(t => t.id === state.activeTabId) || state.tabs[0];

  const currentDomain = useMemo(() => {
    try {
      if (activeTab.url.startsWith('about:') || activeTab.url.startsWith('chrome:') || activeTab.url.startsWith('data:')) return 'internal';
      const url = new URL(activeTab.url.startsWith('http') ? activeTab.url : `https://${activeTab.url}`);
      return url.hostname;
    } catch {
      return 'unknown';
    }
  }, [activeTab.url]);

  // Fix: Added isBookmarked computation
  const isBookmarked = useMemo(() => {
    return state.bookmarks.some(b => b.url === activeTab.url);
  }, [state.bookmarks, activeTab.url]);

  // Handle Omnibox Suggestions
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (addressBarValue && showSuggestions && !addressBarValue.startsWith('about:') && !addressBarValue.startsWith('chrome:')) {
        const results = await fetchOmniboxSuggestions(addressBarValue);
        setSuggestions(results);
      } else {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [addressBarValue, showSuggestions]);

  useEffect(() => {
    const internal = ['about:home', 'about:history', 'about:bookmarks', 'about:downloads', 'about:downloads-folder', 'about:version', 'chrome://settings'];
    if (activeTab.url.startsWith('data:text/html')) {
        setAddressBarValue(activeTab.url);
    } else {
        setAddressBarValue(internal.includes(activeTab.url) ? '' : activeTab.url);
    }
  }, [activeTab.url, state.activeTabId]);

  // Global click listeners
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (groupEditorRef.current && !groupEditorRef.current.contains(event.target as Node)) {
        setEditingGroupId(null);
      }
      setTabContextMenu(null);
      if (addressInputRef.current && !addressInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigate = useCallback(async (targetUrl: string, isFromHistory = false) => {
    let cleanUrl = targetUrl.trim();
    if (!cleanUrl) return;

    setShowSuggestions(false);

    const internalPages = ['about:history', 'about:home', 'about:bookmarks', 'about:downloads', 'about:downloads-folder', 'about:version', 'chrome://settings', 'chrome://version'];
    if (internalPages.includes(cleanUrl) || cleanUrl.startsWith('chrome://')) {
      const displayUrl = cleanUrl.replace('chrome://', 'about:');
      setState(prev => ({
        ...prev,
        tabs: prev.tabs.map(t => t.id === prev.activeTabId ? {
          ...t,
          url: displayUrl,
          title: displayUrl === 'about:home' ? 'New Tab' : displayUrl.split(':')[1].toUpperCase(),
          favicon: '',
          content: null,
          isLoading: false,
          error: null,
          history: isFromHistory ? t.history : [...t.history.slice(0, t.historyIndex + 1), displayUrl],
          historyIndex: isFromHistory ? t.historyIndex : t.historyIndex + 1
        } : t)
      }));
      return;
    }

    const isUrl = cleanUrl.includes('.') && !cleanUrl.includes(' ');
    if (!isUrl) {
      cleanUrl = `https://www.google.com/search?q=${encodeURIComponent(cleanUrl)}`;
    } else if (!cleanUrl.startsWith('http')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    setState(prev => ({
      ...prev,
      tabs: prev.tabs.map(t => t.id === prev.activeTabId ? {
        ...t,
        isLoading: true,
        url: cleanUrl,
        error: null,
        history: isFromHistory ? t.history : [...t.history.slice(0, t.historyIndex + 1), cleanUrl],
        historyIndex: isFromHistory ? t.historyIndex : t.historyIndex + 1
      } : t)
    }));

    try {
      const content = await simulatePageLoad(cleanUrl);
      setState(prev => ({
        ...prev,
        globalHistory: [{ url: cleanUrl, title: content.title, timestamp: Date.now() }, ...prev.globalHistory].slice(0, 100),
        tabs: prev.tabs.map(t => t.id === prev.activeTabId ? { ...t, isLoading: false, content, title: content.title, favicon: content.favicon } : t)
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        tabs: prev.tabs.map(t => t.id === prev.activeTabId ? { ...t, isLoading: false, error: 'Connection reset by peer. (Chromium Error)' } : t)
      }));
    }
  }, [state.activeTabId]);

  const toggleBookmark = useCallback(() => {
    if (activeTab.url.startsWith('about:')) return;
    setState(prev => {
      const alreadyExists = prev.bookmarks.some(b => b.url === activeTab.url);
      if (alreadyExists) return { ...prev, bookmarks: prev.bookmarks.filter(b => b.url !== activeTab.url) };
      const newBookmark: Bookmark = { url: activeTab.url, title: activeTab.title || activeTab.url, favicon: activeTab.favicon, timestamp: Date.now() };
      return { ...prev, bookmarks: [...prev.bookmarks, newBookmark] };
    });
  }, [activeTab]);

  const createTab = useCallback((url = 'about:home') => {
    const id = Math.random().toString(36).substr(2, 9);
    setState(prev => ({
      ...prev,
      tabs: [...prev.tabs, { id, url, title: 'New Tab', favicon: '', history: [url], historyIndex: 0, isLoading: false, content: null, error: null }],
      activeTabId: id
    }));
    setTimeout(() => addressInputRef.current?.focus(), 50);
  }, []);

  const closeTab = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setState(prev => {
      if (prev.tabs.length === 1) {
        return { ...prev, tabs: prev.tabs.map(t => t.id === id ? { ...t, url: 'about:home', title: 'New Tab', history: ['about:home'], historyIndex: 0, content: null, groupId: undefined } : t) };
      }
      const idx = prev.tabs.findIndex(t => t.id === id);
      const newTabs = prev.tabs.filter(t => t.id !== id);
      return { ...prev, tabs: newTabs, activeTabId: prev.activeTabId === id ? newTabs[Math.max(0, idx - 1)].id : prev.activeTabId };
    });
  }, []);

  const handleTabContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    setTabContextMenu({ x: e.clientX, y: e.clientY, tabId });
  };

  const createGroupForTab = (tabId: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newGroup: TabGroup = { id, name: 'Group', color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)] };
    setState(prev => ({
      ...prev,
      tabGroups: [...prev.tabGroups, newGroup],
      tabs: prev.tabs.map(t => t.id === tabId ? { ...t, groupId: id } : t)
    }));
    setEditingGroupId(id);
  };

  // Organize tabs by groups
  const renderedTabStrip = useMemo(() => {
    const elements: React.ReactNode[] = [];
    const processedGroups = new Set<string>();

    state.tabs.forEach((tab) => {
      if (tab.groupId && !processedGroups.has(tab.groupId)) {
        const group = state.tabGroups.find(g => g.id === tab.groupId);
        if (group) {
          elements.push(
            <div key={`group-label-${group.id}`} className="relative flex items-center h-full mb-[2px]">
              <button 
                onClick={(e) => { e.stopPropagation(); setEditingGroupId(group.id); }}
                className="px-2 py-0.5 mx-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all hover:brightness-110"
                style={{ backgroundColor: group.color, color: '#fff' }}
              >
                {group.name}
              </button>
              {editingGroupId === group.id && (
                <div ref={groupEditorRef} className="absolute top-8 left-0 w-64 bg-[#1c1d1f] border border-[#2d2e31] rounded-lg shadow-2xl z-[100] p-3 animate-slide-up">
                  <input autoFocus className="w-full bg-[#0e0f11] border border-[#2d2e31] rounded px-2 py-1 text-xs mb-3 focus:border-[#1a73e8] outline-none" value={group.name} onChange={(e) => setState(p => ({...p, tabGroups: p.tabGroups.map(g => g.id === group.id ? {...g, name: e.target.value} : g)}))} placeholder="Group name" />
                  <div className="flex flex-wrap gap-2 mb-3">
                    {PRESET_COLORS.map(color => (
                      <button key={color} onClick={() => setState(p => ({...p, tabGroups: p.tabGroups.map(g => g.id === group.id ? {...g, color} : g)}))} className={`w-5 h-5 rounded-full ${group.color === color ? 'ring-2 ring-white' : ''}`} style={{ backgroundColor: color }} />
                    ))}
                  </div>
                  <button onClick={() => setState(prev => ({...prev, tabGroups: prev.tabGroups.filter(g => g.id !== group.id), tabs: prev.tabs.map(t => t.groupId === group.id ? {...t, groupId: undefined} : t)}))} className="text-[10px] text-rose-500 hover:underline">Ungroup</button>
                </div>
              )}
            </div>
          );
          processedGroups.add(tab.groupId);
        }
      }

      const isActive = state.activeTabId === tab.id;
      const group = tab.groupId ? state.tabGroups.find(g => g.id === tab.groupId) : null;

      elements.push(
        <div 
          key={tab.id}
          onContextMenu={(e) => handleTabContextMenu(e, tab.id)}
          onClick={() => setState(prev => ({ ...prev, activeTabId: tab.id }))}
          className={`og-tab group flex items-center min-w-[140px] max-w-[220px] px-3 cursor-pointer ${isActive ? 'active' : ''}`}
          style={isActive && group ? { '--accent': group.color } as any : {}}
        >
          <div className="flex-1 truncate mr-1 flex items-center text-[11px] font-medium">
            {tab.isLoading ? (
              <div className="w-3 h-3 mr-2 rounded-full border-2 border-[var(--accent, #1a73e8)] border-t-transparent animate-spin"></div>
            ) : (
              tab.favicon ? <img src={tab.favicon} className="w-3.5 h-3.5 mr-2" alt="" /> : <GlobeAlt className="w-3.5 h-3.5 mr-2 text-[#9aa0a6]" />
            )}
            <span className="truncate">{tab.title}</span>
          </div>
          <button onClick={(e) => closeTab(tab.id, e)} className="p-1 rounded-md hover:bg-white/10 opacity-0 group-hover:opacity-100"><XIcon className="w-3 h-3" /></button>
        </div>
      );
    });
    return elements;
  }, [state.tabs, state.activeTabId, state.tabGroups, editingGroupId]);

  return (
    <div className="flex h-screen w-screen bg-[#0e0f11] text-[#e8eaed] overflow-hidden select-none font-sans">
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Chromium Tab Strip */}
        <div className="flex items-center px-2 bg-[#0e0f11] shrink-0 h-[38px] pt-1 border-b border-[#1c1d1f]">
          <div className="flex flex-1 overflow-x-auto no-scrollbar items-end h-full">
            {renderedTabStrip}
            <button onClick={() => createTab()} className="p-1.5 ml-1 text-[#9aa0a6] hover:text-[#e8eaed] hover:bg-white/5 rounded-full self-center transition-all"><PlusIcon className="w-4 h-4" /></button>
          </div>
          <div className="flex items-center px-2 space-x-1">
            <button onClick={() => handleNavigate('chrome://settings')} className="p-1.5 text-[#9aa0a6] hover:text-[#1a73e8] rounded-md transition-colors"><ShieldCheckIcon className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Chromium Toolbar */}
        <div className="flex items-center h-[48px] px-4 bg-[#1c1d1f] shrink-0 border-b border-[#0e0f11] space-x-3">
          <div className="flex items-center space-x-1">
            <button disabled={activeTab.historyIndex <= 0} onClick={() => {}} className="btn-interact p-2 rounded-full disabled:opacity-20"><ArrowLeft className="w-4.5 h-4.5" /></button>
            <button className="btn-interact p-2 rounded-full opacity-20"><ArrowRight className="w-4.5 h-4.5" /></button>
            <button onClick={() => handleNavigate(activeTab.url, true)} className="btn-interact p-2 rounded-full"><RotateCw className={`w-4.5 h-4.5 ${activeTab.isLoading ? 'animate-spin' : ''}`} /></button>
          </div>

          <div className="flex-1 h-8 flex items-center relative z-50">
            <div className={`flex items-center w-full h-full px-4 rounded-full bg-[#0e0f11] border border-transparent transition-all ${showSuggestions ? 'rounded-b-none border-[#1a73e8]' : 'focus-within:border-[#1a73e8]/50'}`}>
              <LockIcon className="w-3.5 h-3.5 text-green-500/70 mr-3" />
              <input 
                ref={addressInputRef}
                type="text"
                value={addressBarValue}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => setAddressBarValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNavigate(addressBarValue)}
                placeholder="Search with Google or enter address"
                className="flex-1 bg-transparent text-[13px] text-[#e8eaed] outline-none font-normal"
              />
              <button onClick={toggleBookmark} className="ml-3 text-[#9aa0a6] hover:text-[#1a73e8]"><StarIcon className={`w-4 h-4 ${isBookmarked ? 'text-[#1a73e8]' : ''}`} fill={isBookmarked ? "#1a73e8" : "none"} /></button>
            </div>

            {/* AI Omnibox Suggestions */}
            {showSuggestions && (suggestions.length > 0 || addressBarValue) && (
              <div className="absolute top-full left-0 right-0 bg-[#0e0f11] border border-[#1a73e8] border-t-0 rounded-b-xl shadow-2xl overflow-hidden animate-slide-up">
                {suggestions.map((suggestion, i) => (
                  <div 
                    key={i} 
                    onClick={() => handleNavigate(suggestion)}
                    className="px-10 py-2.5 flex items-center gap-4 hover:bg-[#1c1d1f] cursor-pointer group transition-colors"
                  >
                    <MagnifyingGlass className="w-3.5 h-3.5 text-[#9aa0a6] group-hover:text-[#1a73e8]" />
                    <span className="text-[13px] truncate text-[#e8eaed]">{suggestion}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
             <button onClick={() => handleNavigate('chrome://downloads')} className="text-[#9aa0a6] hover:text-[#1a73e8] p-1.5 rounded-md hover:bg-white/5 transition-all"><DownloadIcon className="w-5 h-5" /></button>
             <button onClick={() => setState(p => ({...p, devToolsOpen: !p.devToolsOpen}))} className={`p-1.5 rounded-md transition-all ${state.devToolsOpen ? 'text-[#1a73e8] bg-white/5' : 'text-[#9aa0a6] hover:text-[#1a73e8]'}`}><CommandLineIcon className="w-5 h-5" /></button>
             <div onClick={() => handleNavigate('chrome://version')} className="w-7 h-7 rounded-full bg-[#1a73e8] flex items-center justify-center text-[12px] font-bold text-white cursor-pointer hover:brightness-110 shadow-lg border border-white/10">C</div>
          </div>
        </div>

        {/* Tab Context Menu */}
        {tabContextMenu && (
          <div 
            className="fixed bg-[#1c1d1f] border border-[#2d2e31] rounded-md shadow-2xl z-[1000] py-1 w-48 text-[12px] animate-slide-up"
            style={{ left: tabContextMenu.x, top: tabContextMenu.y }}
          >
            <button onClick={() => createTab(state.tabs.find(t => t.id === tabContextMenu.tabId)?.url)} className="w-full text-left px-4 py-2 hover:bg-[#1a73e8] hover:text-white transition-colors">Duplicate</button>
            <button onClick={() => createGroupForTab(tabContextMenu.tabId)} className="w-full text-left px-4 py-2 hover:bg-[#1a73e8] hover:text-white transition-colors">Add to New Group</button>
            <div className="h-px bg-[#2d2e31] my-1" />
            <button onClick={() => closeTab(tabContextMenu.tabId)} className="w-full text-left px-4 py-2 hover:bg-rose-500 hover:text-white transition-colors">Close Tab</button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 relative bg-[#0e0f11] overflow-hidden">
          <BrowserContent 
            content={activeTab.content} 
            isLoading={activeTab.isLoading} 
            error={activeTab.error} 
            onNavigate={handleNavigate} 
            currentUrl={activeTab.url} 
            historyItems={state.globalHistory} 
            bookmarkItems={state.bookmarks} 
            downloadItems={state.downloads}
            devToolsOpen={state.devToolsOpen}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
