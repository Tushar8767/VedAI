const GameResult = require('../models/GameResult');
const { FileCollection } = require('./fileStore');
const { getDBStatus } = require('../config/db');

const fileGameResults = new FileCollection('game_results');

const gameRepository = {
  async create(resultData) {
    if (getDBStatus().connected) {
      return await GameResult.create(resultData);
    }
    return fileGameResults.create({
      ...resultData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  },

  async findByUser(userId, filter = {}) {
    const limit = Math.min(parseInt(filter.limit || 50, 10), 100);
    const skip = parseInt(filter.skip || 0, 10);

    if (getDBStatus().connected) {
      const query = { userId };
      if (filter.gameType) query.gameType = filter.gameType;
      return await GameResult.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    }

    let results = fileGameResults.find(r => String(r.userId) === String(userId));
    if (filter.gameType) {
      results = results.filter(r => r.gameType === filter.gameType);
    }
    return results
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(skip, skip + limit);
  },

  async countByUser(userId, filter = {}) {
    if (getDBStatus().connected) {
      const query = { userId };
      if (filter.gameType) query.gameType = filter.gameType;
      return await GameResult.countDocuments(query);
    }

    let results = fileGameResults.find(r => String(r.userId) === String(userId));
    if (filter.gameType) {
      results = results.filter(r => r.gameType === filter.gameType);
    }
    return results.length;
  },

  async getStatsByUser(userId) {
    const all = await this.findByUser(userId, { limit: 500 });
    const statsByGame = {};
    let totalSessions = 0;
    let totalPlayTimeSeconds = 0;

    for (const r of all) {
      totalSessions++;
      totalPlayTimeSeconds += (r.durationSeconds || 0);
      if (!statsByGame[r.gameType]) {
        statsByGame[r.gameType] = {
          sessions: 0,
          totalScore: 0,
          bestScore: 0,
          bestTimeSeconds: null,
          completedCount: 0
        };
      }
      const g = statsByGame[r.gameType];
      g.sessions++;
      if (r.completed) g.completedCount++;
      const score = r.resultSummary?.score || 0;
      g.totalScore += score;
      if (score > g.bestScore) g.bestScore = score;
      if (r.completed && (g.bestTimeSeconds === null || r.durationSeconds < g.bestTimeSeconds)) {
        g.bestTimeSeconds = r.durationSeconds;
      }
    }

    return {
      totalSessions,
      totalPlayTimeSeconds,
      statsByGame,
      disclaimer: 'Personal focus and engagement practice statistics. Not a measure of cognitive capacity or intelligence.'
    };
  },

  async deleteByUser(userId) {
    if (getDBStatus().connected) {
      const res = await GameResult.deleteMany({ userId });
      return res.deletedCount;
    }
    const userRecords = fileGameResults.find(r => String(r.userId) === String(userId));
    for (const rec of userRecords) {
      fileGameResults.findByIdAndDelete(rec._id);
    }
    return userRecords.length;
  }
};

module.exports = gameRepository;
