import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

import { API_URL } from "../config";

// Statuts des devis
const DEVIS_STATUSES = [
  { value: "brouillon", label: "Brouillon", color: "secondary" },
  { value: "envoye", label: "En attente de votre reponse", color: "info" },
  { value: "en_etude", label: "En cours d'etude", color: "warning" },
  { value: "modification", label: "Modification demandee", color: "warning" },
  { value: "accepte", label: "Accepte", color: "success" },
  { value: "refuse", label: "Refuse", color: "danger" }
];

export default function ClientDevis() {
  const { token, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Redirection si pas connecte
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/connexion");
    }
  }, [isAuthenticated, navigate]);

  // States
  const [devisList, setDevisList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal detail
  const [showModal, setShowModal] = useState(false);
  const [selectedDevis, setSelectedDevis] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Modal modification
  const [showModifModal, setShowModifModal] = useState(false);
  const [modifReason, setModifReason] = useState("");

  // Charger les devis du client
  async function fetchDevis() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/devis/client`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Erreur chargement devis");

      const data = await res.json();
      setDevisList(data.devis || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      fetchDevis();
    }
  }, [token]);

  // Voir le detail
  async function viewDevis(devis) {
    setLoadingDetail(true);
    setShowModal(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/devis/${devis.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Erreur chargement detail");

      const data = await res.json();
      setSelectedDevis(data.devis);
    } catch (err) {
      setError(err.message);
      setShowModal(false);
    } finally {
      setLoadingDetail(false);
    }
  }

  // Accepter le devis
  async function acceptDevis() {
    if (!confirm("Confirmez-vous l'acceptation de ce devis ?")) return;

    try {
      const res = await fetch(`${API_URL}/api/devis/${selectedDevis.id}/accept`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erreur");

      setSuccess("Devis accepte ! L'equipe Innov'Events vous contactera prochainement.");
      setShowModal(false);
      fetchDevis();
    } catch (err) {
      setError(err.message);
    }
  }

  // Refuser le devis
  async function refuseDevis() {
    if (!confirm("Confirmez-vous le refus de ce devis ?")) return;

    try {
      const res = await fetch(`${API_URL}/api/devis/${selectedDevis.id}/refuse`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erreur");

      setSuccess("Devis refuse.");
      setShowModal(false);
      fetchDevis();
    } catch (err) {
      setError(err.message);
    }
  }

  // Demander une modification
  async function requestModification() {
    if (!modifReason.trim()) {
      setError("Veuillez indiquer le motif de la modification");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/devis/${selectedDevis.id}/request-modification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: modifReason })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erreur");

      setSuccess("Demande de modification envoyee. L'equipe reviendra vers vous.");
      setShowModifModal(false);
      setShowModal(false);
      setModifReason("");
      fetchDevis();
    } catch (err) {
      setError(err.message);
    }
  }

  // Telecharger le PDF
  async function downloadPDF(devisId, reference) {
    try {
      const res = await fetch(`${API_URL}/api/devis/${devisId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Erreur generation PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `devis-${reference}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      setError(err.message);
    }
  }

  // Formatage
  function formatDate(dateStr) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("fr-FR");
  }

  function formatMoney(amount) {
    if (!amount) return "0,00 €";
    return parseFloat(amount).toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + " €";
  }

  function getStatusBadge(status) {
    const info = DEVIS_STATUSES.find(s => s.value === status);
    return info
      ? <span className={`badge bg-${info.color}`}>{info.label}</span>
      : <span className="badge bg-secondary">{status}</span>;
  }

  // Verifier si le client peut repondre
  function canRespond(status) {
    return ["envoye", "en_etude"].includes(status);
  }

  if (!isAuthenticated) return null;

  return (
    <div className="container py-4">
      <h1 className="mb-4">Mes Devis</h1>

      {/* Messages */}
      {error && (
        <div className="alert alert-danger alert-dismissible">
          {error}
          <button type="button" className="btn-close" onClick={() => setError("")}></button>
        </div>
      )}
      {success && (
        <div className="alert alert-success alert-dismissible">
          {success}
          <button type="button" className="btn-close" onClick={() => setSuccess("")}></button>
        </div>
      )}

      {/* Contenu */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border"></div>
          <p className="mt-2">Chargement de vos devis...</p>
        </div>
      ) : devisList.length === 0 ? (
        <div className="text-center py-5">
          <div className="mb-3">
            <svg width="64" height="64" fill="currentColor" className="text-muted" viewBox="0 0 16 16">
              <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5z"/>
              <path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5L9.5 0zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z"/>
            </svg>
          </div>
          <h5 className="text-muted">Aucun devis pour le moment</h5>
          <p className="text-muted">
            Vous n'avez pas encore de devis. Faites une demande de devis pour commencer !
          </p>
          <a href="/demande-devis" className="btn btn-primary">
            Demander un devis
          </a>
        </div>
      ) : (
        <div className="row g-4">
          {devisList.map(devis => (
            <div key={devis.id} className="col-md-6 col-lg-4">
              <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <strong>{devis.reference}</strong>
                  {getStatusBadge(devis.status)}
                </div>
                <div className="card-body">
                  {devis.event_name && (
                    <p className="mb-2">
                      <strong>Evenement:</strong> {devis.event_name}
                    </p>
                  )}
                  <p className="mb-2">
                    <strong>Date:</strong> {formatDate(devis.created_at)}
                  </p>
                  {devis.valid_until && (
                    <p className="mb-2">
                      <strong>Valide jusqu'au:</strong> {formatDate(devis.valid_until)}
                    </p>
                  )}
                  <p className="mb-0 fs-5">
                    <strong>Total:</strong> {formatMoney(devis.total_ttc)}
                  </p>
                </div>
                <div className="card-footer">
                  <button
                    className="btn btn-primary w-100"
                    onClick={() => viewDevis(devis)}
                  >
                    Voir le detail
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal detail devis */}
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
                  Devis {selectedDevis?.reference}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                {loadingDetail ? (
                  <div className="text-center py-4">
                    <div className="spinner-border"></div>
                  </div>
                ) : selectedDevis ? (
                  <>
                    {/* Statut */}
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <div>
                        <p className="mb-0 text-muted">Statut</p>
                        <div className="fs-5">{getStatusBadge(selectedDevis.status)}</div>
                      </div>
                      <div className="text-end">
                        <p className="mb-0 text-muted">Date</p>
                        <p className="mb-0">{formatDate(selectedDevis.created_at)}</p>
                      </div>
                    </div>

                    {/* Evenement */}
                    {selectedDevis.event_name && (
                      <div className="alert alert-light">
                        <strong>Evenement:</strong> {selectedDevis.event_name}
                        {selectedDevis.event_start_date && (
                          <span> - {formatDate(selectedDevis.event_start_date)}</span>
                        )}
                        {selectedDevis.event_location && (
                          <span> - {selectedDevis.event_location}</span>
                        )}
                      </div>
                    )}

                    {/* Prestations */}
                    <h6 className="border-bottom pb-2 mb-3">Detail des prestations</h6>
                    <table className="table table-sm">
                      <thead className="table-light">
                        <tr>
                          <th>Description</th>
                          <th className="text-center">Qte</th>
                          <th className="text-end">Prix HT</th>
                          <th className="text-end">Total TTC</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDevis.lignes?.map(ligne => (
                          <tr key={ligne.id}>
                            <td>
                              {ligne.label}
                              {ligne.description && (
                                <small className="d-block text-muted">{ligne.description}</small>
                              )}
                            </td>
                            <td className="text-center">{ligne.quantity}</td>
                            <td className="text-end">{formatMoney(ligne.unit_price_ht)}</td>
                            <td className="text-end">{formatMoney(ligne.total_ttc)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="3" className="text-end"><strong>Total HT:</strong></td>
                          <td className="text-end">{formatMoney(selectedDevis.total_ht)}</td>
                        </tr>
                        <tr>
                          <td colSpan="3" className="text-end"><strong>TVA:</strong></td>
                          <td className="text-end">{formatMoney(selectedDevis.total_tva)}</td>
                        </tr>
                        <tr className="table-primary">
                          <td colSpan="3" className="text-end"><strong>Total TTC:</strong></td>
                          <td className="text-end fw-bold fs-5">{formatMoney(selectedDevis.total_ttc)}</td>
                        </tr>
                      </tfoot>
                    </table>

                    {/* Validite */}
                    {selectedDevis.valid_until && (
                      <p className="text-muted small">
                        Ce devis est valable jusqu'au {formatDate(selectedDevis.valid_until)}.
                      </p>
                    )}

                    {/* Message personnalise */}
                    {selectedDevis.custom_message && (
                      <div className="p-3 bg-light rounded mt-3">
                        <em>{selectedDevis.custom_message}</em>
                      </div>
                    )}

                    {/* Actions selon statut */}
                    {canRespond(selectedDevis.status) && (
                      <div className="mt-4 p-3 border rounded bg-light">
                        <h6>Votre decision</h6>
                        <p className="text-muted small mb-3">
                          Veuillez choisir une action pour ce devis :
                        </p>
                        <div className="d-flex gap-2 flex-wrap">
                          <button
                            className="btn btn-success"
                            onClick={acceptDevis}
                          >
                            Accepter ce devis
                          </button>
                          <button
                            className="btn btn-outline-warning"
                            onClick={() => setShowModifModal(true)}
                          >
                            Demander une modification
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={refuseDevis}
                          >
                            Refuser
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Message si deja traite */}
                    {selectedDevis.status === "accepte" && (
                      <div className="alert alert-success mt-3">
                        <strong>Devis accepte !</strong><br />
                        L'equipe Innov'Events vous contactera pour organiser la suite.
                      </div>
                    )}

                    {selectedDevis.status === "refuse" && (
                      <div className="alert alert-secondary mt-3">
                        Ce devis a ete refuse.
                      </div>
                    )}

                    {selectedDevis.status === "modification" && (
                      <div className="alert alert-warning mt-3">
                        <strong>Modification demandee</strong><br />
                        Votre demande: <em>{selectedDevis.modification_reason}</em><br />
                        L'equipe travaille sur une nouvelle version.
                      </div>
                    )}
                  </>
                ) : null}
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => downloadPDF(selectedDevis.id, selectedDevis.reference)}
                >
                  Telecharger en PDF
                </button>
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal demande de modification */}
      {showModifModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
          onClick={() => setShowModifModal(false)}
        >
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Demander une modification</h5>
                <button type="button" className="btn-close" onClick={() => setShowModifModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Decrivez les modifications que vous souhaitez apporter a ce devis :</p>
                <textarea
                  className="form-control"
                  rows="4"
                  value={modifReason}
                  onChange={(e) => setModifReason(e.target.value)}
                  placeholder="Ex: Je souhaiterais ajouter une prestation photo, reduire le nombre de participants..."
                ></textarea>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModifModal(false)}>
                  Annuler
                </button>
                <button className="btn btn-warning" onClick={requestModification}>
                  Envoyer la demande
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
