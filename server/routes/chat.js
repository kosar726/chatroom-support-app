const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/general', authMiddleware, chatController.getGeneralMessages);

router.get('/private/:userId', authMiddleware, chatController.getPrivateMessage);

module.exports = router;
