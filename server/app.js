const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const cors = require('cors');
const socketio = require('socket.io');


require('dotenv').config({path: './config/config.env'});
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const roomRoutes = require('./routes/room');

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/rooms', roomRoutes);

require('./sockets')(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
