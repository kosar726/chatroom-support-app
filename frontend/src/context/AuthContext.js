// AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const savedUser = sessionStorage.getItem("user");
      const savedToken = sessionStorage.getItem("token");

      console.log("Initializing auth - savedUser:", savedUser);
      console.log("Initializing auth - savedToken:", savedToken);

      if (savedUser && savedToken) {
        const parsedUser = JSON.parse(savedUser);
        console.log("Setting user and token from sessionStorage:", parsedUser, savedToken);
        setUser(parsedUser);
        setToken(savedToken);

        try {
          const res = await axios.get("http://localhost:3000/api/auth/verify", {
            headers: {
              Authorization: `Bearer ${savedToken}`,
            },
          });
          console.log("Token verified successfully:", res.data);
          setUser(res.data.user);
        } catch (err) {
          console.error("Token verification failed:", err.response?.data || err.message);
          console.log("Keeping existing user and token from sessionStorage due to verification failure");
        }
      } else {
        console.log("No user or token in sessionStorage, skipping verification");
      }

      console.log("Setting isAuthLoading to false");
      setIsAuthLoading(false);
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    console.log("Saving to sessionStorage - user:", user);
    console.log("Saving to sessionStorage - token:", token);
    if (user) {
      sessionStorage.setItem("user", JSON.stringify(user));
    } else {
      sessionStorage.removeItem("user");
    }
    if (token) {
      sessionStorage.setItem("token", token);
    } else {
      sessionStorage.removeItem("token");
    }
  }, [user, token]);

  const login = async (username, password) => {
    try {
      const res = await axios.post("http://localhost:3000/api/auth/login", {
        username,
        password,
      });
      console.log("Login response:", res.data);
      console.log("Login successful - user:", res.data.user);
      console.log("Login successful - token:", res.data.token);
      if (!res.data.user || !res.data.token) {
        throw new Error("Invalid login response: user or token missing");
      }
      setUser(res.data.user);
      setToken(res.data.token);
      sessionStorage.setItem("user", JSON.stringify(res.data.user));
      sessionStorage.setItem("token", res.data.token);
    } catch (err) {
      console.error("Login failed:", err.response?.data || err.message);
      throw err;
    }
  };

  const logout = () => {
    console.log("Logging out - clearing user and token");
    setUser(null);
    setToken(null);
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthLoading }}>
      {children}
    </AuthContext.Provider>
  );
};