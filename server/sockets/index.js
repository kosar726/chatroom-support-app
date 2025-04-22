const Message = require('../models/Message');
const Room = require('../models/Room');
const socketAuth = require('../middleware/socketAuth');
const socketEvents = require('./socketEvents'); // ثابت‌های رویدادها

module.exports = (io) => {
  io.use(socketAuth);

  let roomListCache = [];

  const updateRoomListCache = async () => {
    const rooms = await Room.find().select('name');
    roomListCache = rooms.map(room => ({ id: room._id.toString(), name: room.name }));
    io.emit(socketEvents.ROOM_LIST, roomListCache);
  };

  updateRoomListCache();

  io.on('connection', async (socket) => {
    const user = socket.user;

    socket.emit(socketEvents.ROOM_LIST, roomListCache);

    let generalRoom = roomListCache.find(room => room.name === 'general');
    if (!generalRoom) {
      const newGeneralRoom = new Room({
        name: 'general',
        creator: user.id,
      });
      await newGeneralRoom.save();
      await updateRoomListCache();
      generalRoom = roomListCache.find(room => room.name === 'general');
    }

    if (generalRoom) {
      socket.join(generalRoom.id);
      socket.emit(socketEvents.JOINED_ROOM, { roomId: generalRoom.id, roomName: generalRoom.name });
    }

    socket.on(socketEvents.ROOM_CREATED, updateRoomListCache);
    socket.on(socketEvents.ROOM_UPDATED, updateRoomListCache);
    socket.on(socketEvents.ROOM_DELETED, updateRoomListCache);

    socket.on(socketEvents.JOIN_ROOM, async (roomId) => {
      const room = await Room.findById(roomId);
      if (!room) {
        socket.emit(socketEvents.ERROR, { message: 'The room was not found', code: 'ROOM_NOT_FOUND' });
        return;
      }

      const currentRooms = Array.from(socket.rooms).filter(r => r !== socket.id);
      currentRooms.forEach(r => socket.leave(r));

      socket.join(roomId);
      socket.emit(socketEvents.JOINED_ROOM, { roomId, roomName: room.name });
    });

    socket.on(socketEvents.SEND_MESSAGE, async ({ roomId, content }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) {
          socket.emit(socketEvents.ERROR, { message: 'The room was not found', code: 'ROOM_NOT_FOUND' });
          return;
        }

        if (!socket.rooms.has(roomId)) {
          socket.emit(socketEvents.ERROR, { message: 'You are not a member of this room', code: 'NOT_IN_ROOM' });
          return;
        }

        const msg = new Message({
          sender: user.id,
          content,
          room: roomId,
        });
        await msg.save();

        io.to(roomId).emit(socketEvents.NEW_MESSAGE, {
          roomId,
          sender: user.username,
          content,
          createdAt: msg.createdAt,
        });
      } catch (err) {
        socket.emit(socketEvents.ERROR, { message: 'Failed to send message', code: 'MESSAGE_FAILED', details: err.message });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[general] ${user.username} disconnected, reason: ${socket.conn.closeReason || 'unknown'}`);
    });
  });

  const supportNamespace = io.of('/support');
  supportNamespace.use(socketAuth);
  const onlineUsers = {};

  const broadcastOnlineUsers = () => {
    supportNamespace.emit(socketEvents.ONLINE_USERS, onlineUsers);
    Object.entries(onlineUsers).forEach(([userId, userData]) => {
      if (userData.role === 'support') {
        const filteredUsers = { ...onlineUsers };
        delete filteredUsers[userId];
        supportNamespace.to(userData.socketId).emit(socketEvents.ONLINE_USERS, filteredUsers);
      }
    });
  };

  supportNamespace.on('connection', (socket) => {
    const user = socket.user;
    const userId = user.id;
    const isSupport = user.role === 'support';

    const roomName = `private-${userId}`;
    socket.join(roomName);

    onlineUsers[userId] = {
      socketId: socket.id,
      username: user.username,
      role: user.role,
    };

    broadcastOnlineUsers();

    socket.on(socketEvents.GET_ONLINE_USERS, () => {
      if (isSupport) {
        const filteredUsers = { ...onlineUsers };
        delete filteredUsers[userId];
        socket.emit(socketEvents.ONLINE_USERS, filteredUsers);
      } else {
        socket.emit(socketEvents.ONLINE_USERS, onlineUsers);
      }
    });

    socket.on(socketEvents.PRIVATE_MESSAGE, async ({ to, content }) => {
      const roomName = `private-${to}`;
      try {
        const msg = new Message({
          sender: userId,
          receiver: to,
          content,
          room: roomName,
        });
        await msg.save();

        supportNamespace.to(roomName).emit(socketEvents.NEW_PRIVATE_MESSAGE, {
          sender: user.username,
          senderId: userId,
          content,
          createdAt: msg.createdAt,
        });
      } catch (err) {
        socket.emit(socketEvents.ERROR, {
          message: 'Error in sending private message',
          code: 'PRIVATE_MESSAGE_FAILED',
          details: err.message,
        });
      }
    });

    socket.on('disconnect', () => {
      delete onlineUsers[userId];
      broadcastOnlineUsers();
    });
  });
};