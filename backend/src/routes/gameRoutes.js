const express = require('express');
const router = express.Router();
const {
  saveGameResult,
  getGameHistory,
  getGameStats,
  clearGameHistory,
  validateResult
} = require('../controllers/gameController');
const { protect, optionalAuth } = require('../middleware/auth');
const { roomManager } = require('../multiplayer/RoomManager');

// Authenticated result persistence & stats
router.post('/results', protect, saveGameResult);
router.get('/history', protect, getGameHistory);
router.get('/stats', protect, getGameStats);
router.delete('/history', protect, clearGameHistory);

// Client validation helper
router.post('/validate', optionalAuth, validateResult);

// Check Room Info (HTTP pre-flight before WebSocket connection)
router.get('/rooms/:code', optionalAuth, (req, res) => {
  const room = roomManager.getRoom(req.params.code);
  if (!room) {
    return res.status(404).json({
      success: false,
      errorCode: 'ROOM_NOT_FOUND',
      message: 'Room not found. Please check the room code.'
    });
  }
  return res.json({
    success: true,
    room: {
      code: room.code,
      gameType: room.gameType,
      playersCount: room.players.size,
      maxPlayers: room.maxPlayers,
      status: room.status
    }
  });
});

module.exports = router;
