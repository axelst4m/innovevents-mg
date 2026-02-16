import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

import { API_URL } from "../config";

export default function Contact() {
  const { user, token } = useAuth();

  // Pre-remplir si l'utilisateur est connecte
  const [form, setForm] = useState({
    firstname: user?.firstname || "",
    lastname: user?.lastname || "",
    email: user?.email || "",
    phone: "",
    subject: "",
    message: ""
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Effacer l'erreur du champ
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setServerError("");
    setSuccess(false);

    try {
      const headers = {
        "Content-Type": "application/json"
      };

      // Ajouter le token si connecte
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`${API_URL}/api/contact`, {
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
          setErrors(errMap);
        } else {
          setServerError(data.error || "Erreur lors de l'envoi");
        }
        return;
      }

      // Succes
      setSuccess(true);
      setForm({
        firstname: user?.firstname || "",
        lastname: user?.lastname || "",
        email: user?.email || "",
        phone: "",
        subject: "",
        message: ""
      });

    } catch {
      setServerError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <h1 className="mb-4">Nous contacter</h1>
          <p className="text-muted mb-4">
            Une question ? Une demande particuliere ? N'hesitez pas a nous ecrire,
            nous vous repondrons dans les meilleurs delais.
          </p>

          {/* Informations de contact */}
          <div className="row mb-5">
            <div className="col-md-4 mb-3">
              <div className="card h-100 text-center">
                <div className="card-body">
                  <i className="bi bi-geo-alt fs-2 text-primary mb-2" aria-hidden="true"></i>
                  <h6>Adresse</h6>
                  <small className="text-muted">
                    123 Rue de l'Evenementiel<br />
                    13000 Marseille
                  </small>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-3">
              <div className="card h-100 text-center">
                <div className="card-body">
                  <i className="bi bi-telephone fs-2 text-primary mb-2" aria-hidden="true"></i>
                  <h6>Telephone</h6>
                  <small className="text-muted">
                    04 91 XX XX XX
                  </small>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-3">
              <div className="card h-100 text-center">
                <div className="card-body">
                  <i className="bi bi-envelope fs-2 text-primary mb-2" aria-hidden="true"></i>
                  <h6>Email</h6>
                  <small className="text-muted">
                    contact@innovevents.fr
                  </small>
                </div>
              </div>
            </div>
          </div>

          {/* Formulaire */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Envoyer un message</h5>
            </div>
            <div className="card-body">
              {success && (
                <div className="alert alert-success" role="status" aria-live="polite">
                  <i className="bi bi-check-circle me-2" aria-hidden="true"></i>
                  Merci pour votre message ! Nous vous repondrons dans les meilleurs delais.
                </div>
              )}

              {serverError && (
                <div className="alert alert-danger" role="alert" aria-live="assertive">{serverError}</div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="contact-firstname" className="form-label">Prenom *</label>
                    <input
                      type="text"
                      id="contact-firstname"
                      name="firstname"
                      className={`form-control ${errors.firstname ? "is-invalid" : ""}`}
                      value={form.firstname}
                      onChange={handleChange}
                      disabled={loading}
                      required
                      aria-describedby={errors.firstname ? "contact-firstname-error" : undefined}
                    />
                    {errors.firstname && (
                      <div id="contact-firstname-error" className="invalid-feedback">{errors.firstname}</div>
                    )}
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="contact-lastname" className="form-label">Nom *</label>
                    <input
                      type="text"
                      id="contact-lastname"
                      name="lastname"
                      className={`form-control ${errors.lastname ? "is-invalid" : ""}`}
                      value={form.lastname}
                      onChange={handleChange}
                      disabled={loading}
                      required
                      aria-describedby={errors.lastname ? "contact-lastname-error" : undefined}
                    />
                    {errors.lastname && (
                      <div id="contact-lastname-error" className="invalid-feedback">{errors.lastname}</div>
                    )}
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="contact-email" className="form-label">Email *</label>
                    <input
                      type="email"
                      id="contact-email"
                      name="email"
                      className={`form-control ${errors.email ? "is-invalid" : ""}`}
                      value={form.email}
                      onChange={handleChange}
                      disabled={loading}
                      required
                      aria-describedby={errors.email ? "contact-email-error" : undefined}
                    />
                    {errors.email && (
                      <div id="contact-email-error" className="invalid-feedback">{errors.email}</div>
                    )}
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="contact-phone" className="form-label">Telephone</label>
                    <input
                      type="tel"
                      id="contact-phone"
                      name="phone"
                      className="form-control"
                      value={form.phone}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="Optionnel"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="contact-subject" className="form-label">Sujet *</label>
                  <select
                    id="contact-subject"
                    name="subject"
                    className={`form-select ${errors.subject ? "is-invalid" : ""}`}
                    value={form.subject}
                    onChange={handleChange}
                    disabled={loading}
                    required
                    aria-describedby={errors.subject ? "contact-subject-error" : undefined}
                  >
                    <option value="">-- Choisir un sujet --</option>
                    <option value="Information generale">Information generale</option>
                    <option value="Demande de devis">Demande de devis</option>
                    <option value="Question sur un evenement">Question sur un evenement</option>
                    <option value="Partenariat">Partenariat</option>
                    <option value="Reclamation">Reclamation</option>
                    <option value="Autre">Autre</option>
                  </select>
                  {errors.subject && (
                    <div id="contact-subject-error" className="invalid-feedback">{errors.subject}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="contact-message" className="form-label">Message *</label>
                  <textarea
                    id="contact-message"
                    name="message"
                    className={`form-control ${errors.message ? "is-invalid" : ""}`}
                    rows="5"
                    value={form.message}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Decrivez votre demande..."
                    required
                    aria-describedby={errors.message ? "contact-message-error" : undefined}
                  ></textarea>
                  {errors.message && (
                    <div id="contact-message-error" className="invalid-feedback">{errors.message}</div>
                  )}
                </div>

                <div className="d-grid">
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send me-2" aria-hidden="true"></i>
                        Envoyer le message
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Note RGPD */}
          <p className="text-muted small mt-3">
            <i className="bi bi-shield-check me-1" aria-hidden="true"></i>
            Vos donnees personnelles sont utilisees uniquement pour repondre a votre demande
            conformement a notre politique de confidentialite.
          </p>
        </div>
      </div>
    </div>
  );
}
