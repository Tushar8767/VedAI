import React from 'react';
import { Trophy, Clock, CheckCircle2, RotateCcw, ArrowLeft, ShieldAlert } from 'lucide-react';

/**
 * GameResultModal presents factual end-of-game statistics.
 * Strictly enforces non-diagnostic messaging and neutral wording.
 */
export default function GameResultModal({
  isOpen,
  title,
  duration,
  score,
  moves,
  accuracy,
  extraMetrics = [],
  onPlayAgain,
  onExit
}) {
  if (!isOpen) return null;

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}m ${rem}s`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Session Completed</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{title}</p>
        </div>

        {/* Factual Performance Summary */}
        <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4 mb-5 border border-gray-100 dark:border-gray-800 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-600" />
              Elapsed Time
            </span>
            <span className="font-semibold text-gray-900 dark:text-white tabular-nums">
              {formatTime(duration || 0)}
            </span>
          </div>

          {score !== undefined && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-500" />
                Score Achieved
              </span>
              <span className="font-semibold text-gray-900 dark:text-white tabular-nums">
                {score}
              </span>
            </div>
          )}

          {moves !== undefined && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Total Moves</span>
              <span className="font-semibold text-gray-900 dark:text-white tabular-nums">
                {moves}
              </span>
            </div>
          )}

          {accuracy !== undefined && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Accuracy</span>
              <span className="font-semibold text-gray-900 dark:text-white tabular-nums">
                {typeof accuracy === 'number' ? `${Math.round(accuracy * 100)}%` : accuracy}
              </span>
            </div>
          )}

          {extraMetrics.map((metric, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">{metric.label}</span>
              <span className="font-semibold text-gray-900 dark:text-white tabular-nums">
                {metric.value}
              </span>
            </div>
          ))}
        </div>

        {/* Explicit Non-Diagnostic Banner */}
        <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/50 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-300 mb-6 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p>
            <strong>Cognitive Disclaimer:</strong> Game statistics are factual practice measurements for entertainment and focus training. They do not evaluate clinical memory, intelligence quotient, or psychological wellbeing.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onExit}
            className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Games Menu</span>
          </button>
          <button
            onClick={onPlayAgain}
            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors shadow-sm flex items-center justify-center gap-2 text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </button>
        </div>
      </div>
    </div>
  );
}
