import React from 'react';
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
  Sun
} from 'lucide-react';

export const Navbar = ({ currentTab, setTab, onOpenAuth }) => {
  const { user, isGuest, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  const navItems = [
    { id: 'home', label: 'Home', icon: Compass },
    { id: 'reflect', label: 'Reflect', icon: Sparkles },
    { id: 'gita', label: 'Gita', icon: BookOpen },
    { id: 'practice', label: 'Practice', icon: Feather },
    { id: 'games', label: 'Games', icon: Gamepad2 },
    { id: 'journal', label: 'Journal', icon: BookOpen },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'journey', label: 'My Journey', icon: Activity },
    { id: 'resources', label: 'Resources', icon: Video },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header 
      style={{ backgroundColor: isDark ? 'rgba(25, 23, 21, 0.98)' : 'rgba(250, 248, 245, 0.98)' }}
      className="sticky top-0 z-40 backdrop-blur-md border-b border-[#E8E1D5] dark:border-[#383127] transition-colors duration-200"
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <button 
          onClick={() => setTab('home')}
          className="flex items-center gap-2.5 text-left focus:outline-none group"
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

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-amber-800/10 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 font-semibold shadow-xs'
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/50 dark:hover:bg-stone-800/60'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-amber-800 dark:text-amber-400' : 'text-stone-400 dark:text-stone-500'} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Theme Toggle & User Status */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          
          {/* Night / Bright Mode Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to Bright Screen" : "Switch to Night Mode"}
            title={isDark ? "Switch to Bright Screen" : "Switch to Night Mode"}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700/80 bg-stone-100/90 dark:bg-stone-800/80 text-stone-700 dark:text-amber-300 hover:bg-stone-200/80 dark:hover:bg-stone-700/80 transition-all text-xs font-medium shadow-xs"
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

          {isGuest ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-300/40 dark:border-stone-700">
                Guest
              </span>
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500 text-white transition shadow-sm"
              >
                <LogIn size={14} />
                Sign In
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
                className="text-xs text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 ml-2 hover:underline"
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
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex flex-col items-center gap-0.5 text-xs p-1 ${
                isActive ? 'text-amber-800 dark:text-amber-400 font-bold' : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
