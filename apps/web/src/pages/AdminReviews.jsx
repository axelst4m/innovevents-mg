import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function AdminReviews() {
  const { token, isAdmin, isEmploye } = useAuth();
  const navigate = useNavigate();

  const [pendingReviews, setPendingReviews] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  // Modal de refus
  const [rejectModal, setRejectModal] = useState({ show: false, reviewId: null });
  const [rejectReason, setRejectReason] = useState("");

  // Redirection si pas admin/employe
  useEffect(() => {
    if (!isAdmin && !isEmploye) {
      navigate("/connexion");
    }
  }, [isAdmin, isEmploye, navigate]);

  // Charger les avis en attente
  async function fetchPending() {
    try {
      const res = await fetch(`${API_URL}/api/reviews/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Erreur chargement");
      const data = await res.json();
      setPendingReviews(data.reviews || []);
    } catch (err) {
      setError(err.message);
    }
  }

  // Charger tous les avis
  async function fetchAll() {
    try {
      const res = await fetch(`${API_URL}/api/reviews/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Erreur chargement");
      const data = await res.json();
      setAllReviews(data.reviews || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function fetchData() {
    setLoading(true);
    setError("");
    await Promise.all([fetchPending(), fetchAll()]);
    setLoading(false);
  }

  useEffect(() => {
    if (token && (isAdmin || isEmploye)) {
      fetchData();
    }
  }, [token, isAdmin, isEmploye]);

  // Valider un avis
  async function validateReview(id, isFeatured = false) {
    try {
      const res = await fetch(`${API_URL}/api/reviews/${id}/validate`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_featured: isFeatured })
      });

      if (!res.ok) throw new Error("Erreur validation");

      // Rafraichir les listes
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  }

  // Refuser un avis
  async function rejectReview() {
    if (!rejectModal.reviewId) return;

    try {
      const res = await fetch(`${API_URL}/api/reviews/${rejectModal.reviewId}/reject`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: rejectReason })
      });

      if (!res.ok) throw new Error("Erreur refus");

      setRejectModal({ show: false, reviewId: null });
      setRejectReason("");
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  }

  // Toggle featured
  async function toggleFeatured(id, currentValue) {
    try {
      const res = await fetch(`${API_URL}/api/reviews/${id}/featured`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_featured: !currentValue })
      });

      if (!res.ok) throw new Error("Erreur mise a jour");

      fetchAll();
    } catch (err) {
      alert(err.message);
    }
  }

  // Supprimer un avis
  async function deleteReview(id) {
    if (!confirm("Supprimer definitivement cet avis ?")) return;

    try {
      const res = await fetch(`${API_URL}/api/reviews/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Erreur suppression");

      fetchData();
    } catch (err) {
      alert(err.message);
    }
  }

  // Formater la date
  function formatDate(dateStr) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  // Afficher les etoiles
  function renderStars(rating) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <i
          key={i}
          className={`bi ${i <= rating ? "bi-star-fill text-warning" : "bi-star text-muted"}`}
        ></i>
      );
    }
    return stars;
  }

  // Badge de statut
  function getStatusBadge(status) {
    const colors = {
      en_attente: "warning",
      valide: "success",
      refuse: "danger"
    };
    const labels = {
      en_attente: "En attente",
      valide: "Valide",
      refuse: "Refuse"
    };
    return <span className={`badge bg-${colors[status] || "secondary"}`}>{labels[status] || status}</span>;
  }

  if (!isAdmin && !isEmploye) return null;

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Gestion des avis</h1>
          {pendingReviews.length > 0 && (
            <span className="badge bg-warning text-dark">
              {pendingReviews.length} avis en attente de validation
            </span>
          )}
        </div>
        <button className="btn btn-outline-primary" onClick={fetchData} disabled={loading}>
          Actualiser
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Onglets */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "pending" ? "active" : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            En attente
            {pendingReviews.length > 0 && (
              <span className="badge bg-warning text-dark ms-2">{pendingReviews.length}</span>
            )}
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            Tous les avis
            <span className="badge bg-secondary ms-2">{allReviews.length}</span>
          </button>
        </li>
      </ul>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border"></div>
          <p className="mt-2">Chargement...</p>
        </div>
      ) : activeTab === "pending" ? (
        /* Avis en attente */
        pendingReviews.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-check-circle fs-1 text-success"></i>
            <p className="mt-3">Aucun avis en attente de validation</p>
          </div>
        ) : (
          <div className="row g-4">
            {pendingReviews.map((review) => (
              <div key={review.id} className="col-lg-6">
                <div className="card h-100 border-warning">
                  <div className="card-header bg-warning bg-opacity-10">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{review.author_name}</strong>
                        {review.author_company && (
                          <span className="text-muted"> - {review.author_company}</span>
                        )}
                      </div>
                      <div>{renderStars(review.rating)}</div>
                    </div>
                  </div>
                  <div className="card-body">
                    <h5 className="card-title">{review.title}</h5>
                    <p className="card-text">{review.content}</p>
                    {review.event_name && (
                      <p className="small text-muted">
                        <i className="bi bi-calendar-event me-1"></i>
                        Evenement: {review.event_name}
                      </p>
                    )}
                    <p className="small text-muted mb-0">
                      <i className="bi bi-clock me-1"></i>
                      Soumis le {formatDate(review.created_at)}
                    </p>
                  </div>
                  <div className="card-footer bg-transparent">
                    <div className="btn-group w-100">
                      <button
                        className="btn btn-success"
                        onClick={() => validateReview(review.id, false)}
                      >
                        <i className="bi bi-check-lg me-1"></i>
                        Valider
                      </button>
                      <button
                        className="btn btn-outline-warning"
                        onClick={() => validateReview(review.id, true)}
                        title="Valider et mettre en avant"
                      >
                        <i className="bi bi-star-fill"></i>
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => setRejectModal({ show: true, reviewId: review.id })}
                      >
                        <i className="bi bi-x-lg me-1"></i>
                        Refuser
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Tous les avis */
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Auteur</th>
                <th>Titre</th>
                <th>Note</th>
                <th>Statut</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allReviews.map((review) => (
                <tr key={review.id}>
                  <td>
                    <strong>{review.author_name}</strong>
                    {review.author_company && (
                      <br />
                    )}
                    {review.author_company && (
                      <small className="text-muted">{review.author_company}</small>
                    )}
                  </td>
                  <td>
                    {review.title}
                    {review.is_featured && (
                      <span className="badge bg-warning text-dark ms-2">
                        <i className="bi bi-star-fill"></i>
                      </span>
                    )}
                  </td>
                  <td>{renderStars(review.rating)}</td>
                  <td>{getStatusBadge(review.status)}</td>
                  <td>
                    <small>{formatDate(review.created_at)}</small>
                    {review.validated_at && (
                      <>
                        <br />
                        <small className="text-muted">
                          Par {review.validated_by_firstname} {review.validated_by_lastname}
                        </small>
                      </>
                    )}
                  </td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      {review.status === "valide" && isAdmin && (
                        <button
                          className={`btn ${review.is_featured ? "btn-warning" : "btn-outline-warning"}`}
                          onClick={() => toggleFeatured(review.id, review.is_featured)}
                          title={review.is_featured ? "Retirer de la une" : "Mettre en avant"}
                        >
                          <i className="bi bi-star-fill"></i>
                        </button>
                      )}
                      {review.status === "en_attente" && (
                        <>
                          <button
                            className="btn btn-outline-success"
                            onClick={() => validateReview(review.id, false)}
                            title="Valider"
                          >
                            <i className="bi bi-check-lg"></i>
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => setRejectModal({ show: true, reviewId: review.id })}
                            title="Refuser"
                          >
                            <i className="bi bi-x-lg"></i>
                          </button>
                        </>
                      )}
                      {isAdmin && (
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => deleteReview(review.id)}
                          title="Supprimer"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de refus */}
      {rejectModal.show && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Refuser l'avis</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setRejectModal({ show: false, reviewId: null })}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Raison du refus (optionnel)</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Ex: Contenu inapproprie, spam, etc."
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setRejectModal({ show: false, reviewId: null })}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={rejectReview}
                >
                  Confirmer le refus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
