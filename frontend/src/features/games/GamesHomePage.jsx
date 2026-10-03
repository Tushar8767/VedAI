import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import GameCard from './components/GameCard';
import MultiplayerLobby from './components/MultiplayerLobby';
import MultiplayerLeaderboard from './components/MultiplayerLeaderboard';

// Game Components
import SudokuGame from './games/SudokuGame';
import MemoryMatchGame from './games/MemoryMatchGame';
import NumberSequenceGame from './games/NumberSequenceGame';
import PatternRecognitionGame from './games/PatternRecognitionGame';
import ReactionFocusGame from './games/ReactionFocusGame';
import WordRecallGame from './games/WordRecallGame';
import StroopGame from './games/StroopGame';
import LogicPuzzlesGame from './games/LogicPuzzlesGame';
import MazeGame from './games/MazeGame';

// Services & Hooks
import useMultiplayerRoom from './hooks/useMultiplayerRoom';
import { gameStorage } from './services/gameStorageService';
import { gameApi } from './services/gameApiService';

import {
  Gamepad2,
  Users,
  Clock,
  Sparkles,
  Grid,
  Brain,
  Zap,
  BookOpen,
  Eye,
  Puzzle,
  Navigation,
  CheckCircle2,
  Trash2,
  ShieldAlert,
  ArrowRight,
  Filter
} from 'lucide-react';

const GAMES_CATALOG = [
  {
    id: 'sudoku',
    title: 'Sudoku Grid',
    category: 'Logic',
    badgeColor: 'emerald',
    description: 'Place numbers 1-9 without duplicates in rows, columns, or 3×3 sectors.',
    difficulty: 'Easy / Med',
    duration: '5-10 min',
    icon: Grid,
    component: SudokuGame,
    multiplayer: true
  },
  {
    id: 'memory-match',
    title: 'Memory Match',
    category: 'Memory',
    badgeColor: 'blue',
    description: 'Uncover paired cards by holding spatial memory of previously revealed symbols.',
    difficulty: 'Casual',
    duration: '2-4 min',
    icon: Brain,
    component: MemoryMatchGame,
    multiplayer: true
  },
  {
    id: 'number-sequence',
    title: 'Number Sequences',
    category: 'Logic',
    badgeColor: 'emerald',
    description: 'Discover the arithmetic or geometric sequence rule and complete the chain.',
    difficulty: 'Moderate',
    duration: '3-5 min',
    icon: Sparkles,
    component: NumberSequenceGame,
    multiplayer: true
  },
  {
    id: 'pattern-recognition',
    title: 'Pattern Matrix',
    category: 'Logic',
    badgeColor: 'purple',
    description: 'Solve 3×3 visual rotational transformations and deduce missing shapes.',
    difficulty: 'Moderate',
    duration: '3-5 min',
    icon: Eye,
    component: PatternRecognitionGame,
    multiplayer: true
  },
  {
    id: 'reaction-focus',
    title: 'Focus & Reaction',
    category: 'Focus',
    badgeColor: 'amber',
    description: 'Test visual response speed and sustained alertness under randomized stimuli.',
    difficulty: 'Fast',
    duration: '1-2 min',
    icon: Zap,
    component: ReactionFocusGame,
    multiplayer: true
  },
  {
    id: 'word-recall',
    title: 'Delayed Word Recall',
    category: 'Memory',
    badgeColor: 'blue',
    description: 'Memorize a target word pool, then identify them from a list of distractors.',
    difficulty: 'Moderate',
    duration: '2-3 min',
    icon: BookOpen,
    component: WordRecallGame,
    multiplayer: true
  },
  {
    id: 'stroop-effect',
    title: 'Stroop Focus',
    category: 'Focus',
    badgeColor: 'amber',
    description: 'Name the ink color of the stimulus while suppressing conflicting word reading.',
    difficulty: 'Fast',
    duration: '2 min',
    icon: Sparkles,
    component: StroopGame,
    multiplayer: true
  },
  {
    id: 'logic-puzzles',
    title: 'Deductive Logic',
    category: 'Logic',
    badgeColor: 'purple',
    description: 'Work through premise constraints to determine single logically proven answers.',
    difficulty: 'Challenging',
    duration: '4-7 min',
    icon: Puzzle,
    component: LogicPuzzlesGame,
    multiplayer: true
  },
  {
    id: 'maze-escape',
    title: 'Spatial Maze',
    category: 'Spatial',
    badgeColor: 'rose',
    description: 'Chart an optimal path from the labyrinth entrance to the golden flag.',
    difficulty: 'Casual',
    duration: '2-4 min',
    icon: Navigation,
    component: MazeGame,
    multiplayer: true
  }
];

