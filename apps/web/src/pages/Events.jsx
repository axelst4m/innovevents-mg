import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import { API_URL } from "../config";

// Labels pour les types d'evenements
const EVENT_TYPES = {
  seminaire: "Séminaire",
  conference: "Conférence",
  soiree_entreprise: "Soirée d'entreprise",
  team_building: "Team Building",
  inauguration: "Inauguration",
  autre: "Autre"
};

// Labels pour les statuts
const EVENT_STATUS = {
  en_attente: "En attente",
  accepte: "Accepté",
  en_cours: "En cours",
  termine: "Terminé"
};

export default function Events() {
  // State pour les evenements
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State pour les filtres
  const [filters, setFilters] = useState({
    type: "",
    theme: "",
    start_date: "",
    end_date: ""
  });

  // State pour l'evenement selectionne (modal)
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Charger les evenements
  async function fetchEvents() {
    setLoading(true);
    setError("");

    try {
      // Construire l'URL avec les filtres
      const params = new URLSearchParams();
      if (filters.type) params.append("type", filters.type);
      if (filters.theme) params.append("theme", filters.theme);
      if (filters.start_date) params.append("start_date", filters.start_date);
      if (filters.end_date) params.append("end_date", filters.end_date);

      const url = `${API_URL}/api/events?${params.toString()}`;
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error("Erreur lors du chargement des evenements");
      }

      const data = await res.json();
      setEvents(data.events);

    } catch (err) {
      console.error("Erreur fetch events:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Charger au montage et quand les filtres changent
  useEffect(() => {
    fetchEvents();
  }, [filters]);

  // Gestion des changements de filtres
  function handleFilterChange(e) {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  }

  // Reset des filtres
  function resetFilters() {
    setFilters({
      type: "",
      theme: "",
      start_date: "",
      end_date: ""
    });
  }

  // Formater une date
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }

  return (
    <div className="container py-4">
      <h1 className="mb-4">Nos Évènements</h1>

      <p className="lead mb-4">
        Découvrez les événements que nous avons eu le plaisir d'organiser pour nos clients.
      </p>

      {/* Section filtres */}
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title mb-3">Filtrer les évènements</h5>
          <div className="row g-3">
            {/* Filtre par type */}
            <div className="col-md-3">
              <label htmlFor="type" className="form-label">Type d'évènement</label>
              <select
                id="type"
                name="type"
                className="form-select"
                value={filters.type}
                onChange={handleFilterChange}
              >
                <option value="">Tous les types</option>
                {Object.entries(EVENT_TYPES).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Filtre par theme */}
            <div className="col-md-3">
              <label htmlFor="theme" className="form-label">Thème</label>
              <input
                type="text"
                id="theme"
                name="theme"
                className="form-control"
                placeholder="Ex: Innovation, RSE..."
                value={filters.theme}
                onChange={handleFilterChange}
              />
            </div>

            {/* Filtre date debut */}
            <div className="col-md-2">
              <label htmlFor="start_date" className="form-label">Date début</label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                className="form-control"
                value={filters.start_date}
                onChange={handleFilterChange}
              />
            </div>

            {/* Filtre date fin */}
            <div className="col-md-2">
              <label htmlFor="end_date" className="form-label">Date fin</label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                className="form-control"
                value={filters.end_date}
                onChange={handleFilterChange}
              />
            </div>

            {/* Bouton reset */}
            <div className="col-md-2 d-flex align-items-end">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                onClick={resetFilters}
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Chargement */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      )}

      {/* Liste des evenements */}
      {!loading && events.length === 0 && (
        <div className="text-center py-5">
          <p className="text-muted">Aucun évènement trouvé avec ces critères.</p>
        </div>
      )}

      {!loading && events.length > 0 && (
        <div className="row g-4">
          {events.map(event => (
            <div key={event.id} className="col-md-6 col-lg-4">
              <div className="card h-100 shadow-sm">
                {/* Image de l'evenement */}
                {event.image_url ? (
                  <img
                    src={event.image_url}
                    className="card-img-top"
                    alt={event.name}
                    style={{ height: "200px", objectFit: "cover" }}
                  />
                ) : (
                  <div
                    className="card-img-top bg-secondary d-flex align-items-center justify-content-center"
                    style={{ height: "200px" }}
                  >
                    <span className="text-white">Pas d'image</span>
                  </div>
                )}

                <div className="card-body">
                  {/* Badge type */}
                  <span className="badge bg-primary mb-2">
                    {EVENT_TYPES[event.event_type] || event.event_type}
                  </span>

                  <h5 className="card-title">{event.name}</h5>

                  {event.theme && (
                    <p className="card-text text-muted small mb-2">
                      Thème : {event.theme}
                    </p>
                  )}

                  <p className="card-text small">
                    <strong>Date :</strong> {formatDate(event.start_date)}
                    {event.start_date !== event.end_date && (
                      <> au {formatDate(event.end_date)}</>
                    )}
                  </p>

                  <p className="card-text small">
                    <strong>Lieu :</strong> {event.location}
                  </p>

                  {event.participants_count && (
                    <p className="card-text small">
                      <strong>Participants :</strong> {event.participants_count}
                    </p>
                  )}
                </div>

                <div className="card-footer bg-transparent">
                  <button
                    className="btn btn-outline-primary btn-sm w-100"
                    onClick={() => setSelectedEvent(event)}
                  >
                    Voir les détails
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CTA demande de devis */}
      <div className="text-center mt-5 py-4 bg-light rounded">
        <h4>Vous souhaitez organiser un évènement similaire ?</h4>
        <p className="text-muted">
          Contactez-nous pour discuter de votre projet !
        </p>
        <Link to="/demande-devis" className="btn btn-primary btn-lg">
          Demander un devis
        </Link>
      </div>

      {/* Modal detail evenement */}
      {selectedEvent && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setSelectedEvent(null)}
        >
          <div className="modal-dialog modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{selectedEvent.name}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedEvent(null)}
                  aria-label="Fermer"
                ></button>
              </div>
              <div className="modal-body">
                {selectedEvent.image_url && (
                  <img
                    src={selectedEvent.image_url}
                    className="img-fluid rounded mb-3"
                    alt={selectedEvent.name}
                  />
                )}

                <div className="row">
                  <div className="col-md-6">
                    <p>
                      <strong>Type :</strong>{" "}
                      {EVENT_TYPES[selectedEvent.event_type] || selectedEvent.event_type}
                    </p>
                    {selectedEvent.theme && (
                      <p><strong>Thème :</strong> {selectedEvent.theme}</p>
                    )}
                    <p><strong>Lieu :</strong> {selectedEvent.location}</p>
                  </div>
                  <div className="col-md-6">
                    <p>
                      <strong>Date :</strong> {formatDate(selectedEvent.start_date)}
                      {selectedEvent.start_date !== selectedEvent.end_date && (
                        <> au {formatDate(selectedEvent.end_date)}</>
                      )}
                    </p>
                    {selectedEvent.participants_count && (
                      <p><strong>Participants :</strong> {selectedEvent.participants_count}</p>
                    )}
                    {selectedEvent.client_name && (
                      <p><strong>Client :</strong> {selectedEvent.client_name}</p>
                    )}
                  </div>
                </div>

                {selectedEvent.description && (
                  <div className="mt-3">
                    <h6>Description</h6>
                    <p>{selectedEvent.description}</p>
                  </div>
                )}

                {/* Section Prestations et Devis */}
                <div className="mt-4 p-3 bg-light rounded">
                  <h6>Prestations et Devis</h6>
                  <p className="text-muted mb-2">
                    Vous souhaitez organiser un évènement similaire ?
                  </p>
                  <Link
                    to="/demande-devis"
                    className="btn btn-primary"
                    onClick={() => setSelectedEvent(null)}
                  >
                    Demander un devis
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
