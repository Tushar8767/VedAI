import React from 'react';
import { ArrowLeft, Pause, Play, RotateCcw, Clock, Trophy, HelpCircle } from 'lucide-react';

/**
 * GameContainer provides standard layout, header controls, timer, factual metrics,
 * and pause overlay for all VedAI 2.0 cognitive practice games.
 */
export default function GameContainer({
  title,
  category = 'Cognitive Practice',
  instructions,
  status,
  timer,
  score,
  moves,
  extraStats = [],
  onPause,
  onResume,
  onRestart,
  onBack,
  children
}) {
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Top Bar Navigation & Disclaimer */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              aria-label="Back to Games"
              className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400">
                {category}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">• Factual Practice</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {status === 'playing' && onPause && (
            <button
              onClick={onPause}
              aria-label="Pause game"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
            >
              <Pause className="w-4 h-4" />
              <span>Pause</span>
            </button>
          )}

          {status === 'paused' && onResume && (
            <button
              onClick={onResume}
              aria-label="Resume game"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>Resume</span>
            </button>
          )}

          {onRestart && (
            <button
              onClick={onRestart}
              aria-label="Restart game"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restart</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Time</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
              {formatTime(timer || 0)}
            </div>
          </div>
        </div>

        {score !== undefined && (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Score</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                {score}
              </div>
            </div>
          </div>
        )}

        {moves !== undefined && (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <span className="font-bold text-sm">#</span>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Moves</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                {moves}
              </div>
            </div>
          </div>
        )}

        {extraStats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <span className="font-bold text-sm">{stat.icon || '★'}</span>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                {stat.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Instructions callout */}
      {instructions && (
        <div className="mb-6 p-3.5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-xl flex items-start gap-3 text-sm text-blue-900 dark:text-blue-200">
          <HelpCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>{instructions}</div>
        </div>
      )}

      {/* Main Game Stage with Pause Overlay */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 p-4 sm:p-6 shadow-sm min-h-[380px] flex flex-col justify-center items-center">
        {status === 'paused' && (
          <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center rounded-2xl">
            <div className="text-center p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Game Paused</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Take a breath. Press resume when you are ready to continue.</p>
              <button
                onClick={onResume}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm transition-all"
              >
                Resume Game
              </button>
            </div>
          </div>
        )}

        {children}
      </div>

      {/* Mandatory Non-Diagnostic Disclaimer */}
      <div className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
        Notice: VedAI games are designed for recreation, focus practice, and mental engagement.
        Performance metrics are purely factual and do not constitute cognitive, psychological, or medical evaluations.
      </div>
    </div>
  );
}
