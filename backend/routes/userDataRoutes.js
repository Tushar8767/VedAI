const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const journalController = require("../controllers/journalController");
const { getDashboard, getHistory, deleteHistory } = require("../controllers/dashboardController");

const router = express.Router();

router.get("/api/v1/dashboard", requireAuth, getDashboard);
router.get("/api/v1/history", requireAuth, getHistory);
router.delete("/api/v1/history", requireAuth, deleteHistory);
router.get("/api/v1/journal", requireAuth, journalController.list);
router.post("/api/v1/journal", requireAuth, journalController.create);
router.put("/api/v1/journal/:id", requireAuth, journalController.update);
router.delete("/api/v1/journal/:id", requireAuth, journalController.remove);

module.exports = router;
