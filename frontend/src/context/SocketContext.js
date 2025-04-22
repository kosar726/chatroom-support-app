import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import { AuthContext } from "./AuthContext";

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, token } = useContext(AuthContext);
  const [generalSocket, setGeneralSocket] = useState(null);
  const [supportSocket, setSupportSocket] = useState(null);

  useEffect(() => {
	  if (!user || !token) {
      console.log("No user or token, skipping socket initialization");
      return;
    }
    if (user && token) {
      console.log("Initializing sockets for user:", user.username, "with token:", token);
      const genSocket = io("http://localhost:3000", {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
      const supSocket = io("http://localhost:3000/support", {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      setGeneralSocket(genSocket);
      setSupportSocket(supSocket);

      genSocket.on("connect", () => console.log(`General socket connected for ${user.username}`));
      genSocket.on("connect_error", (err) => console.error(`General socket error for ${user.username}:`, err.message));
      genSocket.on("reconnect", (attempt) => console.log(`General socket reconnected for ${user.username} after ${attempt} attempts`));
      supSocket.on("connect", () => console.log(`Support socket connected for ${user.username}`));
      supSocket.on("connect_error", (err) => console.error(`Support socket error for ${user.username}:`, err.message));
      supSocket.on("reconnect", (attempt) => console.log(`Support socket reconnected for ${user.username} after ${attempt} attempts`));

      return () => {
        console.log(`Cleaning up sockets for ${user.username}`);
        genSocket.disconnect();
        supSocket.disconnect();
      };
    }
  }, [user, token]);

  return (
    <SocketContext.Provider value={{ generalSocket, supportSocket }}>
      {children}
    </SocketContext.Provider>
  );
};