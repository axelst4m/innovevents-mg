import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

import { API_URL } from "../config";

// Couleurs par statut de devis
const STATUS_COLORS = {
  brouillon: "secondary",
  envoye: "info",
  en_etude: "warning",
  modification: "warning",
  accepte: "success",
  refuse: "danger"
};

const STATUS_LABELS = {
  brouillon: "Brouillon",
  envoye: "En attente",
  en_etude: "En étude",
  modification: "Modification demandée",
  accepte: "Accepté",
  refuse: "Refusé"
};

export default function ClientDashboard() {
  const { user, token } = useAuth();

  const [devisList, setDevisList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Charger les devis du client
  useEffect(() => {
    async function fetchDevis() {
      try {
        const res = await fetch(`${API_URL}/api/devis/client`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setDevisList(data.devis || []);
        }
      } catch {
        setError("Impossible de charger vos devis");
      } finally {
        setLoading(false);
      }
    }

    if (token) fetchDevis();
  }, [token]);

  // Stats rapides
  const devisEnAttente = devisList.filter(d => d.status === "envoye").length;
  const devisAcceptes = devisList.filter(d => d.status === "accepte").length;
  const devisTotal = devisList.length;

  // Derniers devis (3 max)
  const derniersDevis = devisList.slice(0, 3);

  // Prochain événement (devis accepté avec date future)
  const now = new Date();
  const prochainEvent = devisList
    .filter(d => d.status === "accepte" && d.event_start_date && new Date(d.event_start_date) > now)
    .sort((a, b) => new Date(a.event_start_date) - new Date(b.event_start_date))[0] || null;

  if (loading) {
    return (
      <div className="container py-4 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
        <p className="mt-2 text-muted">Chargement de votre espace...</p>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* En-tête de bienvenue */}
      <div className="mb-4">
        <h1>Bonjour {user?.firstname} !</h1>
        <p className="text-muted">
          Bienvenue dans votre espace client Innov'Events.
        </p>
      </div>

      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      {/* Cartes statistiques */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card text-center shadow-sm">
            <div className="card-body">
              <h5 className="card-title text-muted">Total devis</h5>
              <p className="display-6 fw-bold">{devisTotal}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center shadow-sm">
            <div className="card-body">
              <h5 className="card-title text-muted">En attente de réponse</h5>
              <p className="display-6 fw-bold text-info">{devisEnAttente}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center shadow-sm">
            <div className="card-body">
              <h5 className="card-title text-muted">Devis acceptés</h5>
              <p className="display-6 fw-bold text-success">{devisAcceptes}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Colonne principale */}
        <div className="col-lg-8">
          {/* Derniers devis */}
          <div className="card shadow-sm mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Derniers devis</h5>
              <Link to="/espace-client/devis" className="btn btn-sm btn-outline-primary">
                Voir tout
              </Link>
            </div>
            <div className="card-body">
              {derniersDevis.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted mb-3">Vous n'avez pas encore de devis.</p>
                  <Link to="/demande-devis" className="btn btn-primary">
                    Demander un devis
                  </Link>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th>Référence</th>
                        <th>Événement</th>
                        <th>Montant TTC</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {derniersDevis.map(d => (
                        <tr key={d.id}>
                          <td className="fw-bold">{d.reference}</td>
                          <td>{d.event_name || "-"}</td>
                          <td>
                            {d.total_ttc
                              ? `${parseFloat(d.total_ttc).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}`
                              : "-"}
                          </td>
                          <td>
                            <span className={`badge bg-${STATUS_COLORS[d.status] || "secondary"}`}>
                              {STATUS_LABELS[d.status] || d.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Prochain événement */}
          {prochainEvent && (
            <div className="card shadow-sm border-success">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0">Prochain événement</h5>
              </div>
              <div className="card-body">
                <h6>{prochainEvent.event_name}</h6>
                <p className="mb-1">
                  <strong>Date :</strong>{" "}
                  {new Date(prochainEvent.event_start_date).toLocaleDateString("fr-FR", {
                    weekday: "long", day: "numeric", month: "long", year: "numeric"
                  })}
                </p>
                {prochainEvent.event_location && (
                  <p className="mb-0">
                    <strong>Lieu :</strong> {prochainEvent.event_location}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Colonne latérale */}
        <div className="col-lg-4">
          {/* Infos du compte */}
          <div className="card shadow-sm mb-4">
            <div className="card-header">
              <h5 className="mb-0">Mon compte</h5>
            </div>
            <div className="card-body">
              <p className="mb-1"><strong>Nom :</strong> {user?.firstname} {user?.lastname}</p>
              <p className="mb-1"><strong>Email :</strong> {user?.email}</p>
              <p className="mb-3">
                <strong>Membre depuis :</strong>{" "}
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
                  : "-"}
              </p>
              <Link to="/changer-mot-de-passe" className="btn btn-outline-secondary btn-sm w-100">
                Changer mon mot de passe
              </Link>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="card shadow-sm">
            <div className="card-header">
              <h5 className="mb-0">Actions rapides</h5>
            </div>
            <div className="card-body d-grid gap-2">
              <Link to="/demande-devis" className="btn btn-primary">
                Demander un devis
              </Link>
              <Link to="/espace-client/devis" className="btn btn-outline-primary">
                Voir mes devis
              </Link>
              <Link to="/contact" className="btn btn-outline-secondary">
                Nous contacter
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
