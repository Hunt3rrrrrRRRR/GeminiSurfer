import React, { useMemo, useState, useEffect, useRef } from 'react';
import { PageContent, HistoryEntry, Bookmark, Download, SiteSettings } from '../types';
import { GlobeAlt, MagnifyingGlass, ArrowRight, Clock, XIcon, StarIcon, DownloadIcon, FolderIcon, PlusIcon, CodeBracketIcon, ShieldCheckIcon, LockIcon } from './Icon';

interface BrowserContentProps {
  content: PageContent | null;
  isLoading: boolean;
  error: string | null;
  onNavigate: (url: string) => void;
  currentUrl: string;
  historyItems?: HistoryEntry[];
  bookmarkItems?: Bookmark[];
  downloadItems?: Download[];
  devToolsOpen?: boolean;
}

const BrowserContent: React.FC<BrowserContentProps> = ({ 
  content, isLoading, error, onNavigate, currentUrl, historyItems = [], bookmarkItems = [], downloadItems = [], devToolsOpen = false
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [activeDevTab, setActiveDevTab] = useState<'console' | 'elements' | 'network'>('console');

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => { 
      if (e.data?.type === 'navigate') {
        onNavigate(e.data.url);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onNavigate]);

  if (isLoading) return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-[#0e0f11]">
      <div className="w-12 h-12 border-4 border-[#1c1d1f] border-t-[#1a73e8] rounded-full animate-spin"></div>
      <div className="mt-6 text-[#9aa0a6] text-sm font-medium tracking-wide">CONNECTING TO CHROMIUM INSTANCE...</div>
      <div className="mt-2 text-[10px] text-gray-700 font-mono uppercase">Request: {currentUrl} | Engine: Blink 130</div>
    </div>
  );

  if (error) return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-[#0e0f11] text-[#e8eaed] p-10 text-center">
      <div className="bg-[#1c1d1f] p-8 rounded-2xl border border-white/5 shadow-2xl max-w-md">
        <XIcon className="w-16 h-16 text-rose-500 mx-auto mb-6" />
        <h2 className="text-2xl font-bold mb-3">Chromium Unresponsive</h2>
        <p className="text-[#9aa0a6] mb-8 text-sm leading-relaxed">{error}</p>
        <button onClick={() => onNavigate(currentUrl)} className="w-full py-3 bg-[#1a73e8] rounded-xl font-bold hover:brightness-110 transition-all shadow-lg shadow-blue-500/20">Restart Engine</button>
      </div>
    </div>
  );

  // Chromium Internal Page: Settings
  if (currentUrl === 'about:settings') {
    return (
      <div className="h-full bg-[#f8f9fa] dark:bg-[#202124] flex overflow-hidden">
        <div className="w-64 bg-[#f8f9fa] dark:bg-[#202124] border-r border-[#dee1e6] dark:border-[#3c4043] p-4 flex flex-col pt-12">
          <h1 className="text-xl font-medium px-4 mb-8 dark:text-white">Settings</h1>
          <nav className="space-y-1">
            {['You and Google', 'Autofill', 'Privacy and security', 'Appearance', 'Search engine', 'Default browser', 'On startup'].map(item => (
              <button key={item} className={`w-full text-left px-4 py-2 text-sm rounded-r-full transition-colors ${item === 'Appearance' ? 'bg-[#e8f0fe] dark:bg-[#1a73e820] text-[#1a73e8] font-medium' : 'text-[#5f6368] dark:text-[#bdc1c6] hover:bg-black/5 dark:hover:bg-white/5'}`}>
                {item}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex-1 overflow-y-auto p-12 max-w-4xl mx-auto dark:text-[#e8eaed]">
          <h2 className="text-2xl mb-8">Appearance</h2>
          <div className="bg-white dark:bg-[#292a2d] rounded-xl shadow-sm border border-[#dee1e6] dark:border-[#3c4043] overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b dark:border-[#3c4043]">
              <div>
                <p className="font-medium">Theme</p>
                <p className="text-xs text-gray-500">Chromium Dark (Default)</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </div>
            <div className="p-4 flex items-center justify-between border-b dark:border-[#3c4043]">
              <div>
                <p className="font-medium">Show home button</p>
              </div>
              <div className="w-8 h-4 bg-[#1a73e8] rounded-full relative"><div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full" /></div>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">Font size</p>
              </div>
              <span className="text-sm text-gray-500">Medium (recommended)</span>
            </div>
          </div>
          <p className="mt-8 text-xs text-gray-500">Chromium Version 130.0.6723.59 (Official Build) (64-bit)</p>
        </div>
      </div>
    );
  }

  // Chromium Internal Page: Version
  if (currentUrl === 'about:version') {
    return (
      <div className="h-full bg-white p-12 overflow-y-auto font-mono text-[13px] text-[#3c4043]">
        <h1 className="text-2xl mb-6 font-sans font-bold">About Chromium</h1>
        <table className="w-full border-collapse">
          <tbody>
            {[
              ['Chromium', '130.0.6723.59 (Official Build)'],
              ['Revision', '7283921-12-2025'],
              ['OS', 'AI OS v2.4 (Simulated)'],
              ['JavaScript', 'V8 13.0.245'],
              ['User Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'],
              ['Command Line', '--enable-ai-rendering --disable-gpu-hallucinations --force-high-fidelity-mode'],
              ['Grounding Engine', 'Gemini 3 Pro + Google Search']
            ].map(([k, v]) => (
              <tr key={k} className="border-b border-gray-100">
                <td className="py-2 w-48 font-bold">{k}</td>
                <td className="py-2 text-blue-600">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // New Tab Page
  if (currentUrl === 'about:home' || !content) {
    return (
      <div className="h-full bg-[#161719] flex flex-col items-center pt-[100px] text-white overflow-y-auto no-scrollbar">
        <div className="text-[96px] font-bold tracking-tight mb-8 flex items-center animate-slide-up">
          <span className="text-white">Gemini</span>
          <span className="flex">
            <span className="text-[#4285F4]">S</span>
            <span className="text-[#EA4335]">u</span>
            <span className="text-[#FBBC05]">r</span>
            <span className="text-[#4285F4]">f</span>
            <span className="text-[#34A853]">e</span>
            <span className="text-[#EA4335]">r</span>
          </span>
        </div>

        <div className="w-full max-w-[584px] px-4 mb-16 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="relative group">
            <div className="absolute left-6 top-1/2 -translate-y-1/2">
              <MagnifyingGlass className="w-5 h-5 text-[#9aa0a6]" />
            </div>
            <input 
              onKeyDown={(e) => e.key === 'Enter' && onNavigate((e.target as HTMLInputElement).value)} 
              className="w-full bg-[#1c1d1f] text-white rounded-full py-4.5 pl-15 pr-6 border border-transparent hover:border-[#1a73e8]/30 focus:bg-[#202124] focus:border-[#1a73e8] outline-none text-[16px] transition-all placeholder-[#9aa0a6] shadow-2xl" 
              placeholder="Search with Google or enter address" 
            />
          </div>
        </div>

        <div className="grid grid-cols-5 gap-y-12 gap-x-10 max-w-[620px] pb-20 px-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
           {[
             { name: 'Wikipedia', url: 'wikipedia.org', color: 'bg-white text-black', char: 'W' },
             { name: 'GitHub', url: 'github.com', color: 'bg-black text-white', char: 'G' },
             { name: 'Google', url: 'google.com', color: 'bg-[#4285F4] text-white', char: 'G' },
             { name: 'Reddit', url: 'reddit.com', color: 'bg-[#FF4500] text-white', char: 'R' },
             { name: 'Settings', url: 'chrome://settings', color: 'bg-gray-500 text-white', char: 'S' },
             { name: 'YouTube', url: 'youtube.com', color: 'bg-[#FF0000] text-white', char: 'Y' },
             { name: 'Netflix', url: 'netflix.com', color: 'bg-[#E50914] text-white', char: 'N' },
             { name: 'Vercel', url: 'vercel.com', color: 'bg-black text-white', char: 'V' }
           ].map((site) => (
             <div key={site.url} className="flex flex-col items-center group cursor-pointer" onClick={() => onNavigate(site.url)}>
               <div className={`w-15 h-15 ${site.color} rounded-full flex items-center justify-center text-2xl font-bold shadow-lg transform group-hover:scale-110 group-hover:shadow-[#1a73e8]/40 transition-all duration-300`}>
                 {site.char}
               </div>
               <span className="mt-4 text-[12px] font-medium text-[#e8eaed] group-hover:text-[#1a73e8] truncate max-w-[90px] text-center transition-colors">{site.name}</span>
             </div>
           ))}
           <div className="flex flex-col items-center group cursor-pointer" onClick={() => onNavigate('chrome://settings')}>
             <div className="w-15 h-15 bg-[#1c1d1f] hover:bg-[#252629] border border-[#2d2e31] rounded-full flex items-center justify-center transition-all group-hover:border-[#1a73e8] group-hover:shadow-lg">
               <PlusIcon className="w-6 h-6 text-[#9aa0a6] group-hover:text-[#1a73e8]" />
             </div>
             <span className="mt-4 text-[12px] font-medium text-[#e8eaed] text-center group-hover:text-[#1a73e8] transition-colors">Customize</span>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-white overflow-hidden relative">
      <iframe 
        ref={iframeRef} 
        srcDoc={content.htmlContent} 
        className="w-full h-full border-none bg-white" 
        title="Chromium Tab Content" 
        sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin" 
      />
      
      {/* Real-time Data Badge */}
      {content.metadata?.sources?.length > 0 && (
        <div className="absolute bottom-6 right-6 z-50 group">
          <div className="bg-[#1c1d1f] text-white rounded-full px-4 py-2 border border-[#2d2e31] shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center gap-3 cursor-default hover:border-[#1a73e8] transition-all">
            <ShieldCheckIcon className="w-4 h-4 text-[#1a73e8]" />
            <span className="text-[10px] font-bold tracking-widest uppercase">Verified Render</span>
            <div className="hidden group-hover:block absolute bottom-full right-0 mb-4 w-72 bg-[#1c1d1f] border border-[#2d2e31] rounded-2xl p-4 shadow-2xl animate-slide-up backdrop-blur-xl">
              <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-3 border-b border-white/5 pb-2">Grounding Pipeline</h4>
              <div className="space-y-3">
                {content.metadata.sources.map((src, i) => (
                  <a key={i} href={src.uri} target="_blank" rel="noopener noreferrer" className="block text-[11px] text-[#1a73e8] hover:text-[#4285f4] truncate transition-colors">
                    {i + 1}. {src.title}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {devToolsOpen && (
        <div className="h-[320px] border-t border-[#2d2e31] bg-[#0e0f11] text-[#e8eaed] flex flex-col font-mono text-[11px] z-[999]">
          <div className="flex bg-[#1c1d1f] border-b border-[#2d2e31] items-center">
            <div className="flex-1 flex">
              {['console', 'elements', 'network', 'sources', 'performance'].map(tab => (
                <button key={tab} onClick={() => setActiveDevTab(tab as any)} className={`px-4 py-2.5 uppercase text-[10px] font-bold transition-all ${activeDevTab === tab ? 'bg-[#292a2d] text-[#1a73e8] border-b-2 border-[#1a73e8]' : 'text-gray-500 hover:text-white'}`}>{tab}</button>
              ))}
            </div>
            <button onClick={() => setActiveDevTab('console')} className="p-2 text-gray-500 hover:text-white"><XIcon className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#1c1d1f]">
             <div className="flex gap-3"><span className="text-[#1a73e8] font-bold">[ENGINE]</span><span>Chromium 130.0.0.0 initializing...</span></div>
             <div className="flex gap-3 text-blue-400"><span>[NET]</span><span>GET {currentUrl} - STATUS: 200 OK (CACHED)</span></div>
             <div className="flex gap-3 text-green-400"><span>[DOM]</span><span>Parsing AI-generated HTML stream... Success.</span></div>
             <div className="flex gap-3 text-yellow-500"><span>[WARN]</span><span>Mixed content detected but upgraded to HTTPS.</span></div>
             <div className="flex gap-3 text-gray-500 italic"><span>[INFO]</span><span>Grounding active: {content.metadata?.sources?.length || 0} external nodes used for synthesis.</span></div>
             <div className="pt-2 border-t border-white/5">
                <span className="text-gray-500">&gt; </span>
                <input className="bg-transparent outline-none w-full text-white" placeholder="Run JavaScript..." />
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowserContent;