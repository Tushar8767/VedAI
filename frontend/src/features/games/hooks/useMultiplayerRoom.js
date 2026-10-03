/**
 * VedAI 2.0 — Multiplayer Room Client Hook
 * 
 * Synchronizes room state, player ready status, live progress, and leaderboard via WebSockets.
 */

import { useState, useEffect, useCallback } from 'react';
import { socketService } from '../services/socketService';

export function useMultiplayerRoom() {
  const [room, setRoom] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    socketService.connect();

    const unsubs = [
      socketService.on('SOCKET_CONNECTED', () => setIsConnected(true)),
      socketService.on('SOCKET_DISCONNECTED', () => setIsConnected(false)),
      socketService.on('CONNECTED', (data) => setCurrentUser(data.user)),
      socketService.on('ROOM_CREATED', (data) => {
        setRoom(data.room);
        setError('');
      }),
      socketService.on('ROOM_JOINED', (data) => {
        setRoom(data.room);
        setError('');
      }),
      socketService.on('PLAYER_JOINED', (data) => {
        setRoom(data.room);
      }),
      socketService.on('PLAYER_LEFT', (data) => {
        setRoom(data.room);
      }),
      socketService.on('PLAYER_READY_CHANGED', (data) => {
        setRoom(data.room);
      }),
      socketService.on('GAME_STARTED', (data) => {
        setRoom(data.room);
        setIsStarting(false);
      }),
      socketService.on('PROGRESS_UPDATED', (data) => {
        setRoom((prev) => {
          if (!prev) return null;
          const updatedPlayers = prev.players.map((p) =>
            p.id === data.userId ? { ...p, progress: data.progress, score: data.score } : p
          );
          return { ...prev, players: updatedPlayers };
        });
      }),
      socketService.on('PLAYER_FINISHED', (data) => {
        setRoom(data.room);
      }),
      socketService.on('REMATCH_UPDATE', (data) => {
        setRoom(data.room);
      }),
      socketService.on('JOIN_ERROR', (data) => setError(data.message)),
      socketService.on('START_ERROR', (data) => setError(data.message)),
      socketService.on('ERROR', (data) => setError(data.message))
    ];

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, []);

  const createRoom = useCallback((gameType = 'reaction_focus', config = {}) => {
    setError('');
    socketService.send('CREATE_ROOM', { gameType, config });
  }, []);

  const joinRoom = useCallback((roomCode) => {
    setError('');
    socketService.send('JOIN_ROOM', { roomCode: roomCode.toUpperCase().trim() });
  }, []);

  const setReady = useCallback((isReady) => {
    socketService.send('SET_READY', { isReady });
  }, []);

  const startGame = useCallback(() => {
    setIsStarting(true);
    socketService.send('START_GAME', {});
  }, []);

  const sendProgress = useCallback((progress, score) => {
    socketService.send('UPDATE_PROGRESS', { progress, score });
  }, []);

  const sendFinish = useCallback((resultSummary = {}) => {
    socketService.send('SUBMIT_FINISH', { resultSummary, score: resultSummary.score });
  }, []);

  const voteRematch = useCallback(() => {
    socketService.send('VOTE_REMATCH', {});
  }, []);

  const leaveRoom = useCallback(() => {
    socketService.send('LEAVE_ROOM', {});
    setRoom(null);
  }, []);

  const isHost = Boolean(room && currentUser && room.hostId === currentUser.id);

  return {
    room,
    currentUser,
    isConnected,
    isHost,
    isStarting,
    error,
    createRoom,
    joinRoom,
    setReady,
    startGame,
    sendProgress,
    sendFinish,
    finishGame: sendFinish,
    voteRematch,
    leaveRoom
  };
}

export default useMultiplayerRoom;
