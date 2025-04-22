const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const auth = require('../middleware/authMiddleware');

router.post("/", auth, roomController.createRoom);

router.put("/:id", auth, roomController.editRoom);

router.delete("/:id", auth, roomController.deleteRoom);

router.get("/", roomController.getRooms);

module.exports = router;