const express = require('express');
const router = express.Router();
const { listResources, searchResources } = require('../controllers/resourceController');

router.get('/', listResources);
router.get('/search', searchResources);

module.exports = router;
