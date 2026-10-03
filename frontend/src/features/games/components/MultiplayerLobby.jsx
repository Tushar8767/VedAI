import React, { useState } from 'react';
import { Users, Crown, CheckCircle2, Clock, Copy, Check, Play, LogOut } from 'lucide-react';

/**
 * MultiplayerLobby handles room state, player list, readying up,
 * and synchronized countdown before game launch.
 */
export default function MultiplayerLobby({
  roomState,
  currentUserId,
  onToggleReady,
  onStartGame,
  onLeaveRoom
}) {
  const [copied, setCopied] = useState(false);

  if (!roomState) return null;

  const {
    roomCode,
    gameType,
    players = [],
    hostId,
    countdown,
    status
  } = roomState;

  const isHost = currentUserId === hostId;
  const currentPlayer = players.find(p => p.id === currentUserId);
  const isReady = currentPlayer?.isReady || false;
  const canStart = isHost && players.length >= 2 && players.every(p => p.isReady || p.id === hostId);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/games?room=${roomCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative max-w-xl mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-xl">
      {/* Synchronized Countdown Overlay */}
      {status === 'countdown' && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 rounded-2xl flex flex-col items-center justify-center text-white">
          <div className="text-xl font-medium mb-3 text-emerald-400">Match Starting in</div>
          <div className="text-8xl font-black animate-ping duration-1000 text-white">
            {countdown > 0 ? countdown : 'GO!'}
          </div>
        </div>
      )}

      {/* Lobby Header */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4 mb-5">
        <div>
          <div className="text-xs uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400">
            Multiplayer Room
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
            {gameType.replace('-', ' ')}
          </h2>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
          <span className="text-xs text-gray-500 font-medium">Code:</span>
          <span className="font-mono font-bold text-lg text-emerald-600 dark:text-emerald-400">{roomCode}</span>
          <button
            onClick={handleCopyLink}
            aria-label="Copy Invite Link"
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Players List */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            Participants ({players.length}/8)
          </span>
          <span>Status</span>
        </div>

        <div className="space-y-2.5">
          {players.map((p) => {
            const isMe = p.id === currentUserId;
            const isPlayerHost = p.id === hostId;

            return (
              <div
                key={p.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  isMe
                    ? 'border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/20'
                    : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 font-medium text-gray-900 dark:text-white">
                      <span>{p.name}</span>
                      {isMe && <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">(You)</span>}
                      {isPlayerHost && (
                        <Crown className="w-3.5 h-3.5 text-amber-500 ml-1 inline" title="Room Host" />
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  {isPlayerHost ? (
                    <span className="px-2.5 py-1 text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-full">
                      Host
                    </span>
                  ) : p.isReady ? (
                    <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Ready
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 text-xs font-semibold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Waiting
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lobby Controls */}
      <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={onLeaveRoom}
          className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <LogOut className="w-4 h-4" />
          Leave
        </button>

        {!isHost && (
          <button
            onClick={onToggleReady}
            className={`flex-1 py-2.5 px-4 rounded-xl font-medium transition-colors text-sm flex items-center justify-center gap-2 shadow-sm ${
              isReady
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {isReady ? 'Cancel Ready' : 'Ready Up'}
          </button>
        )}

        {isHost && (
          <button
            onClick={onStartGame}
            disabled={!canStart}
            className={`flex-1 py-2.5 px-4 rounded-xl font-medium transition-all text-sm flex items-center justify-center gap-2 shadow-sm ${
              canStart
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            <Play className="w-4 h-4" />
            {players.length < 2
              ? 'Waiting for players (min 2)...'
              : !players.every(p => p.isReady || p.id === hostId)
              ? 'Waiting for all players to ready up...'
              : 'Start Match'}
          </button>
        )}
      </div>
    </div>
  );
}
