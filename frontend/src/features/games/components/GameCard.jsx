import React from 'react';
import { Play, Users, Clock, Sparkles } from 'lucide-react';

/**
 * GameCard renders an individual game item in the catalog.
 */
export default function GameCard({
  id,
  title,
  category,
  description,
  difficulty = 'Casual',
  duration = '3-5 min',
  icon: Icon,
  badgeColor = 'emerald',
  multiplayer = true,
  onPlaySolo,
  onPlayMultiplayer
}) {
  const badgeClasses = {
    emerald: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    blue: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    purple: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    amber: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    rose: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
  }[badgeColor] || 'bg-gray-100 text-gray-700 border-gray-200';

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200/90 dark:border-gray-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white group-hover:scale-105 transition-transform">
            {Icon ? <Icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" /> : <Sparkles className="w-6 h-6 text-emerald-500" />}
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${badgeClasses}`}>
            {category}
          </span>
        </div>

        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {title}
        </h3>

        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 leading-relaxed">
          {description}
        </p>

        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mb-5">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {duration}
          </span>
          <span>•</span>
          <span>{difficulty}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={() => onPlaySolo(id)}
          className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Play Solo</span>
        </button>

        {multiplayer && (
          <button
            onClick={() => onPlayMultiplayer(id)}
            className="py-2 px-3 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            title="Create multiplayer room"
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Room</span>
          </button>
        )}
      </div>
    </div>
  );
}
