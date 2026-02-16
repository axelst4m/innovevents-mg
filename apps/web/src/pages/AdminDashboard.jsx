import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";

import { API_URL } from "../config";

export default function AdminDashboard() {
  const { token, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Redirection si pas admin
  useEffect(() => {
    if (!isAdmin) {
      navigate("/connexion");
    }
  }, [isAdmin, navigate]);

  // Charger les stats
  async function fetchStats() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Erreur chargement statistiques");

      const data = await res.json();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token && isAdmin) {
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAdmin]);

  // Formatage
  function formatMoney(amount) {
    if (!amount) return "0 €";
    return parseFloat(amount).toLocaleString("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }) + " €";
  }

  function formatDate(dateStr) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  }

  function getStatusBadge(status, _type) {
    const colors = {
      // Prospects
      a_contacter: "warning",
      contacte: "info",
      qualifie: "success",
      // Devis
      brouillon: "secondary",
      envoye: "info",
      accepte: "success",
      refuse: "danger",
      modification: "warning",
      // Events
      en_cours: "primary",
      termine: "success",
      annule: "danger"
    };
    return <span className={`badge bg-${colors[status] || "secondary"}`}>{status}</span>;
  }

  if (!isAdmin) return null;

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Dashboard Admin</h1>
        <button className="btn btn-outline-primary" onClick={fetchStats} disabled={loading}>
          Actualiser
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border"></div>
          <p className="mt-2">Chargement des statistiques...</p>
        </div>
      ) : stats ? (
        <>
          {/* Cartes KPI */}
          <div className="row g-4 mb-4">
            {/* Prospects */}
            <div className="col-md-6 col-lg-3">
              <div className="card h-100 border-warning">
                <div className="card-body">
                  <h6 className="card-subtitle mb-2 text-muted">Prospects</h6>
                  <h2 className="card-title mb-3">{stats.prospects.total}</h2>
                  <div className="d-flex justify-content-between small">
                    <span className="text-warning">{stats.prospects.a_contacter} a contacter</span>
                    <span className="text-success">{stats.prospects.qualifie} qualifies</span>
                  </div>
                  <hr />
                  <small className="text-muted">
                    +{stats.prospects.cette_semaine} cette semaine
                  </small>
                </div>
                <div className="card-footer bg-transparent">
                  <Link to="/admin/prospects" className="btn btn-sm btn-outline-warning w-100">
                    Voir les prospects
                  </Link>
                </div>
              </div>
            </div>

            {/* Clients */}
            <div className="col-md-6 col-lg-3">
              <div className="card h-100 border-primary">
                <div className="card-body">
                  <h6 className="card-subtitle mb-2 text-muted">Clients</h6>
                  <h2 className="card-title mb-3">{stats.clients.total}</h2>
                  <p className="mb-0 small text-muted">
                    +{stats.clients.ce_mois} ce mois
                  </p>
                </div>
              </div>
            </div>

            {/* Devis */}
            <div className="col-md-6 col-lg-3">
              <div className="card h-100 border-success">
                <div className="card-body">
                  <h6 className="card-subtitle mb-2 text-muted">Devis</h6>
                  <h2 className="card-title mb-3">{stats.devis.total}</h2>
                  <div className="d-flex justify-content-between small">
                    <span className="text-info">{stats.devis.envoye} en attente</span>
                    <span className="text-success">{stats.devis.accepte} acceptes</span>
                  </div>
                  <hr />
                  <small className="text-muted">
                    {stats.devis.brouillon} brouillons
                  </small>
                </div>
                <div className="card-footer bg-transparent">
                  <Link to="/admin/devis" className="btn btn-sm btn-outline-success w-100">
                    Gerer les devis
                  </Link>
                </div>
              </div>
            </div>

            {/* CA */}
            <div className="col-md-6 col-lg-3">
              <div className="card h-100 border-info bg-light">
                <div className="card-body">
                  <h6 className="card-subtitle mb-2 text-muted">Chiffre d'affaires</h6>
                  <h2 className="card-title mb-3 text-success">{formatMoney(stats.devis.ca_accepte)}</h2>
                  <p className="mb-0 small">
                    <span className="text-info">{formatMoney(stats.devis.ca_en_attente)}</span> en attente
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Evenements */}
          <div className="row g-4 mb-4">
            <div className="col-12">
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Evenements</h5>
                  <Link to="/admin/evenements" className="btn btn-sm btn-outline-primary">
                    Gerer
                  </Link>
                </div>
                <div className="card-body">
                  <div className="row text-center">
                    <div className="col">
                      <h3>{stats.events.total}</h3>
                      <small className="text-muted">Total</small>
                    </div>
                    <div className="col">
                      <h3 className="text-primary">{stats.events.en_cours}</h3>
                      <small className="text-muted">En cours</small>
                    </div>
                    <div className="col">
                      <h3 className="text-success">{stats.events.termine}</h3>
                      <small className="text-muted">Termines</small>
                    </div>
                    <div className="col">
                      <h3 className="text-warning">{stats.events.a_venir_30j}</h3>
                      <small className="text-muted">A venir (30j)</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tableaux recents */}
          <div className="row g-4">
            {/* Derniers prospects */}
            <div className="col-lg-4">
              <div className="card h-100">
                <div className="card-header">
                  <h6 className="mb-0">Derniers prospects</h6>
                </div>
                <div className="card-body p-0">
                  {stats.derniers_prospects.length === 0 ? (
                    <p className="text-muted text-center py-3">Aucun prospect</p>
                  ) : (
                    <ul className="list-group list-group-flush">
                      {stats.derniers_prospects.map(p => (
                        <li key={p.id} className="list-group-item d-flex justify-content-between align-items-start">
                          <div>
                            <strong>{p.company_name}</strong>
                            <br />
                            <small className="text-muted">{p.firstname} {p.lastname}</small>
                          </div>
                          {getStatusBadge(p.status)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Derniers devis */}
            <div className="col-lg-4">
              <div className="card h-100">
                <div className="card-header">
                  <h6 className="mb-0">Derniers devis</h6>
                </div>
                <div className="card-body p-0">
                  {stats.derniers_devis.length === 0 ? (
                    <p className="text-muted text-center py-3">Aucun devis</p>
                  ) : (
                    <ul className="list-group list-group-flush">
                      {stats.derniers_devis.map(d => (
                        <li key={d.id} className="list-group-item">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <strong>{d.reference}</strong>
                              <br />
                              <small className="text-muted">{d.client_company}</small>
                            </div>
                            <div className="text-end">
                              {getStatusBadge(d.status)}
                              <br />
                              <small className="fw-bold">{formatMoney(d.total_ttc)}</small>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Notes récentes */}
            <div className="col-lg-4">
              <div className="card h-100">
                <div className="card-header">
                  <h6 className="mb-0">Notes recentes</h6>
                </div>
                <div className="card-body p-0">
                  {!stats.dernieres_notes || stats.dernieres_notes.length === 0 ? (
                    <p className="text-muted text-center py-3">Aucune note</p>
                  ) : (
                    <ul className="list-group list-group-flush">
                      {stats.dernieres_notes.map(n => (
                        <li key={n.id} className="list-group-item">
                          <div>
                            <small className="text-muted">
                              {n.author_firstname} {n.author_lastname} sur <strong>{n.event_name}</strong>
                            </small>
                            <p className="mb-0 mt-1" style={{ fontSize: "0.9rem" }}>
                              {n.content.length > 80 ? n.content.slice(0, 80) + "..." : n.content}
                            </p>
                            <small className="text-muted">{formatDate(n.created_at)}</small>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Prochains evenements */}
          <div className="row g-4 mt-1">
            <div className="col-lg-6">
              <div className="card h-100">
                <div className="card-header">
                  <h6 className="mb-0">Prochains evenements</h6>
                </div>
                <div className="card-body p-0">
                  {stats.prochains_events.length === 0 ? (
                    <p className="text-muted text-center py-3">Aucun evenement a venir</p>
                  ) : (
                    <ul className="list-group list-group-flush">
                      {stats.prochains_events.map(e => (
                        <li key={e.id} className="list-group-item">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <strong>{e.name}</strong>
                              <br />
                              <small className="text-muted">{e.location}</small>
                            </div>
                            <div className="text-end">
                              <small className="text-primary">{formatDate(e.start_date)}</small>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
