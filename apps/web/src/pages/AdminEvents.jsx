import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";

import { API_URL } from "../config";

// Labels pour les types et statuts
const EVENT_TYPES = [
  { value: "seminaire", label: "Séminaire" },
  { value: "conference", label: "Conférence" },
  { value: "soiree_entreprise", label: "Soirée d'entreprise" },
  { value: "team_building", label: "Team Building" },
  { value: "inauguration", label: "Inauguration" },
  { value: "autre", label: "Autre" }
];

const EVENT_STATUSES = [
  { value: "brouillon", label: "Brouillon", color: "secondary" },
  { value: "en_attente", label: "En attente", color: "warning" },
  { value: "accepte", label: "Accepté", color: "info" },
  { value: "en_cours", label: "En cours", color: "primary" },
  { value: "termine", label: "Terminé", color: "success" },
  { value: "annule", label: "Annulé", color: "danger" }
];

export default function AdminEvents() {
  const { token, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Redirection si pas admin
  useEffect(() => {
    if (!isAdmin) {
      navigate("/connexion");
    }
  }, [isAdmin, navigate]);

  // States
  const [events, setEvents] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filtres
  const [statusFilter, setStatusFilter] = useState("");

  // Modal creation/edition
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    event_type: "autre",
    theme: "",
    start_date: "",
    end_date: "",
    location: "",
    participants_count: "",
    image_url: "",
    status: "brouillon",
    is_public: false,
    client_id: ""
  });

  // Charger les evenements
  async function fetchEvents() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);

      const res = await fetch(`${API_URL}/api/events/admin?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Erreur chargement evenements");

      const data = await res.json();
      setEvents(data.events);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Charger les clients pour le select
  async function fetchClients() {
    try {
      const res = await fetch(`${API_URL}/api/clients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      }
    } catch (err) {
      console.error("Erreur chargement clients:", err);
    }
  }

  useEffect(() => {
    if (token) {
      fetchEvents();
      fetchClients();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, statusFilter]);

  // Gestion du formulaire
  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  // Ouvrir modal pour creation
  function openCreateModal() {
    setEditingEvent(null);
    setFormData({
      name: "",
      description: "",
      event_type: "autre",
      theme: "",
      start_date: "",
      end_date: "",
      location: "",
      participants_count: "",
      image_url: "",
      status: "brouillon",
      is_public: false,
      client_id: ""
    });
    setShowModal(true);
  }

  // Ouvrir modal pour edition
  function openEditModal(event) {
    setEditingEvent(event);
    setFormData({
      name: event.name || "",
      description: event.description || "",
      event_type: event.event_type || "autre",
      theme: event.theme || "",
      start_date: event.start_date ? event.start_date.slice(0, 16) : "",
      end_date: event.end_date ? event.end_date.slice(0, 16) : "",
      location: event.location || "",
      participants_count: event.participants_count || "",
      image_url: event.image_url || "",
      status: event.status || "brouillon",
      is_public: event.is_public || false,
      client_id: event.client_id || ""
    });
    setShowModal(true);
  }

  // Soumettre le formulaire
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const url = editingEvent
        ? `${API_URL}/api/events/${editingEvent.id}`
        : `${API_URL}/api/events`;

      const method = editingEvent ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          participants_count: formData.participants_count ? parseInt(formData.participants_count) : null,
          client_id: formData.client_id ? parseInt(formData.client_id) : null
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'enregistrement");
      }

      setSuccess(editingEvent ? "Evenement mis a jour" : "Evenement cree");
      setShowModal(false);
      fetchEvents();

    } catch (err) {
      setError(err.message);
    }
  }

  // Supprimer un evenement
  async function handleDelete(event) {
    if (!confirm(`Supprimer l'evenement "${event.name}" ?`)) return;

    try {
      const res = await fetch(`${API_URL}/api/events/${event.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Erreur lors de la suppression");

      setSuccess("Evenement supprime");
      fetchEvents();
    } catch (err) {
      setError(err.message);
    }
  }

  // Formater une date
  function formatDate(dateString) {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  // Obtenir le badge de statut
  function getStatusBadge(status) {
    const statusInfo = EVENT_STATUSES.find(s => s.value === status);
    return statusInfo
      ? <span className={`badge bg-${statusInfo.color}`}>{statusInfo.label}</span>
      : <span className="badge bg-secondary">{status}</span>;
  }

  if (!isAdmin) return null;

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Gestion des Évènements</h1>
        <button className="btn btn-primary" onClick={openCreateModal}>
          + Nouvel évènement
        </button>
      </div>

      {/* Messages */}
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Filtres */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row align-items-end">
            <div className="col-md-3">
              <label className="form-label">Filtrer par statut</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tous les statuts</option>
                {EVENT_STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <button
                className="btn btn-outline-secondary"
                onClick={() => setStatusFilter("")}
              >
                Reinitialiser
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des evenements */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status"></div>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-5 text-muted">
          Aucun evenement trouve.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead className="table-light">
              <tr>
                <th>Nom</th>
                <th>Type</th>
                <th>Client</th>
                <th>Date debut</th>
                <th>Lieu</th>
                <th>Statut</th>
                <th>Public</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map(event => (
                <tr key={event.id}>
                  <td>
                    <strong>{event.name}</strong>
                    {event.theme && <br />}
                    {event.theme && <small className="text-muted">{event.theme}</small>}
                  </td>
                  <td>
                    {EVENT_TYPES.find(t => t.value === event.event_type)?.label || event.event_type}
                  </td>
                  <td>
                    {event.client_name || <span className="text-muted">-</span>}
                  </td>
                  <td>{formatDate(event.start_date)}</td>
                  <td>{event.location}</td>
                  <td>{getStatusBadge(event.status)}</td>
                  <td>
                    {event.is_public ? (
                      <span className="badge bg-success">Oui</span>
                    ) : (
                      <span className="badge bg-secondary">Non</span>
                    )}
                  </td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      <Link
                        to={`/evenement/${event.id}`}
                        className="btn btn-outline-info"
                        title="Details et taches"
                      >
                        Details
                      </Link>
                      <button
                        className="btn btn-outline-primary"
                        onClick={() => openEditModal(event)}
                        title="Modifier"
                      >
                        Modifier
                      </button>
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => handleDelete(event)}
                        title="Supprimer"
                      >
                        Suppr.
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal creation/edition */}
      {showModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowModal(false)}
        >
          <div className="modal-dialog modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingEvent ? "Modifier l'evenement" : "Nouvel evenement"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    {/* Nom */}
                    <div className="col-md-8">
                      <label className="form-label">Nom de l'evenement *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    {/* Type */}
                    <div className="col-md-4">
                      <label className="form-label">Type *</label>
                      <select
                        className="form-select"
                        name="event_type"
                        value={formData.event_type}
                        onChange={handleChange}
                      >
                        {EVENT_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Theme */}
                    <div className="col-md-6">
                      <label className="form-label">Theme</label>
                      <input
                        type="text"
                        className="form-control"
                        name="theme"
                        value={formData.theme}
                        onChange={handleChange}
                        placeholder="Ex: Innovation, RSE, Digital..."
                      />
                    </div>

                    {/* Client */}
                    <div className="col-md-6">
                      <label className="form-label">Client</label>
                      <select
                        className="form-select"
                        name="client_id"
                        value={formData.client_id}
                        onChange={handleChange}
                      >
                        <option value="">-- Aucun client --</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.company_name} ({c.firstname} {c.lastname})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Dates */}
                    <div className="col-md-6">
                      <label className="form-label">Date et heure de debut *</label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        name="start_date"
                        value={formData.start_date}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Date et heure de fin *</label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        name="end_date"
                        value={formData.end_date}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    {/* Lieu */}
                    <div className="col-md-8">
                      <label className="form-label">Lieu *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    {/* Participants */}
                    <div className="col-md-4">
                      <label className="form-label">Nb participants</label>
                      <input
                        type="number"
                        className="form-control"
                        name="participants_count"
                        value={formData.participants_count}
                        onChange={handleChange}
                        min="1"
                      />
                    </div>

                    {/* Description */}
                    <div className="col-12">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="3"
                      ></textarea>
                    </div>

                    {/* Image URL */}
                    <div className="col-12">
                      <label className="form-label">URL de l'image</label>
                      <input
                        type="url"
                        className="form-control"
                        name="image_url"
                        value={formData.image_url}
                        onChange={handleChange}
                        placeholder="https://..."
                      />
                    </div>

                    {/* Statut */}
                    <div className="col-md-4">
                      <label className="form-label">Statut</label>
                      <select
                        className="form-select"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                      >
                        {EVENT_STATUSES.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Visibilite */}
                    <div className="col-md-4 d-flex align-items-end">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="is_public"
                          name="is_public"
                          checked={formData.is_public}
                          onChange={handleChange}
                        />
                        <label className="form-check-label" htmlFor="is_public">
                          Visible sur la page evenements
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingEvent ? "Enregistrer" : "Creer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