export function GamesHomePage() {
  const { user, isGuest } = useAuth();

  // Active view state
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'multiplayer' | 'history'
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [activeGameId, setActiveGameId] = useState(null);

  // History state
  const [recentSessions, setRecentSessions] = useState([]);
  const [statsSummary, setStatsSummary] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Multiplayer input state
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [multiplayerDifficulty, setMultiplayerDifficulty] = useState('easy');

  // Multiplayer Hook
  const effectiveUserId = user?.id || user?._id || (isGuest ? (localStorage.getItem('vedai_guest_session_id') || 'guest_user') : 'user');
  const effectiveUserName = user?.name || (isGuest ? 'Guest Traveler' : 'VedAI Seeker');

  const {
    roomState,
    isConnected,
    isHost,
    error: multiplayerError,
    createRoom,
    joinRoom,
    setReady,
    startGame: startMultiplayerMatch,
    sendProgress,
    finishGame: finishMultiplayerGame,
    voteRematch,
    leaveRoom
  } = useMultiplayerRoom({
    userId: effectiveUserId,
    userName: effectiveUserName
  });

  // Check URL query param for room invitation
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam && !roomState) {
        joinRoom(roomParam.toUpperCase());
        setActiveTab('multiplayer');
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, [joinRoom, roomState]);

  // Load history on tab switch
  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      // Try local storage first
      const localSessions = await gameStorage.getSessions(20);
      setRecentSessions(localSessions);

      // Fetch remote stats if available
      const statsRes = await gameApi.getStats();
      if (statsRes.success) {
        setStatsSummary(statsRes.stats);
      }
    } catch (err) {
      console.warn('Error loading game history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear your local game history?')) {
      await gameStorage.clearSessions();
      await gameApi.clearHistory();
      setRecentSessions([]);
      setStatsSummary(null);
    }
  };

  // Launch solo game
  const handlePlaySolo = (gameId) => {
    setActiveGameId(gameId);
  };

  // Create multiplayer room
  const handlePlayMultiplayer = (gameId) => {
    createRoom(gameId, multiplayerDifficulty);
    setActiveTab('multiplayer');
  };

  // Join multiplayer room
  const handleJoinWithCode = (e) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    joinRoom(joinCodeInput.trim().toUpperCase());
    setJoinCodeInput('');
  };

  // If a solo game is active
  if (activeGameId) {
    const gameDef = GAMES_CATALOG.find(g => g.id === activeGameId);
    if (gameDef) {
      const GameComponent = gameDef.component;
      return (
        <div className="py-6">
          <GameComponent
            difficulty="easy"
            onBack={() => {
              setActiveGameId(null);
              loadHistory();
            }}
          />
        </div>
      );
    }
  }

  // If in an active multiplayer match (playing or finished)
  if (roomState && (roomState.status === 'playing' || roomState.status === 'finished')) {
    const gameDef = GAMES_CATALOG.find(g => g.id === roomState.gameType) || GAMES_CATALOG[0];
    const GameComponent = gameDef.component;

    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <MultiplayerLeaderboard
          players={roomState.players}
          finalLeaderboard={roomState.status === 'finished' ? roomState.leaderboard : null}
          currentUserId={effectiveUserId}
          onVoteRematch={voteRematch}
          rematchVotes={roomState.rematchVotes || []}
        />

        {roomState.status === 'playing' && (
          <GameComponent
            difficulty={roomState.difficulty || 'easy'}
            multiplayerMode={true}
            onProgressUpdate={(pct) => sendProgress(pct)}
            onBack={() => {
              leaveRoom();
            }}
          />
        )}
      </div>
    );
  }

  const filteredGames = categoryFilter === 'All'
    ? GAMES_CATALOG
    : GAMES_CATALOG.filter(g => g.category.toLowerCase() === categoryFilter.toLowerCase());

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header Banner */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-3 border border-emerald-200 dark:border-emerald-800">
          <Gamepad2 className="w-4 h-4" />
          <span>Factual Cognitive Practice</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-3">
          Games & Focus Practice
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
          Train attention, working memory, spatial reasoning, and cognitive flexibility with engaging interactive exercises.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-center gap-2 mb-8 border-b border-gray-200 dark:border-gray-800 pb-3">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'catalog'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>Practice Catalog ({GAMES_CATALOG.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('multiplayer')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'multiplayer'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Multiplayer Arena</span>
          {roomState && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'history'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Activity Log</span>
        </button>
      </div>

      {/* Tab 1: Catalog */}
      {activeTab === 'catalog' && (
        <div>
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            {['All', 'Focus', 'Memory', 'Logic', 'Spatial'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  categoryFilter === cat
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Games Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGames.map((game) => (
              <GameCard
                key={game.id}
                id={game.id}
                title={game.title}
                category={game.category}
                badgeColor={game.badgeColor}
                description={game.description}
                difficulty={game.difficulty}
                duration={game.duration}
                icon={game.icon}
                multiplayer={game.multiplayer}
                onPlaySolo={handlePlaySolo}
                onPlayMultiplayer={handlePlayMultiplayer}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Multiplayer Arena */}
      {activeTab === 'multiplayer' && (
        <div className="max-w-2xl mx-auto">
          {roomState ? (
            <MultiplayerLobby
              roomState={roomState}
              currentUserId={effectiveUserId}
              onToggleReady={() => setReady()}
              onStartGame={() => startMultiplayerMatch()}
              onLeaveRoom={() => leaveRoom()}
            />
          ) : (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-3">
                  <Users className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Multiplayer Practice Room</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Synchronous real-time focus competitions with 2 to 8 peers.
                </p>
              </div>

              {multiplayerError && (
                <div className="mb-5 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300">
                  {multiplayerError}
                </div>
              )}

              {/* Join Existing Room Form */}
              <form onSubmit={handleJoinWithCode} className="mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  Enter Room Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value)}
                    placeholder="e.g. VED123"
                    maxLength={10}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-mono text-base uppercase text-gray-900 dark:text-white focus:outline-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <span>Join Room</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* Create New Room Quick Launcher */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                  Or Create a Room For:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {GAMES_CATALOG.filter(g => g.multiplayer).map((g) => (
                    <button
                      key={g.id}
                      onClick={() => handlePlayMultiplayer(g.id)}
                      className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-emerald-500 bg-gray-50 dark:bg-gray-800/40 text-left transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5">
                        <g.icon className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{g.title}</span>
                      </div>
                      <span className="text-xs text-gray-400 group-hover:text-emerald-600 font-medium">Create →</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: History & Data Control */}
      {activeTab === 'history' && (
        <div className="max-w-3xl mx-auto">
          {/* Factual Stats Strip */}
          {statsSummary && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{statsSummary.totalSessions || 0}</div>
                <div className="text-xs text-gray-400 mt-1">Total Sessions</div>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 text-center">
                <div className="text-2xl font-bold text-emerald-600">{Math.round((statsSummary.totalTimePlayed || 0) / 60)} min</div>
                <div className="text-xs text-gray-400 mt-1">Time Practiced</div>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 text-center">
                <div className="text-2xl font-bold text-amber-500">{statsSummary.topScore || 0}</div>
                <div className="text-xs text-gray-400 mt-1">High Score</div>
              </div>
            </div>
          )}

          {/* History List */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Activity Log</h2>
              {recentSessions.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:underline"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear History</span>
                </button>
              )}
            </div>

            {loadingHistory ? (
              <div className="text-center py-8 text-xs text-gray-400">Loading activity history...</div>
            ) : recentSessions.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-400">
                No recorded game sessions yet. Choose a game above to begin practicing!
              </div>
            ) : (
              <div className="space-y-2">
                {recentSessions.map((session, idx) => (
                  <div
                    key={session.id || session._id || idx}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white capitalize">
                        {session.gameType?.replace('-', ' ') || 'Practice Session'}
                      </div>
                      <div className="text-gray-400 mt-0.5">
                        {new Date(session.timestamp).toLocaleDateString()} at {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {session.score || 0} pts
                      </div>
                      <div className="text-gray-400 mt-0.5">
                        {Math.floor(session.duration / 60)}m {session.duration % 60}s • {session.moves || 0} moves
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mandatory Non-Diagnostic Disclaimer */}
      <div className="max-w-2xl mx-auto mt-10 p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
        <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p>
          <strong>Product Disclaimer:</strong> VedAI Cognitive Practice games are provided strictly for entertainment, focus training, memory engagement, and mental recreation. Metrics recorded are factual gameplay parameters and MUST NOT be construed as mental health diagnosis, cognitive status evaluation, IQ measurement, or proof of therapeutic improvement.
        </p>
      </div>
    </div>
  );
}

export default GamesHomePage;
