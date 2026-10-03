import React from 'react';
import { Trophy, Clock, RotateCcw, Medal } from 'lucide-react';

/**
 * MultiplayerLeaderboard renders live progress across all players during match
 * and final verified podium/rankings upon round completion.
 */
export default function MultiplayerLeaderboard({
  players = [],
  finalLeaderboard = null,
  currentUserId,
  onVoteRematch,
  rematchVotes = []
}) {
  const hasFinished = Boolean(finalLeaderboard && finalLeaderboard.length > 0);
  const userVotedRematch = rematchVotes.includes(currentUserId);

  const formatSecs = (s) => {
    if (s === null || s === undefined) return '--';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  if (!hasFinished) {
    // Live In-Game Progress Strip
    return (
      <div className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3.5 mb-6 shadow-xs">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2.5">
          <span>Live Match Progress</span>
          <span>{players.length} Competitors</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {players.map((p) => {
            const isMe = p.id === currentUserId;
            const progress = Math.min(100, Math.max(0, p.progress || 0));

            return (
              <div
                key={p.id}
                className={`p-2.5 rounded-lg border text-xs ${
                  isMe
                    ? 'border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/20'
                    : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-850'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5 font-medium">
                  <span className="truncate max-w-[120px] text-gray-800 dark:text-gray-200">
                    {p.name} {isMe && '(You)'}
                  </span>
                  <span className="tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                    {progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Final Results Leaderboard
  return (
    <div className="w-full max-w-lg mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-xl mb-6">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-500 mx-auto flex items-center justify-center mb-2 shadow-inner">
          <Trophy className="w-6 h-6" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Match Leaderboard</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">Server verified finish order</p>
      </div>

      <div className="space-y-2 mb-6">
        {finalLeaderboard.map((entry, index) => {
          const isMe = entry.id === currentUserId;
          const rank = index + 1;

          let rankBadge = (
            <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 font-bold text-xs flex items-center justify-center text-gray-600 dark:text-gray-300">
              #{rank}
            </span>
          );
          if (rank === 1) {
            rankBadge = (
              <span className="w-6 h-6 rounded-full bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center shadow-xs">
                1
              </span>
            );
          } else if (rank === 2) {
            rankBadge = (
              <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center">
                2
              </span>
            );
          } else if (rank === 3) {
            rankBadge = (
              <span className="w-6 h-6 rounded-full bg-amber-700/60 text-white font-bold text-xs flex items-center justify-center">
                3
              </span>
            );
          }

          return (
            <div
              key={entry.id || index}
              className={`flex items-center justify-between p-3 rounded-xl border text-sm ${
                isMe
                  ? 'border-emerald-500/50 bg-emerald-50/40 dark:bg-emerald-950/20'
                  : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40'
              }`}
            >
              <div className="flex items-center gap-3">
                {rankBadge}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {entry.name} {isMe && <span className="text-xs text-emerald-600 font-normal">(You)</span>}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 tabular-nums font-mono">
                <span className="flex items-center gap-1 font-semibold text-gray-900 dark:text-white">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  {formatSecs(entry.timeElapsed)}
                </span>
                <span>• {entry.score || 0} pts</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rematch Voting */}
      {onVoteRematch && (
        <div className="pt-4 border-t border-gray-100 dark:border-gray-800 text-center">
          <button
            onClick={onVoteRematch}
            className={`w-full py-2.5 px-4 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-xs ${
              userVotedRematch
                ? 'bg-amber-600 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            {userVotedRematch
              ? `Rematch Voted (${rematchVotes.length}/${players.length})`
              : `Vote Rematch (${rematchVotes.length}/${players.length})`}
          </button>
        </div>
      )}
    </div>
  );
}
