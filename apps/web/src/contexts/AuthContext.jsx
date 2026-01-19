import { createContext, useContext, useState, useEffect } from "react";

// URL de l'API - en dev c'est localhost:3000
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Creation du contexte
const AuthContext = createContext(null);

// Hook pour utiliser le contexte facilement
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit etre utilise dans un AuthProvider");
  }
  return context;
}

// Provider qui englobe l'application
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // Au chargement, verifier si on a un token valide
  useEffect(() => {
    async function checkAuth() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          // Token invalide, on le supprime
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error("Erreur verification auth:", err);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [token]);

  // Fonction de connexion
  async function login(email, password) {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Erreur de connexion");
    }

    // Stocker le token et l'utilisateur
    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);

    return data;
  }

  // Fonction d'inscription
  async function register(userData) {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData)
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Erreur lors de l'inscription");
    }

    return data;
  }

  // Fonction de deconnexion
  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }

  // Mot de passe oublie
  async function forgotPassword(email) {
    const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Erreur");
    }

    return data;
  }

  // Changer le mot de passe
  async function changePassword(currentPassword, newPassword) {
    const res = await fetch(`${API_URL}/api/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Erreur");
    }

    return data;
  }

  // Valeurs exposees par le contexte
  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isEmploye: user?.role === "employe",
    isClient: user?.role === "client",
    login,
    register,
    logout,
    forgotPassword,
    changePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
