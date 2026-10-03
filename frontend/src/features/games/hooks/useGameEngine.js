/**
 * VedAI 2.0 — Reusable Game Engine Hook
 * 
 * Manages game lifecycle states (IDLE, PLAYING, PAUSED, FINISHED),
 * timer calculation, move tracking, offline persistence, and factual results.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { gameStorageService } from '../services/gameStorageService';
import { gameApiService } from '../services/gameApiService';

export const GAME_STATES = {
  IDLE: 'IDLE',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  FINISHED: 'FINISHED'
};

export function useGameEngine({
  gameType,
  difficulty = 'standard',
  onFinish = null
}) {
  const [gameState, setGameState] = useState(GAME_STATES.IDLE);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [score, setScore] = useState(0);
  const [movesCount, setMovesCount] = useState(0);
  const [resultSummary, setResultSummary] = useState(null);

  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const pausedAtRef = useRef(null);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const start = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setElapsedSeconds(0);
    setScore(0);
    setMovesCount(0);
    setResultSummary(null);
    setGameState(GAME_STATES.PLAYING);
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  }, []);

  const pause = useCallback(() => {
    if (gameState !== GAME_STATES.PLAYING) return;
    if (timerRef.current) clearInterval(timerRef.current);
    pausedAtRef.current = Date.now();
    setGameState(GAME_STATES.PAUSED);
  }, [gameState]);

  const resume = useCallback(() => {
    if (gameState !== GAME_STATES.PAUSED) return;
    setGameState(GAME_STATES.PLAYING);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  }, [gameState]);

  const restart = useCallback(() => {
    start();
  }, [start]);

  const incrementMoves = useCallback(() => {
    setMovesCount((prev) => prev + 1);
  }, []);

  const addScore = useCallback((amount) => {
    setScore((prev) => prev + amount);
  }, []);

  const finish = useCallback(async (summary = {}) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState(GAME_STATES.FINISHED);

    const finalSummary = {
      score: summary.score !== undefined ? summary.score : score,
      durationSeconds: elapsedSeconds,
      movesCount: summary.movesCount !== undefined ? summary.movesCount : movesCount,
      attempts: summary.attempts || 1,
      correctAnswers: summary.correctAnswers || 0,
      incorrectAnswers: summary.incorrectAnswers || 0,
      level: summary.level || 1,
      accuracy: summary.accuracy !== undefined
        ? summary.accuracy
        : summary.totalQuestions
        ? Math.round((summary.correctAnswers / summary.totalQuestions) * 100)
        : null,
      ...summary,
      metadata: summary.metadata || {}
    };

    setResultSummary(finalSummary);

    // 1. Offline-first IndexedDB save
    const sessionRecord = {
      gameType,
      difficulty,
      completed: true,
      durationSeconds: elapsedSeconds,
      resultSummary: finalSummary
    };

    await gameStorageService.saveSession(sessionRecord);

    // 2. Background sync to backend if online and authenticated
    gameApiService.saveResult(sessionRecord).then((res) => {
      if (res?.success) {
        gameStorageService.saveSession({ ...sessionRecord, synced: true });
      }
    }).catch(() => {
      // Graceful offline behavior
    });

    if (onFinish) {
      onFinish(finalSummary);
    }
  }, [elapsedSeconds, score, movesCount, gameType, difficulty, onFinish]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return {
    // Canonical state
    gameState,
    status: gameState.toLowerCase(),
    elapsedSeconds,
    timer: elapsedSeconds,
    formattedTime: formatTime(elapsedSeconds),
    score,
    movesCount,
    moves: movesCount,
    resultSummary,

    // Controls
    start,
    startGame: start,
    pause,
    pauseGame: pause,
    resume,
    resumeGame: resume,
    restart,
    restartGame: restart,
    finish,
    finishGame: finish,
    incrementMoves,
    addScore,
    incrementScore: addScore,
    setScore
  };
}

export default useGameEngine;
