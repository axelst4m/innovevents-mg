import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function EmployeDashboard() {
  const { token, user, isAdmin, isEmploye } = useAuth();
  const navigate = useNavigate();

  const [myTasks, setMyTasks] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Redirection si pas employe/admin
  useEffect(() => {
    if (!isAdmin && !isEmploye) {
      navigate("/connexion");
    }
  }, [isAdmin, isEmploye, navigate]);

  // Charger les donnees
  async function fetchData() {
    setLoading(true);
    setError("");

    try {
      // Mes taches
      const tasksRes = await fetch(`${API_URL}/api/tasks/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setMyTasks(tasksData.tasks || []);
      }

      // Avis en attente
      const reviewsRes = await fetch(`${API_URL}/api/reviews/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        setPendingReviews(reviewsData.reviews || []);
      }

      // Evenements a venir
      const eventsRes = await fetch(`${API_URL}/api/events?limit=5`);
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        // Filtrer les evenements futurs
        const now = new Date();
        const upcoming = (eventsData.events || []).filter(
          (e) => new Date(e.event_date) >= now
        );
        setUpcomingEvents(upcoming.slice(0, 5));
      }

    } catch (err) {
      setError("Erreur de chargement des donnees");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token && (isAdmin || isEmploye)) {
      fetchData();
    }
  }, [token, isAdmin, isEmploye]);

  // Changer le statut d'une tache
  async function updateTaskStatus(taskId, eventId, newStatus) {
    try {
      const res = await fetch(`${API_URL}/api/events/${eventId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error("Erreur mise a jour");

      // Rafraichir
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
      year: "numeric"
    });
  }

  // Badge de priorite
  function getPriorityBadge(priority) {
    const colors = {
      urgente: "danger",
      haute: "warning",
      normale: "secondary",
      basse: "info"
    };
    return <span className={`badge bg-${colors[priority] || "secondary"}`}>{priority}</span>;
  }

  // Badge de statut
  function getStatusBadge(status) {
    const colors = {
      a_faire: "secondary",
      en_cours: "primary",
      terminee: "success",
      annulee: "dark"
    };
    const labels = {
      a_faire: "A faire",
      en_cours: "En cours",
      terminee: "Terminee",
      annulee: "Annulee"
    };
    return <span className={`badge bg-${colors[status] || "secondary"}`}>{labels[status] || status}</span>;
  }

  // Etoiles
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

  if (!isAdmin && !isEmploye) return null;

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Bonjour, {user?.firstname} !</h1>
          <p className="text-muted mb-0">Voici votre tableau de bord</p>
        </div>
        <button className="btn btn-outline-primary" onClick={fetchData} disabled={loading}>
          <i className="bi bi-arrow-clockwise me-2"></i>
          Actualiser
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border"></div>
        </div>
      ) : (
        <div className="row g-4">
          {/* Mes taches */}
          <div className="col-lg-6">
            <div className="card h-100">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="bi bi-check2-square me-2"></i>
                  Mes taches
                </h5>
                <span className="badge bg-primary">{myTasks.length}</span>
              </div>
              <div className="card-body" style={{ maxHeight: "400px", overflowY: "auto" }}>
                {myTasks.length === 0 ? (
                  <p className="text-muted text-center py-3">
                    <i className="bi bi-check-circle fs-3 d-block mb-2"></i>
                    Aucune tache en cours
                  </p>
                ) : (
                  <div className="list-group list-group-flush">
                    {myTasks.map((task) => (
                      <div key={task.id} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <h6 className="mb-1">
                              {getPriorityBadge(task.priority)}
                              <span className="ms-2">{task.title}</span>
                            </h6>
                            <small className="text-muted">
                              <i className="bi bi-calendar-event me-1"></i>
                              {task.event_name}
                              {task.due_date && (
                                <span className="ms-2">
                                  <i className="bi bi-clock me-1"></i>
                                  Echeance: {formatDate(task.due_date)}
                                </span>
                              )}
                            </small>
                          </div>
                          <div className="btn-group btn-group-sm">
                            {task.status === "a_faire" && (
                              <button
                                className="btn btn-outline-primary"
                                onClick={() => updateTaskStatus(task.id, task.event_id, "en_cours")}
                                title="Commencer"
                              >
                                <i className="bi bi-play-fill"></i>
                              </button>
                            )}
                            {task.status === "en_cours" && (
                              <button
                                className="btn btn-outline-success"
                                onClick={() => updateTaskStatus(task.id, task.event_id, "terminee")}
                                title="Terminer"
                              >
                                <i className="bi bi-check-lg"></i>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Avis en attente */}
          <div className="col-lg-6">
            <div className="card h-100">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="bi bi-chat-square-text me-2"></i>
                  Avis a valider
                </h5>
                {pendingReviews.length > 0 && (
                  <span className="badge bg-warning text-dark">{pendingReviews.length}</span>
                )}
              </div>
              <div className="card-body" style={{ maxHeight: "400px", overflowY: "auto" }}>
                {pendingReviews.length === 0 ? (
                  <p className="text-muted text-center py-3">
                    <i className="bi bi-check-circle fs-3 d-block mb-2"></i>
                    Aucun avis en attente
                  </p>
                ) : (
                  <div className="list-group list-group-flush">
                    {pendingReviews.slice(0, 5).map((review) => (
                      <div key={review.id} className="list-group-item">
                        <div className="d-flex justify-content-between">
                          <div>
                            <h6 className="mb-1">{review.title}</h6>
                            <div className="mb-1">{renderStars(review.rating)}</div>
                            <small className="text-muted">
                              Par {review.author_name}
                            </small>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {pendingReviews.length > 0 && (
                  <div className="text-center mt-3">
                    <Link to="/admin/avis" className="btn btn-outline-warning">
                      Voir tous les avis ({pendingReviews.length})
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Evenements a venir */}
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="bi bi-calendar-event me-2"></i>
                  Prochains evenements
                </h5>
              </div>
              <div className="card-body">
                {upcomingEvents.length === 0 ? (
                  <p className="text-muted text-center py-3">Aucun evenement a venir</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead>
                        <tr>
                          <th>Evenement</th>
                          <th>Date</th>
                          <th>Lieu</th>
                          <th>Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {upcomingEvents.map((event) => (
                          <tr key={event.id}>
                            <td>
                              <strong>{event.name}</strong>
                            </td>
                            <td>{formatDate(event.event_date)}</td>
                            <td>{event.location || "-"}</td>
                            <td>
                              <span className="badge bg-secondary">{event.event_type}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
