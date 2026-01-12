const express = require("express");
const { processUserInput } = require("../controllers/processController");

const router = express.Router();

router.post("/process", processUserInput);

module.exports = router;
