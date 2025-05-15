import express from 'express';
const router = express.Router();

import path from 'path';

// routes for html pages (404, index, etc.)
router.get(['/', '/index', '/index.html'], (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'index.html'));
});

export default router;