import React, { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = loading, false = anon, object = user
  const [token, setToken] = useState(localStorage.getItem("dg_token"));

  useEffect(() => {
    let active = true;
    async function load() {
      if (!token) {
        if (active) setUser(false);
        return;
      }
      try {
        const { data } = await api.get("/auth/me");
        if (active) setUser(data);
      } catch (e) {
        localStorage.removeItem("dg_token");
        if (active) {
          setToken(null);
          setUser(false);
        }
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [token]);

  const login = (newToken, userObj) => {
    localStorage.setItem("dg_token", newToken);
    setToken(newToken);
    setUser(userObj);
  };

  const logout = () => {
    localStorage.removeItem("dg_token");
    setToken(null);
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
