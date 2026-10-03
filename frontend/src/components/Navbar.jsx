import React from 'react';
import { useAuth } from '../context/AuthContext';
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
  Gamepad2
} from 'lucide-react';

export const Navbar = ({ currentTab, setTab, onOpenAuth }) => {
  const { user, isGuest, logout } = useAuth();

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
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E8E1D5]">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <button 
          onClick={() => setTab('home')}
          className="flex items-center gap-2.5 text-left focus:outline-none group"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-700/10 flex items-center justify-center text-amber-800 font-serif text-xl group-hover:bg-amber-700/20 transition">
            🕉️
          </div>
          <div>
            <span className="font-serif font-semibold text-lg tracking-wide text-[#3A3026]">
              Ved<span className="text-amber-700 font-normal">AI</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs text-amber-900/60 uppercase tracking-widest font-mono">
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
                    ? 'bg-amber-800/10 text-amber-900 font-semibold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-amber-800' : 'text-stone-400'} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User / Guest Status */}
        <div className="flex items-center gap-3">
          {isGuest ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-200/70 text-stone-600">
                Guest Mode
              </span>
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-700 text-white hover:bg-amber-800 transition shadow-sm"
              >
                <LogIn size={14} />
                Sign In
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-stone-700 flex items-center gap-1">
                <User size={14} className="text-amber-700" />
                {user?.name?.split(' ')[0] || 'Traveler'}
              </span>
              <button
                onClick={logout}
                className="text-xs text-stone-500 hover:text-stone-800 ml-2 hover:underline"
              >
                Sign out
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Mobile Navigation bar */}
      <div className="md:hidden flex items-center justify-around border-t border-[#E8E1D5] py-2 px-1 bg-[#FAF8F5]">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex flex-col items-center gap-0.5 text-xs p-1 ${
                isActive ? 'text-amber-800 font-bold' : 'text-stone-500'
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
