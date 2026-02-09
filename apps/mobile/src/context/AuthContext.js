import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "../config";

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit etre utilise dans un AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Charger le token au demarrage
  useEffect(() => {
    loadToken();
  }, []);

  async function loadToken() {
    try {
      const storedToken = await SecureStore.getItemAsync("token");
      if (storedToken) {
        setToken(storedToken);
        await checkAuth(storedToken);
      }
    } catch (err) {
      console.error("Erreur chargement token:", err);
    } finally {
      setLoading(false);
    }
  }

  async function checkAuth(authToken) {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        await SecureStore.deleteItemAsync("token");
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.error("Erreur verification auth:", err);
    }
  }

  async function login(email, password) {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Erreur de connexion");
    }

    // Verifier que c'est un admin ou employe
    if (data.user.role !== "admin" && data.user.role !== "employe") {
      throw new Error("Acces reserve aux administrateurs et employes");
    }

    await SecureStore.setItemAsync("token", data.token);
    setToken(data.token);
    setUser(data.user);

    return data;
  }

  async function logout() {
    await SecureStore.deleteItemAsync("token");
    setToken(null);
    setUser(null);
  }

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isEmploye: user?.role === "employe",
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
