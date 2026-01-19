import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

const initial = {
  company_name: "",
  firstname: "",
  lastname: "",
  email: "",
  phone: "",
  location: "",
  event_type: "Séminaire",
  event_date: "",
  participants: "",
  message: "",
};

export default function QuoteRequest() {
  const { user, isAuthenticated } = useAuth();
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState({ state: "idle", message: "", errors: {} });

  // URL de l'API
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

  // Pre-remplir les champs si l'utilisateur est connecte
  useEffect(() => {
    if (isAuthenticated && user) {
      setForm(prev => ({
        ...prev,
        firstname: user.firstname || "",
        lastname: user.lastname || "",
        email: user.email || ""
      }));
    }
  }, [isAuthenticated, user]);

  
  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  function validate() {
    const errors = {};
    for (const [k, v] of Object.entries(form)) {
      if (String(v).trim() === "") errors[k] = "Champ obligatoire";
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Email invalide";
    const p = Number(form.participants);
    if (!Number.isInteger(p) || p <= 0) errors.participants = "Nombre invalide";
    return errors;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setStatus({ state: "idle", message: "", errors: {} });

    const errors = validate();
    if (Object.keys(errors).length) {
      setStatus({ state: "error", message: "Merci de corriger les erreurs.", errors });
      return;
    }

    try {
      setStatus({ state: "loading", message: "", errors: {} });

      const res = await fetch(`${apiUrl}/api/prospects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          participants: Number(form.participants),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const serverErrors = {};
        if (data?.errors?.length) {
          for (const err of data.errors) serverErrors[err.field] = err.message;
        }
        setStatus({
          state: "error",
          message: data?.error || data?.message || "Erreur lors de l’envoi.",
          errors: serverErrors,
        });
        return;
      }

      setStatus({ state: "success", message: data.message, errors: {} });
      setForm(initial);
    } catch (err) {
      setStatus({ state: "error", message: "Erreur réseau / serveur.", errors: {} });
    }
  }

  const err = (k) => status.errors?.[k];

  return (
    <div className="container py-4">
      <h1>Demande de devis</h1>
      <p className="text-muted">Tous les champs sont obligatoires.</p>

      {status.state === "success" && (
        <div className="alert alert-success" role="status">
          {status.message}
        </div>
      )}

      {status.state === "error" && status.message && (
        <div className="alert alert-danger" role="alert">
          {status.message}
        </div>
      )}

      <form onSubmit={onSubmit} noValidate>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Nom de l’entreprise</label>
            <input
              className={`form-control ${err("company_name") ? "is-invalid" : ""}`}
              value={form.company_name}
              onChange={(e) => setField("company_name", e.target.value)}
            />
            {err("company_name") && <div className="invalid-feedback">{err("company_name")}</div>}
          </div>

          <div className="col-md-6">
            <label className="form-label">Type d’événement</label>
            <select
              className={`form-select ${err("event_type") ? "is-invalid" : ""}`}
              value={form.event_type}
              onChange={(e) => setField("event_type", e.target.value)}
            >
              <option>Séminaire</option>
              <option>Conférence</option>
              <option>Soirée d'entreprise</option>
              <option>Autre</option>
            </select>
            {err("event_type") && <div className="invalid-feedback">{err("event_type")}</div>}
          </div>

          <div className="col-md-6">
            <label className="form-label">Prénom</label>
            <input
              className={`form-control ${err("firstname") ? "is-invalid" : ""}`}
              value={form.firstname}
              onChange={(e) => setField("firstname", e.target.value)}
            />
            {err("firstname") && <div className="invalid-feedback">{err("firstname")}</div>}
          </div>

          <div className="col-md-6">
            <label className="form-label">Nom</label>
            <input
              className={`form-control ${err("lastname") ? "is-invalid" : ""}`}
              value={form.lastname}
              onChange={(e) => setField("lastname", e.target.value)}
            />
            {err("lastname") && <div className="invalid-feedback">{err("lastname")}</div>}
          </div>

          <div className="col-md-6">
            <label className="form-label">Email</label>
            <input
              type="email"
              className={`form-control ${err("email") ? "is-invalid" : ""}`}
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
            />
            {err("email") && <div className="invalid-feedback">{err("email")}</div>}
          </div>

          <div className="col-md-6">
            <label className="form-label">Téléphone</label>
            <input
              className={`form-control ${err("phone") ? "is-invalid" : ""}`}
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
            />
            {err("phone") && <div className="invalid-feedback">{err("phone")}</div>}
          </div>

          <div className="col-md-6">
            <label className="form-label">Lieu</label>
            <input
              className={`form-control ${err("location") ? "is-invalid" : ""}`}
              value={form.location}
              onChange={(e) => setField("location", e.target.value)}
            />
            {err("location") && <div className="invalid-feedback">{err("location")}</div>}
          </div>

          <div className="col-md-3">
            <label className="form-label">Date souhaitée</label>
            <input
              type="date"
              className={`form-control ${err("event_date") ? "is-invalid" : ""}`}
              value={form.event_date}
              onChange={(e) => setField("event_date", e.target.value)}
            />
            {err("event_date") && <div className="invalid-feedback">{err("event_date")}</div>}
          </div>

          <div className="col-md-3">
            <label className="form-label">Participants</label>
            <input
              type="number"
              min="1"
              className={`form-control ${err("participants") ? "is-invalid" : ""}`}
              value={form.participants}
              onChange={(e) => setField("participants", e.target.value)}
            />
            {err("participants") && <div className="invalid-feedback">{err("participants")}</div>}
          </div>

          <div className="col-12">
            <label className="form-label">Le besoin en quelques mots</label>
            <textarea
              rows="4"
              className={`form-control ${err("message") ? "is-invalid" : ""}`}
              value={form.message}
              onChange={(e) => setField("message", e.target.value)}
            />
            {err("message") && <div className="invalid-feedback">{err("message")}</div>}
          </div>

          <div className="col-12 d-flex gap-2">
            <button className="btn minitel-cta" disabled={status.state === "loading"}>
              {status.state === "loading" ? "Envoi..." : "Envoyer la demande"}
            </button>
            <button
              type="button"
              className="btn btn-outline-dark"
              onClick={() => {
                setForm(initial);
                setStatus({ state: "idle", message: "", errors: {} });
              }}
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}