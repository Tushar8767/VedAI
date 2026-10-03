import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Compass, 
  BookOpen, 
  Sparkles, 
  Feather, 
  FileText,
  Activity, 
  Video, 
  Settings, 
  User, 
  LogIn,
  Gamepad2,
  Moon,
  Sun,
  ChevronDown
} from 'lucide-react';

export const Navbar = ({ currentTab, setTab, onOpenAuth }) => {
  const { user, isGuest, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setWorkspaceOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Primary 4 Pillar destinations
  const primaryNav = [
    { id: 'reflect', label: 'Reflect', icon: Sparkles },
    { id: 'gita', label: 'Gita', icon: BookOpen },
    { id: 'practice', label: 'Practice', icon: Feather },
    { id: 'games', label: 'Games', icon: Gamepad2 },
  ];

  // Secondary personal workspace items consolidated into "My Space" dropdown
  const workspaceItems = [
    { id: 'journal', label: 'Journal', icon: BookOpen, desc: 'Personal reflections & logs' },
    { id: 'notes', label: 'Notes', icon: FileText, desc: 'Saved thoughts & verses' },
    { id: 'journey', label: 'My Journey', icon: Activity, desc: 'Activity analytics & growth' },
    { id: 'resources', label: 'Resources', icon: Video, desc: 'Contemplative media & guides' },
  ];

  const isWorkspaceActive = workspaceItems.some((item) => item.id === currentTab);

  return (
    <header 
      style={{ backgroundColor: isDark ? 'rgba(22, 20, 18, 0.98)' : 'rgba(250, 248, 245, 0.98)' }}
      className="sticky top-0 z-40 backdrop-blur-md border-b border-[#E8E1D5] dark:border-[#383127] transition-colors duration-200"
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Brand (Acts as Home) */}
        <button 
          onClick={() => setTab('home')}
          className="flex items-center gap-2.5 text-left focus:outline-none group"
          title="Go to VedAI Home"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-700/10 dark:bg-amber-500/20 flex items-center justify-center text-amber-800 dark:text-amber-400 font-serif text-xl group-hover:bg-amber-700/20 transition">
            🕉️
          </div>
          <div>
            <span className="font-serif font-semibold text-lg tracking-wide text-[#2C241B] dark:text-[#F5F5F4]">
              Ved<span className="text-amber-700 dark:text-amber-400 font-normal">AI</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs text-amber-900/60 dark:text-amber-400/80 uppercase tracking-widest font-mono">
              2.0
            </span>
          </div>
        </button>

        {/* Streamlined Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5">
          {primaryNav.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-amber-800/10 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 font-semibold shadow-xs'
                    : 'text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/50 dark:hover:bg-stone-800/60'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-amber-800 dark:text-amber-400' : 'text-stone-400 dark:text-stone-500'} />
                {item.label}
              </button>
            );
          })}

          {/* Consolidated "My Space" Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setWorkspaceOpen(!workspaceOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition ${
                isWorkspaceActive
                  ? 'bg-amber-800/10 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 font-semibold shadow-xs'
                  : 'text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/50 dark:hover:bg-stone-800/60'
              }`}
            >
              <Compass size={16} className={isWorkspaceActive ? 'text-amber-800 dark:text-amber-400' : 'text-stone-400 dark:text-stone-500'} />
              <span>My Space</span>
              <ChevronDown 
                size={14} 
                className={`text-stone-400 transition-transform duration-200 ${workspaceOpen ? 'rotate-180 text-amber-800 dark:text-amber-400' : ''}`} 
              />
            </button>

            {/* Dropdown Menu */}
            {workspaceOpen && (
              <div 
                style={{ backgroundColor: isDark ? '#1C1917' : '#FFFFFF' }}
                className="absolute left-0 mt-2 w-56 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
              >
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                  Personal Workspace
                </div>
                {workspaceItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setTab(item.id);
                        setWorkspaceOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-start gap-2.5 transition ${
                        isActive
                          ? 'bg-amber-500/10 text-amber-900 dark:text-amber-300 font-medium'
                          : 'hover:bg-stone-100 dark:hover:bg-stone-800/60 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      <Icon size={16} className={`mt-0.5 shrink-0 ${isActive ? 'text-amber-700 dark:text-amber-400' : 'text-stone-400'}`} />
                      <div>
                        <div className="text-xs font-medium leading-snug">{item.label}</div>
                        <div className="text-[10px] text-stone-500 dark:text-stone-400 leading-tight">{item.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Right Action Icons: Settings, Night Mode, and Auth */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          
          {/* Settings Icon Button */}
          <button
            type="button"
            onClick={() => setTab('settings')}
            aria-label="Settings"
            title="Settings & Preferences"
            className={`p-2 rounded-xl border transition ${
              currentTab === 'settings'
                ? 'border-amber-600 bg-amber-500/10 text-amber-800 dark:text-amber-300'
                : 'border-stone-200 dark:border-stone-800 bg-stone-100/80 dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 hover:bg-stone-200/80 dark:hover:bg-stone-700/80'
            }`}
          >
            <Settings size={16} />
          </button>

          {/* Night / Bright Mode Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to Bright Screen" : "Switch to Night Mode"}
            title={isDark ? "Switch to Bright Screen" : "Switch to Night Mode"}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-100/80 dark:bg-stone-800/80 text-stone-700 dark:text-amber-300 hover:bg-stone-200/80 dark:hover:bg-stone-700/80 transition-all text-xs font-medium shadow-xs"
          >
            {isDark ? (
              <>
                <Sun size={15} className="text-amber-400 transition-transform hover:rotate-45" />
                <span className="hidden sm:inline text-amber-300">Bright</span>
              </>
            ) : (
              <>
                <Moon size={15} className="text-stone-600 hover:text-amber-800 transition-transform hover:-rotate-12" />
                <span className="hidden sm:inline text-stone-700">Night</span>
              </>
            )}
          </button>

          {/* User Status / Auth */}
          {isGuest ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-300/40 dark:border-stone-700">
                Guest
              </span>
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500 text-white transition shadow-xs"
              >
                <LogIn size={13} />
                <span>Sign In</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-stone-800 dark:text-stone-200 flex items-center gap-1">
                <User size={14} className="text-amber-700 dark:text-amber-400" />
                {user?.name?.split(' ')[0] || 'Traveler'}
              </span>
              <button
                onClick={logout}
                className="text-xs text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 ml-1.5 hover:underline"
              >
                Sign out
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Mobile Navigation bar */}
      <div 
        style={{ backgroundColor: isDark ? '#191715' : '#FAF8F5' }}
        className="md:hidden flex items-center justify-around border-t border-[#E8E1D5] dark:border-[#383127] py-2 px-1"
      >
        {[
          { id: 'home', label: 'Home', icon: Compass },
          { id: 'reflect', label: 'Reflect', icon: Sparkles },
          { id: 'gita', label: 'Gita', icon: BookOpen },
          { id: 'practice', label: 'Practice', icon: Feather },
          { id: 'games', label: 'Games', icon: Gamepad2 },
          { id: 'journal', label: 'Journal', icon: BookOpen },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex flex-col items-center gap-0.5 text-[11px] p-1 ${
                isActive ? 'text-amber-800 dark:text-amber-400 font-bold' : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
