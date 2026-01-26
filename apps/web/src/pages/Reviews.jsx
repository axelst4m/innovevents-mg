import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Reviews() {
  const { user, token, isAuthenticated } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Formulaire d'ajout
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    author_name: user ? `${user.firstname} ${user.lastname}` : "",
    author_company: "",
    rating: 5,
    title: "",
    content: ""
  });
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  // Charger les avis
  async function fetchReviews() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/reviews`);
      if (!res.ok) throw new Error("Erreur chargement avis");

      const data = await res.json();
      setReviews(data.reviews || []);
      setStats(data.stats || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReviews();
  }, []);

  // Pre-remplir le nom si connecte
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        author_name: `${user.firstname} ${user.lastname}`
      }));
    }
  }, [user]);

  // Gestion du formulaire
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormLoading(true);
    setFormErrors({});
    setFormSuccess(false);

    try {
      const headers = { "Content-Type": "application/json" };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`${API_URL}/api/reviews`, {
        method: "POST",
        headers,
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          const errMap = {};
          data.errors.forEach((err) => {
            errMap[err.field] = err.message;
          });
          setFormErrors(errMap);
        } else {
          setError(data.error || "Erreur lors de l'envoi");
        }
        return;
      }

      setFormSuccess(true);
      setShowForm(false);
      setForm({
        author_name: user ? `${user.firstname} ${user.lastname}` : "",
        author_company: "",
        rating: 5,
        title: "",
        content: ""
      });

    } catch (err) {
      setError("Erreur de connexion au serveur");
    } finally {
      setFormLoading(false);
    }
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

  // Formater la date
  function formatDate(dateStr) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }

  return (
    <div className="container py-5">
      <div className="row">
        {/* Colonne principale */}
        <div className="col-lg-8">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1>Avis de nos clients</h1>
            <button
              className="btn btn-primary"
              onClick={() => setShowForm(!showForm)}
            >
              <i className="bi bi-plus-lg me-2"></i>
              Donner mon avis
            </button>
          </div>

          {/* Message de succes */}
          {formSuccess && (
            <div className="alert alert-success alert-dismissible fade show">
              <i className="bi bi-check-circle me-2"></i>
              Merci pour votre avis ! Il sera publie apres validation par notre equipe.
              <button
                type="button"
                className="btn-close"
                onClick={() => setFormSuccess(false)}
              ></button>
            </div>
          )}

          {/* Formulaire d'ajout */}
          {showForm && (
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Partager votre experience</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Votre nom *</label>
                      <input
                        type="text"
                        name="author_name"
                        className={`form-control ${formErrors.author_name ? "is-invalid" : ""}`}
                        value={form.author_name}
                        onChange={handleChange}
                        disabled={formLoading}
                      />
                      {formErrors.author_name && (
                        <div className="invalid-feedback">{formErrors.author_name}</div>
                      )}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Entreprise</label>
                      <input
                        type="text"
                        name="author_company"
                        className="form-control"
                        value={form.author_company}
                        onChange={handleChange}
                        disabled={formLoading}
                        placeholder="Optionnel"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Note *</label>
                    <div className="d-flex gap-2">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          className={`btn btn-lg ${
                            form.rating >= n ? "text-warning" : "text-muted"
                          }`}
                          onClick={() => setForm((prev) => ({ ...prev, rating: n }))}
                          disabled={formLoading}
                        >
                          <i className={`bi ${form.rating >= n ? "bi-star-fill" : "bi-star"}`}></i>
                        </button>
                      ))}
                      <span className="ms-2 align-self-center">
                        {form.rating}/5
                      </span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Titre de votre avis *</label>
                    <input
                      type="text"
                      name="title"
                      className={`form-control ${formErrors.title ? "is-invalid" : ""}`}
                      value={form.title}
                      onChange={handleChange}
                      disabled={formLoading}
                      placeholder="Resumez votre experience en quelques mots"
                    />
                    {formErrors.title && (
                      <div className="invalid-feedback">{formErrors.title}</div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Votre avis *</label>
                    <textarea
                      name="content"
                      className={`form-control ${formErrors.content ? "is-invalid" : ""}`}
                      rows="4"
                      value={form.content}
                      onChange={handleChange}
                      disabled={formLoading}
                      placeholder="Decrivez votre experience avec Innov'Events..."
                    ></textarea>
                    {formErrors.content && (
                      <div className="invalid-feedback">{formErrors.content}</div>
                    )}
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={formLoading}
                    >
                      {formLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Envoi...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-send me-2"></i>
                          Envoyer mon avis
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowForm(false)}
                      disabled={formLoading}
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Liste des avis */}
          {error && <div className="alert alert-danger">{error}</div>}

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border"></div>
              <p className="mt-2">Chargement des avis...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-chat-square-text fs-1 text-muted"></i>
              <p className="mt-3 text-muted">Aucun avis pour le moment. Soyez le premier a partager votre experience !</p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className={`card ${review.is_featured ? "border-warning" : ""}`}
                >
                  {review.is_featured && (
                    <div className="card-header bg-warning text-dark">
                      <i className="bi bi-award me-2"></i>
                      Avis mis en avant
                    </div>
                  )}
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h5 className="card-title mb-1">{review.title}</h5>
                        <div className="mb-2">{renderStars(review.rating)}</div>
                      </div>
                      <small className="text-muted">{formatDate(review.created_at)}</small>
                    </div>
                    <p className="card-text">{review.content}</p>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{review.author_name}</strong>
                        {review.author_company && (
                          <span className="text-muted"> - {review.author_company}</span>
                        )}
                      </div>
                      {review.event_name && (
                        <span className="badge bg-secondary">
                          <i className="bi bi-calendar-event me-1"></i>
                          {review.event_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar avec stats */}
        <div className="col-lg-4">
          <div className="card sticky-top" style={{ top: "20px" }}>
            <div className="card-header">
              <h5 className="mb-0">Statistiques</h5>
            </div>
            <div className="card-body">
              {stats ? (
                <>
                  <div className="text-center mb-4">
                    <h2 className="display-4 fw-bold text-warning mb-0">
                      {stats.average_rating || "-"}
                    </h2>
                    <div className="mb-2">{renderStars(Math.round(stats.average_rating || 0))}</div>
                    <p className="text-muted mb-0">
                      {stats.total} avis verifie{stats.total > 1 ? "s" : ""}
                    </p>
                  </div>

                  <hr />

                  {/* Distribution des notes */}
                  <div className="d-flex flex-column gap-2">
                    {[5, 4, 3, 2, 1].map((n) => {
                      const count = stats[`${["one", "two", "three", "four", "five"][n - 1]}_stars`] || 0;
                      const percent = stats.total > 0 ? (count / stats.total) * 100 : 0;
                      return (
                        <div key={n} className="d-flex align-items-center gap-2">
                          <span style={{ width: "20px" }}>{n}</span>
                          <i className="bi bi-star-fill text-warning"></i>
                          <div className="progress flex-grow-1" style={{ height: "8px" }}>
                            <div
                              className="progress-bar bg-warning"
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                          <span className="text-muted" style={{ width: "30px" }}>
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="text-muted text-center">Aucune statistique</p>
              )}
            </div>
          </div>

          {/* Encouragement */}
          <div className="card mt-3">
            <div className="card-body text-center">
              <i className="bi bi-heart-fill text-danger fs-3 mb-2"></i>
              <p className="mb-0">
                Votre avis compte ! Aidez-nous a ameliorer nos services.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
