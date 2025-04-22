import React, { useState, useContext, useRef, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { FaPaperPlane } from "react-icons/fa";
import "../styles/PrivateChat.css";

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

const PrivateChat = ({ selectedUser, messages, onSendMessage }) => {
  const { user } = useContext(AuthContext);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    onSendMessage(newMessage);
    setNewMessage("");
  };

  return (
    <div className="private-chat">
      <div className="header">
        <h2>
          Chat with {selectedUser ? selectedUser.username : "Select a user"}
        </h2>
      </div>
      <div className="messages">
        {messages.length > 0 ? (
          <>
            {messages.map((msg) => (
              <MessageItem
                key={msg._id || `${msg.createdAt}-${msg.content}`}
                msg={msg}
                user={user}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <p>No messages yet</p>
        )}
      </div>
      {selectedUser && (
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
      )}
    </div>
  );
};

export default PrivateChat;