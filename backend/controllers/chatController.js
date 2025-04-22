const Message = require('../models/Message');

exports.getGeneralMessages = async (req, res) => {
  try {
    const roomId = req.query.roomId || 'general'; 
    const messages = await Message.find({ room: roomId })
      .populate('sender', 'username')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching messages' });
  }
}

exports.getPrivateMessage = async (req, res) => {
  try {
    const userId = req.user.id; 
    const otherUserId = req.params.userId; 
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId }
      ]
    })
      .populate('sender', 'username')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    console.error('Error fetching private messages:', err);
    res.status(500).json({ message: 'Error fetching private messages' });
  }
}