# 💬 Chatroom Support App

A real-time support and public chatroom application built with **Socket.IO**, **Node.js**, **Express**, **MongoDB**, and **React**. This app demonstrates how to implement authenticated chat with private messaging between users and support agents, as well as general public chatrooms.

---

## Features

-  **JWT-based authentication**
-  **Private messaging** between users and support agents
-  **Public chatrooms** where users can join rooms
-  **Message persistence** using MongoDB
-  **Support namespace** with real-time online user list and create rooms
-  **Default "general" room** created automatically
-  **Two namespaces**: `/` (public) and `/support` (private)
-  **Socket authentication middleware**
-  Modular structure (controllers, middleware, models, routes, sockets)

---

## Tech Stack

### Backend:
- Node.js (v22.11.0)
- Express.js (REST API)
- MongoDB (via Mongoose)
- JWT for authentication
- Socket.IO for real-time communication

### Frontend:
- React
- Axios

> ⚠️ Note: The frontend was created with the help of an AI assistant. My main focus was on backend development.

---

## Project Structure (Backend)

```
backend/
├── config/
│   └── config.env
├── controllers/
│   ├── authController.js
│   ├── chatController.js
│   └── roomController.js
├── middleware/
│   ├── authMiddleware.js
│   └── socketAuth.js
├── models/
│   ├── Message.js
│   ├── Room.js
│   └── User.js
├── routes/
│   ├── auth.js
│   ├── chat.js
│   └── room.js
├── sockets/
│   ├── index.js
│   └── socketEvents.js
└── app.js
```

---

## Environment Variables

Create a `.env` file inside `server/config/config.env` and add the following:

```
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

---

## How to Run

### Backend:
```bash
cd backend
npm install
npm start
```

### Frontend:
```bash
cd frontend
npm install
npm start
```

By default, the frontend runs on `http://localhost:3001` and the backend server on `http://localhost:3000`.

---

## How It Works

- Upon connection, users are authenticated via a `socket.use()` middleware.
- Users are auto-joined to a **general room**, or they can join custom rooms.
- All messages are saved to MongoDB.
- A separate `/support` namespace allows **support agents** to view and message online users privately.
- Private chats are room-based (e.g., `private-userId`) and messages are also persisted.
- Real-time events include room updates, message delivery, and online user broadcasting.

---

## Goals

The goal of this project was to practice real-time communication using Socket.IO, authentication with JWT, and integration with a persistent database (MongoDB).

---



## Author
https://github.com/kosar726