import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Composant qui protège les routes selon le rôle de l'utilisateur
// Si pas connecté → redirige vers /connexion
// Si connecté mais mauvais rôle → redirige vers /
export default function ProtectedRoute({ roles, children }) {
  const { user, loading, isAuthenticated } = useAuth();

  // On attend que le contexte ait fini de charger
  if (loading) {
    return <div className="container py-4">Chargement...</div>;
  }

  // Pas connecté → page de connexion
  if (!isAuthenticated) {
    return <Navigate to="/connexion" replace />;
  }

  // Connecté mais pas le bon rôle
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
