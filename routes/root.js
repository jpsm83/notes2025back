const express = require('express');
const router = express.Router();
const path = require('path');

// routes for html pages (404, index, etc.)
router.get(['/', '/index', '/index.html'], (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'index.html'));
});

module.exports = router;