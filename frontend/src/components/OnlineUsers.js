import React, { useState, useEffect, useContext } from "react";
import { SocketContext } from "../context/SocketContext";
import "../styles/OnlineUsers.css";

const OnlineUsers = ({ onSelectUser, selectedUser }) => {
  const [users, setUsers] = useState({});
  const { supportSocket } = useContext(SocketContext);

  useEffect(() => {
    if (!supportSocket) return;

    supportSocket.on("onlineUsers", (onlineUsers) => {
      console.log("Online users received in OnlineUsers:", onlineUsers);
      setUsers(onlineUsers);
    });

    supportSocket.emit("getOnlineUsers");

    return () => {
      supportSocket.off("onlineUsers");
    };
  }, [supportSocket]);

  return (
    <div className="online-users">
      <h3>Online Users</h3>
      {Object.keys(users).length > 0 ? (
        <ul>
          {Object.entries(users).map(([userId, userData]) => (
            <li
              key={userId}
              className={selectedUser?.id === userId ? "active" : ""}
              onClick={() => onSelectUser(userId, userData.username)}
            >
              {userData.username}
              {userData.role === "support" && (
                <span className="support-badge">Support</span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No users online</p>
      )}
    </div>
  );
};

export default OnlineUsers;