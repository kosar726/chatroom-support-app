import React, { useState, useEffect, useContext, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { SocketContext } from "../context/SocketContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import OnlineUsers from "./OnlineUsers";
import PrivateChat from "./PrivateChat";
import { FaEdit, FaTrash, FaPaperPlane } from "react-icons/fa";
import Swal from "sweetalert2";
import "../styles/Chat.css";


const MessageItem = ({ msg, user }) => (
  <div
    className={`message ${(msg.sender?.username || msg.sender) === user.username ? "sent" : "received"
      }`}
  >
    {(msg.sender?.username || msg.sender) !== user.username && (
      <span className="sender">{msg.sender?.username || msg.sender}</span>
    )}
    <div className="message-content">
      <span className="text">{msg.content}</span>
      <span className="time">{new Date(msg.createdAt).toLocaleTimeString()}</span>
    </div>
  </div>
);

const Chat = () => {
  const [messages, setMessages] = useState({});
  const [privateMessages, setPrivateMessages] = useState({});
  const [newMessage, setNewMessage] = useState("");
  const [tab, setTab] = useState("general");
  const [selectedUser, setSelectedUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [theme] = useState("dark");
  const [newRoomName, setNewRoomName] = useState("");
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [notifications, setNotifications] = useState({});
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [editRoomName, setEditRoomName] = useState("");
  const { user, token, logout, isAuthLoading } = useContext(AuthContext);
  const { generalSocket, supportSocket } = useContext(SocketContext);
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState(null);
  const messagesEndRef = useRef(null); // برای اسکرول خودکار

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user || !token) {
      console.log("No user or token after auth loading, redirecting to login");
      navigate("/login");
      return;
    }
  }, [isAuthLoading, user, token, navigate]);

  useEffect(() => {
    if (isAuthLoading || !user || !token) return;

    if (!generalSocket || !supportSocket) {
      console.log("Sockets not ready yet, skipping...");
      return;
    }

    generalSocket.on("roomList", (roomList) => {
      console.log("Room list received:", roomList);
      setRooms(roomList);
      if (roomList.length > 0 && !currentRoom) {
        const generalRoom = roomList.find((room) => room.name === "general");
        if (generalRoom) {
          handleJoinRoom(generalRoom.id);
        } else {
          console.error("General room not found in room list");
        }
      }
    });

    generalSocket.on("joinedRoom", ({ roomId, roomName }) => {
      console.log(`Joined room: ${roomName} (${roomId})`);
      setCurrentRoom({ id: roomId, name: roomName });
      fetchMessages(roomId);
      setNotifications((prev) => ({
        ...prev,
        [roomId]: 0,
      }));
    });

    generalSocket.on("newMessage", (message) => {
      console.log("New message received:", message);
      if (tab === "general" && message.roomId === currentRoom?.id) {
        setMessages((prev) => ({
          ...prev,
          [message.roomId]: [
            ...(prev[message.roomId] || []),
            { ...message, sender: { username: message.sender } },
          ],
        }));
      } else {
        setNotifications((prev) => ({
          ...prev,
          [message.roomId]: (prev[message.roomId] || 0) + 1,
        }));
      }
    });

    generalSocket.on("error", (error) => {
      console.error("Socket error:", error.message);
    });

    if (user.role !== "support") {
      supportSocket.on("onlineUsers", (users) => {
        console.log("Online users received for user:", user.username, users);
        const admin = Object.entries(users).find(
          ([, userData]) => userData.role === "support"
        );
        console.log("Admin user found:", admin);
        if (admin) {
          const [adminId, adminData] = admin;
          setAdminUser({ id: adminId, username: adminData.username });
          console.log("Admin user set:", {
            id: adminId,
            username: adminData.username,
          });
        } else {
          console.log("No admin user found, setting adminUser to null");
          setAdminUser(null);
        }
      });

      if (supportSocket) {
        console.log("Emitting getOnlineUsers");
        supportSocket.emit("getOnlineUsers");
      } else {
        console.error("supportSocket is not initialized");
      }
    }

    supportSocket.on("newPrivateMessage", (message) => {
      console.log("New private message received in Chat.js:", message);
      const otherUserId =
        message.senderId === user.id ? message.receiver : message.senderId;
      setPrivateMessages((prev) => ({
        ...prev,
        [otherUserId]: [
          ...(prev[otherUserId] || []),
          { ...message, sender: { username: message.sender, _id: message.senderId } },
        ],
      }));
    });

    return () => {
      generalSocket.off("roomList");
      generalSocket.off("joinedRoom");
      generalSocket.off("newMessage");
      generalSocket.off("error");
      supportSocket.off("onlineUsers");
      supportSocket.off("newPrivateMessage");
    };
  }, [user, token, navigate, generalSocket, supportSocket, tab, isAuthLoading, logout, currentRoom]);

  useEffect(() => {
    if (isAuthLoading || !selectedUser) return;

    const fetchPrivateMessages = async () => {
      try {
        const res = await axios.get(
          `http://localhost:3000/api/chat/private/${selectedUser.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("Fetched private messages:", res.data);
        setPrivateMessages((prev) => ({
          ...prev,
          [selectedUser.id]: res.data,
        }));
      } catch (err) {
        console.error("Error fetching private messages:", err);
      }
    };
    fetchPrivateMessages();
  }, [selectedUser, token, isAuthLoading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentRoom]);

  const fetchMessages = async (roomId) => {
    try {
      const res = await axios.get(
        `http://localhost:3000/api/chat/general?roomId=${roomId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log(`Messages fetched for room ${roomId}:`, res.data);
      setMessages((prev) => ({
        ...prev,
        [roomId]: res.data,
      }));
    } catch (err) {
      console.error("Error fetching messages:", err);
      if (err.response?.status === 401) {
        console.log("Unauthorized, logging out");
        logout();
        navigate("/login");
      }
    }
  };

  const handleJoinRoom = (roomId) => {
    if (generalSocket) {
      console.log(`Joining room: ${roomId}`);
      generalSocket.emit("joinRoom", roomId);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !generalSocket || !currentRoom) {
      console.log("Cannot send message: ", {
        newMessage,
        generalSocket,
        currentRoom,
      });
      return;
    }
    console.log(`Sending message to room ${currentRoom.id}: ${newMessage}`);
    generalSocket.emit("sendMessage", {
      roomId: currentRoom.id,
      content: newMessage,
    });
    setNewMessage("");
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    console.log("Creating room with name:", newRoomName);
    console.log("Token:", token);

    try {
      const res = await axios.post(
        "http://localhost:3000/api/rooms",
        { name: newRoomName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Room created:", res.data);
      setNewRoomName("");
      setShowRoomForm(false);
      generalSocket.emit("roomCreated");
    } catch (err) {
      console.error("Error creating room:", err);
      if (err.response) {
        console.log("Response status:", err.response.status);
        console.log("Response data:", err.response.data);
      }
    }
  };

  const startEditRoom = (roomId, currentName) => {
    setEditingRoomId(roomId);
    setEditRoomName(currentName);
  };

  const cancelEdit = () => {
    setEditingRoomId(null);
    setEditRoomName("");
  };

  const handleEditRoom = async (roomId) => {
    if (!editRoomName.trim()) return;

    try {
      const res = await axios.put(
        `http://localhost:3000/api/rooms/${roomId}`,
        { name: editRoomName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Room updated:", res.data);
      setEditingRoomId(null);
      setEditRoomName("");
      generalSocket.emit("roomUpdated");
      Swal.fire({
        title: "Success!",
        text: "Room name updated successfully.",
        icon: "success",
        confirmButtonText: "OK",
      });
    } catch (err) {
      console.error("Error updating room:", err);
      if (err.response) {
        console.log("Response status:", err.response.status);
        console.log("Response data:", err.response.data);
      }
      Swal.fire({
        title: "Error!",
        text: "Failed to update the room.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  const handleDeleteRoom = async (roomId) => {
    const result = await Swal.fire({
      title: "Are you sure you want to delete this room?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "No",
    });
    if (!result.isConfirmed) return;

    try {
      await axios.delete(`http://localhost:3000/api/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Room deleted:", roomId);
      if (currentRoom?.id === roomId) {
        const generalRoom = rooms.find((room) => room.name === "general");
        if (generalRoom) {
          handleJoinRoom(generalRoom.id);
        }
      }
      generalSocket.emit("roomDeleted");
    } catch (err) {
      console.error("Error deleting room:", err);
      if (err.response) {
        console.log("Response status:", err.response.status);
        console.log("Response data:", err.response.data);
      }
      Swal.fire({
        title: "Error!",
        text: "Failed to delete the room.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSelectUser = (userId, username) => {
    setSelectedUser({ id: userId, username });
    setTab("private");
  };

  const handleSendPrivateMessage = (messageContent) => {
    if (!messageContent.trim() || !selectedUser || !supportSocket) return;
    const messageData = { to: selectedUser.id, content: messageContent };
    console.log("Sending private message from Chat.js:", messageData);
    supportSocket.emit("privateMessage", messageData);
    setPrivateMessages((prev) => ({
      ...prev,
      [selectedUser.id]: [
        ...(prev[selectedUser.id] || []),
        {
          sender: { username: user.username, _id: user.id },
          content: messageContent,
          createdAt: new Date(),
        },
      ],
    }));
  };

  if (isAuthLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={`chat-container ${theme}`}>
      <div className="sidebar">
        <button
          className={tab === "general" ? "active" : ""}
          onClick={() => {
            setTab("general");
            setSelectedUser(null);
            const generalRoom = rooms.find((room) => room.name === "general");
            if (generalRoom) {
              handleJoinRoom(generalRoom.id);
            }
          }}
        >
          Group Chat
        </button>
        {tab === "general" && (
          <div className="rooms">
            <h3>Rooms</h3>
            {user.role === "support" && (
              <>
                <button
                  className="create-room-btn"
                  onClick={() => setShowRoomForm(!showRoomForm)}
                >
                  {showRoomForm ? "Close" : "Create New Room"}
                </button>
                {showRoomForm && (
                  <form onSubmit={handleCreateRoom} className="create-room-form">
                    <input
                      type="text"
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      placeholder="Room name..."
                    />
                    <button type="submit">Create</button>
                  </form>
                )}
              </>
            )}
            <ul>
              {rooms.map((room) => (
                <li
                  key={room.id}
                  className={`room-item ${currentRoom?.id === room.id ? "active" : ""}`}
                >
                  {editingRoomId === room.id ? (
                    <div className="edit-room-form">
                      <input
                        type="text"
                        value={editRoomName}
                        onChange={(e) => setEditRoomName(e.target.value)}
                        placeholder="New room name..."
                      />
                      <div className="edit-room-buttons">
                        <button onClick={() => handleEditRoom(room.id)}>Save</button>
                        <button onClick={cancelEdit}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span
                        className="room-name"
                        onClick={() => handleJoinRoom(room.id)}
                      >
                        {room.name}
                        {notifications[room.id] > 0 && (
                          <span className="notification-badge">
                            {notifications[room.id]}
                          </span>
                        )}
                      </span>
                      {user.role === "support" && room.name !== "general" && (
                        <div className="room-actions">
                          <FaEdit
                            className="edit-icon"
                            onClick={() => startEditRoom(room.id, room.name)}
                          />
                          <FaTrash
                            className="delete-icon"
                            onClick={() => handleDeleteRoom(room.id)}
                          />
                        </div>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        <hr className="separator" />
        <button
          className={tab === "private" ? "active" : ""}
          onClick={() => {
            setTab("private");
            if (user.role !== "support" && adminUser) {
              setSelectedUser(adminUser);
            }
          }}
        >
          {user.role === "support" ? "Chat with Users" : "Chat with Support"}
        </button>
        {tab === "private" && user.role === "support" && (
          <OnlineUsers onSelectUser={handleSelectUser} selectedUser={selectedUser} />
        )}
        {tab === "private" && user.role !== "support" && adminUser && (
          <div className="online-users">
            <h3>Support</h3>
            <ul>
              <li
                className={selectedUser?.id === adminUser.id ? "active" : ""}
                onClick={() => handleSelectUser(adminUser.id, adminUser.username)}
              >
                {adminUser.username}
              </li>
            </ul>
          </div>
        )}
        {tab === "private" && user.role !== "support" && !adminUser && (
          <div className="online-users">
            <h3>Support</h3>
            <p>No support online</p>
          </div>
        )}
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
      <div className="chat-main">
        {tab === "general" ? (
          <>
            <div className="header">
              <h2>{currentRoom ? currentRoom.name : "Group Chat"}</h2>
            </div>
            <div className="messages">
              {currentRoom && messages[currentRoom.id] ? (
                <>
                  {messages[currentRoom.id].map((msg) => (
                    <MessageItem key={msg._id} msg={msg} user={user} />
                  ))}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <p>No room selected</p>
              )}
            </div>
            <div className="message-form">
              <form onSubmit={handleSendMessage}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Write your message..."
                />
                <button type="submit">
                  <FaPaperPlane />
                </button>
              </form>
            </div>
          </>
        ) : (
          <PrivateChat
            selectedUser={selectedUser}
            messages={selectedUser ? privateMessages[selectedUser.id] || [] : []}
            onSendMessage={handleSendPrivateMessage}
          />
        )}
      </div>
    </div>
  );
};

export default Chat;