import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

import { API_URL } from "../config";

export default function DeleteAccount() {
  const navigate = useNavigate();
  const { token, logout } = useAuth();

  const [password, setPassword] = useState("");
  const [understood, setUnderstood] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Validation
    if (!password) {
      setError("Veuillez entrer votre mot de passe");
      return;
    }

    if (!understood) {
      setError("Vous devez confirmer que vous comprenez les conséquences");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/account`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de la suppression du compte");
        return;
      }

      // Succès: afficher message et déconnecter
      alert("Votre compte a été supprimé avec succès. Redirection en cours...");

      // Déconnecter et rediriger
      logout();
      setTimeout(() => {
        navigate("/");
      }, 500);

    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow border-danger">
            <div className="card-body p-4">
              <h1 className="card-title text-center mb-4 text-danger">Supprimer mon compte</h1>

              <div className="alert alert-danger" role="alert">
                <h6 className="alert-heading fw-bold">Attention</h6>
                <p className="mb-2">
                  La suppression de votre compte est <strong>irréversible</strong>.
                </p>
                <p className="mb-2">
                  Vos données personnelles seront anonymisées:
                </p>
                <ul className="mb-0">
                  <li>Votre email sera remplacé par une adresse anonymisée</li>
                  <li>Votre nom et prénom seront remplacés par "Utilisateur supprimé"</li>
                  <li>Tous vos devis seront anonymisés</li>
                  <li>Votre compte ne sera plus accessible</li>
                </ul>
              </div>

              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Confirmer avec votre mot de passe
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="Entrez votre mot de passe"
                  />
                </div>

                <div className="mb-4">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="understood"
                      checked={understood}
                      onChange={(e) => setUnderstood(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="understood">
                      Je comprends que cette action est irréversible
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-danger w-100"
                  disabled={loading || !understood}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Suppression en cours...
                    </>
                  ) : (
                    "Supprimer mon compte"
                  )}
                </button>
              </form>

              <p className="text-center text-muted small mt-3">
                Vous avez changé d'avis? Vous pouvez quitter cette page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
