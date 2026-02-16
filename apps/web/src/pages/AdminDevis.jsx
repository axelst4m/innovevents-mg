import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";

import { API_URL } from "../config";

// Statuts des devis
const DEVIS_STATUSES = [
  { value: "brouillon", label: "Brouillon", color: "secondary" },
  { value: "envoye", label: "Envoyé", color: "info" },
  { value: "en_etude", label: "En étude", color: "warning" },
  { value: "modification", label: "Modification demandée", color: "warning" },
  { value: "accepte", label: "Accepté", color: "success" },
  { value: "refuse", label: "Refusé", color: "danger" }
];

export default function AdminDevis() {
  const { token, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Redirection si pas admin
  useEffect(() => {
    if (!isAdmin) {
      navigate("/connexion");
    }
  }, [isAdmin, navigate]);

  // States
  const [devisList, setDevisList] = useState([]);
  const [clients, setClients] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filtres
  const [statusFilter, setStatusFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");

  // Modal creation
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    client_id: "",
    event_id: "",
    valid_until: "",
    custom_message: "",
    lignes: []
  });

  // Modal detail
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDevis, setSelectedDevis] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Ligne temporaire pour ajout
  const [newLigne, setNewLigne] = useState({
    label: "",
    description: "",
    quantity: 1,
    unit_price_ht: "",
    tva_rate: 20
  });

  // Charger les devis
  async function fetchDevis() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (clientFilter) params.append("client_id", clientFilter);

      const res = await fetch(`${API_URL}/api/devis?${params.toString()}`, {
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

  // Charger les clients
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

  // Charger les evenements
  async function fetchEvents() {
    try {
      const res = await fetch(`${API_URL}/api/events/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error("Erreur chargement events:", err);
    }
  }

  // Ouvrir automatiquement le modal si ?new=1 dans l'URL
  useEffect(() => {
    if (searchParams.get("new") === "1" && clients.length > 0) {
      const clientId = searchParams.get("client_id") || "";
      setFormData({
        client_id: clientId,
        event_id: "",
        valid_until: "",
        custom_message: "",
        lignes: []
      });
      setShowModal(true);
      // Nettoyer l'URL
      setSearchParams({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, clients]);

  // Ouvrir automatiquement le detail si ?view=ID dans l'URL
  useEffect(() => {
    const viewId = searchParams.get("view");
    if (viewId && devisList.length > 0) {
      viewDevis({ id: parseInt(viewId) });
      // Nettoyer l'URL
      setSearchParams({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, devisList]);

  useEffect(() => {
    if (token) {
      fetchDevis();
      fetchClients();
      fetchEvents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, statusFilter, clientFilter]);

  // Gestion formulaire
  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  function handleLigneChange(e) {
    const { name, value } = e.target;
    setNewLigne(prev => ({ ...prev, [name]: value }));
  }

  // Ajouter une ligne au formulaire
  function addLigne() {
    if (!newLigne.label || !newLigne.unit_price_ht) {
      setError("Label et prix HT requis pour la ligne");
      return;
    }

    setFormData(prev => ({
      ...prev,
      lignes: [...prev.lignes, { ...newLigne }]
    }));

    setNewLigne({
      label: "",
      description: "",
      quantity: 1,
      unit_price_ht: "",
      tva_rate: 20
    });
    setError("");
  }

  // Supprimer une ligne du formulaire
  function removeLigne(index) {
    setFormData(prev => ({
      ...prev,
      lignes: prev.lignes.filter((_, i) => i !== index)
    }));
  }

  // Ouvrir modal creation
  function openCreateModal() {
    setFormData({
      client_id: "",
      event_id: "",
      valid_until: "",
      custom_message: "",
      lignes: []
    });
    setShowModal(true);
  }

  // Soumettre creation
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.client_id) {
      setError("Veuillez selectionner un client");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/devis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la creation");
      }

      setSuccess("Devis cree avec succes (Ref: " + data.devis.reference + ")");
      setShowModal(false);
      fetchDevis();

    } catch (err) {
      setError(err.message);
    }
  }

  // Voir detail d'un devis
  async function viewDevis(devis) {
    setLoadingDetail(true);
    setShowDetailModal(true);
    try {
      const res = await fetch(`${API_URL}/api/devis/${devis.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Erreur chargement detail");
      const data = await res.json();
      setSelectedDevis(data.devis);
    } catch (err) {
      setError(err.message);
      setShowDetailModal(false);
    } finally {
      setLoadingDetail(false);
    }
  }

  // Envoyer le devis
  async function sendDevis(devisId) {
    if (!confirm("Envoyer ce devis au client ?")) return;

    try {
      const res = await fetch(`${API_URL}/api/devis/${devisId}/send`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erreur envoi");

      // Afficher un message different selon si le client a un compte ou non
      if (data.client_has_account) {
        setSuccess("Devis envoye a " + data.sent_to);
      } else {
        setError("");
        // Utiliser alert pour que le message soit bien visible
        alert(data.message);
        setSuccess("Devis envoye a " + data.sent_to);
      }
      fetchDevis();
      setShowDetailModal(false);
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

  // Ajouter une ligne a un devis existant
  async function addLigneToDevis(devisId) {
    if (!newLigne.label || !newLigne.unit_price_ht) {
      setError("Label et prix HT requis");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/devis/${devisId}/lignes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newLigne)
      });

      if (!res.ok) throw new Error("Erreur ajout ligne");

      setNewLigne({
        label: "",
        description: "",
        quantity: 1,
        unit_price_ht: "",
        tva_rate: 20
      });

      // Recharger le detail
      viewDevis({ id: devisId });
      setSuccess("Ligne ajoutee");
    } catch (err) {
      setError(err.message);
    }
  }

  // Supprimer une ligne existante
  async function deleteLigne(devisId, ligneId) {
    if (!confirm("Supprimer cette ligne ?")) return;

    try {
      const res = await fetch(`${API_URL}/api/devis/${devisId}/lignes/${ligneId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Erreur suppression");

      viewDevis({ id: devisId });
      setSuccess("Ligne supprimee");
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

  // Calculer total previsionnel des lignes
  function calcTotalLignes(lignes) {
    return lignes.reduce((sum, l) => {
      const qty = parseInt(l.quantity) || 1;
      const price = parseFloat(l.unit_price_ht) || 0;
      const tva = parseFloat(l.tva_rate) || 20;
      const ht = qty * price;
      return sum + ht + (ht * tva / 100);
    }, 0);
  }

  if (!isAdmin) return null;

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Gestion des Devis</h1>
        <button className="btn btn-primary" onClick={openCreateModal}>
          + Nouveau devis
        </button>
      </div>

      {/* Messages */}
      {error && <div className="alert alert-danger alert-dismissible">
        {error}
        <button type="button" className="btn-close" onClick={() => setError("")}></button>
      </div>}
      {success && <div className="alert alert-success alert-dismissible">
        {success}
        <button type="button" className="btn-close" onClick={() => setSuccess("")}></button>
      </div>}

      {/* Filtres */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row align-items-end g-3">
            <div className="col-md-3">
              <label className="form-label">Statut</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tous</option>
                {DEVIS_STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Client</label>
              <select
                className="form-select"
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
              >
                <option value="">Tous</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.company_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <button
                className="btn btn-outline-secondary"
                onClick={() => {
                  setStatusFilter("");
                  setClientFilter("");
                }}
              >
                Reinitialiser
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des devis */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border"></div>
        </div>
      ) : devisList.length === 0 ? (
        <div className="text-center py-5 text-muted">
          Aucun devis trouve.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead className="table-light">
              <tr>
                <th>Reference</th>
                <th>Client</th>
                <th>Evenement</th>
                <th>Total TTC</th>
                <th>Statut</th>
                <th>Date creation</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {devisList.map(devis => (
                <tr key={devis.id}>
                  <td><strong>{devis.reference}</strong></td>
                  <td>
                    {devis.client_company}
                    <br />
                    <small className="text-muted">
                      {devis.client_firstname} {devis.client_lastname}
                    </small>
                  </td>
                  <td>{devis.event_name || <span className="text-muted">-</span>}</td>
                  <td className="fw-bold">{formatMoney(devis.total_ttc)}</td>
                  <td>{getStatusBadge(devis.status)}</td>
                  <td>{formatDate(devis.created_at)}</td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      <button
                        className="btn btn-outline-primary"
                        onClick={() => viewDevis(devis)}
                        title="Voir"
                      >
                        Voir
                      </button>
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => downloadPDF(devis.id, devis.reference)}
                        title="PDF"
                      >
                        PDF
                      </button>
                      {devis.status === "brouillon" && (
                        <button
                          className="btn btn-outline-success"
                          onClick={() => sendDevis(devis.id)}
                          title="Envoyer"
                        >
                          Envoyer
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

      {/* Modal creation devis */}
      {showModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowModal(false)}
        >
          <div className="modal-dialog modal-xl" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Nouveau devis</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    {/* Client */}
                    <div className="col-md-6">
                      <label className="form-label">Client *</label>
                      <select
                        className="form-select"
                        name="client_id"
                        value={formData.client_id}
                        onChange={handleChange}
                        required
                      >
                        <option value="">-- Selectionnez --</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.company_name} ({c.firstname} {c.lastname})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Evenement */}
                    <div className="col-md-6">
                      <label className="form-label">Evenement lie</label>
                      <select
                        className="form-select"
                        name="event_id"
                        value={formData.event_id}
                        onChange={handleChange}
                      >
                        <option value="">-- Aucun --</option>
                        {events.map(e => (
                          <option key={e.id} value={e.id}>
                            {e.name} ({formatDate(e.start_date)})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Validite */}
                    <div className="col-md-4">
                      <label className="form-label">Valide jusqu'au</label>
                      <input
                        type="date"
                        className="form-control"
                        name="valid_until"
                        value={formData.valid_until}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Message */}
                    <div className="col-12">
                      <label className="form-label">Message personnalise</label>
                      <textarea
                        className="form-control"
                        name="custom_message"
                        value={formData.custom_message}
                        onChange={handleChange}
                        rows="2"
                        placeholder="Message affiche sur le devis..."
                      ></textarea>
                    </div>

                    {/* Lignes */}
                    <div className="col-12">
                      <hr />
                      <h6>Prestations</h6>

                      {/* Lignes existantes */}
                      {formData.lignes.length > 0 && (
                        <table className="table table-sm mb-3">
                          <thead>
                            <tr>
                              <th>Description</th>
                              <th>Qte</th>
                              <th>Prix HT</th>
                              <th>TVA</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.lignes.map((l, idx) => (
                              <tr key={idx}>
                                <td>{l.label}</td>
                                <td>{l.quantity}</td>
                                <td>{formatMoney(l.unit_price_ht)}</td>
                                <td>{l.tva_rate}%</td>
                                <td>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => removeLigne(idx)}
                                  >
                                    X
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td colSpan="3" className="text-end fw-bold">Total TTC estimé:</td>
                              <td colSpan="2" className="fw-bold">
                                {formatMoney(calcTotalLignes(formData.lignes))}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      )}

                      {/* Ajout ligne */}
                      <div className="row g-2 align-items-end">
                        <div className="col-md-4">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Description *"
                            name="label"
                            value={newLigne.label}
                            onChange={handleLigneChange}
                          />
                        </div>
                        <div className="col-md-2">
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            placeholder="Qte"
                            name="quantity"
                            value={newLigne.quantity}
                            onChange={handleLigneChange}
                            min="1"
                          />
                        </div>
                        <div className="col-md-2">
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            placeholder="Prix HT *"
                            name="unit_price_ht"
                            value={newLigne.unit_price_ht}
                            onChange={handleLigneChange}
                            step="0.01"
                          />
                        </div>
                        <div className="col-md-2">
                          <select
                            className="form-select form-select-sm"
                            name="tva_rate"
                            value={newLigne.tva_rate}
                            onChange={handleLigneChange}
                          >
                            <option value="20">20%</option>
                            <option value="10">10%</option>
                            <option value="5.5">5,5%</option>
                            <option value="0">0%</option>
                          </select>
                        </div>
                        <div className="col-md-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary w-100"
                            onClick={addLigne}
                          >
                            + Ajouter
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Creer le devis
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal detail devis */}
      {showDetailModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowDetailModal(false)}
        >
          <div className="modal-dialog modal-xl" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Devis {selectedDevis?.reference}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowDetailModal(false)}></button>
              </div>
              <div className="modal-body">
                {loadingDetail ? (
                  <div className="text-center py-4">
                    <div className="spinner-border"></div>
                  </div>
                ) : selectedDevis ? (
                  <>
                    {/* Infos generales */}
                    <div className="row mb-4">
                      <div className="col-md-6">
                        <h6>Client</h6>
                        <p className="mb-1">
                          <strong>{selectedDevis.client_company}</strong>
                        </p>
                        <p className="mb-1">
                          {selectedDevis.client_firstname} {selectedDevis.client_lastname}
                        </p>
                        <p className="mb-1">{selectedDevis.client_email}</p>
                        <p className="mb-0">{selectedDevis.client_phone}</p>
                      </div>
                      <div className="col-md-6">
                        <h6>Devis</h6>
                        <p className="mb-1">
                          <strong>Reference:</strong> {selectedDevis.reference}
                        </p>
                        <p className="mb-1">
                          <strong>Statut:</strong> {getStatusBadge(selectedDevis.status)}
                        </p>
                        <p className="mb-1">
                          <strong>Cree le:</strong> {formatDate(selectedDevis.created_at)}
                        </p>
                        {selectedDevis.valid_until && (
                          <p className="mb-0">
                            <strong>Valide jusqu'au:</strong> {formatDate(selectedDevis.valid_until)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Motif modif si present */}
                    {selectedDevis.modification_reason && (
                      <div className="alert alert-warning">
                        <strong>Demande de modification:</strong><br />
                        {selectedDevis.modification_reason}
                      </div>
                    )}

                    {/* Evenement */}
                    {selectedDevis.event_name && (
                      <div className="mb-4">
                        <h6>Evenement associe</h6>
                        <p className="mb-0">
                          {selectedDevis.event_name}
                          {selectedDevis.event_start_date && (
                            <span className="text-muted"> - {formatDate(selectedDevis.event_start_date)}</span>
                          )}
                          {selectedDevis.event_location && (
                            <span className="text-muted"> - {selectedDevis.event_location}</span>
                          )}
                        </p>
                      </div>
                    )}

                    {/* Prestations */}
                    <h6>Prestations</h6>
                    <table className="table table-sm">
                      <thead className="table-light">
                        <tr>
                          <th>Description</th>
                          <th className="text-center">Qte</th>
                          <th className="text-end">Prix unit. HT</th>
                          <th className="text-center">TVA</th>
                          <th className="text-end">Total TTC</th>
                          {selectedDevis.status === "brouillon" && <th></th>}
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
                            <td className="text-center">{ligne.tva_rate}%</td>
                            <td className="text-end">{formatMoney(ligne.total_ttc)}</td>
                            {selectedDevis.status === "brouillon" && (
                              <td>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => deleteLigne(selectedDevis.id, ligne.id)}
                                >
                                  X
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={selectedDevis.status === "brouillon" ? 4 : 3}></td>
                          <td className="text-end"><strong>Total HT:</strong></td>
                          <td className="text-end">{formatMoney(selectedDevis.total_ht)}</td>
                        </tr>
                        <tr>
                          <td colSpan={selectedDevis.status === "brouillon" ? 4 : 3}></td>
                          <td className="text-end"><strong>Total TVA:</strong></td>
                          <td className="text-end">{formatMoney(selectedDevis.total_tva)}</td>
                        </tr>
                        <tr className="table-light">
                          <td colSpan={selectedDevis.status === "brouillon" ? 4 : 3}></td>
                          <td className="text-end"><strong>Total TTC:</strong></td>
                          <td className="text-end fw-bold">{formatMoney(selectedDevis.total_ttc)}</td>
                        </tr>
                      </tfoot>
                    </table>

                    {/* Ajout ligne si brouillon */}
                    {selectedDevis.status === "brouillon" && (
                      <div className="border-top pt-3 mt-3">
                        <h6>Ajouter une prestation</h6>
                        <div className="row g-2 align-items-end">
                          <div className="col-md-4">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Description *"
                              name="label"
                              value={newLigne.label}
                              onChange={handleLigneChange}
                            />
                          </div>
                          <div className="col-md-2">
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              placeholder="Qte"
                              name="quantity"
                              value={newLigne.quantity}
                              onChange={handleLigneChange}
                              min="1"
                            />
                          </div>
                          <div className="col-md-2">
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              placeholder="Prix HT *"
                              name="unit_price_ht"
                              value={newLigne.unit_price_ht}
                              onChange={handleLigneChange}
                              step="0.01"
                            />
                          </div>
                          <div className="col-md-2">
                            <select
                              className="form-select form-select-sm"
                              name="tva_rate"
                              value={newLigne.tva_rate}
                              onChange={handleLigneChange}
                            >
                              <option value="20">20%</option>
                              <option value="10">10%</option>
                              <option value="5.5">5,5%</option>
                              <option value="0">0%</option>
                            </select>
                          </div>
                          <div className="col-md-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary w-100"
                              onClick={() => addLigneToDevis(selectedDevis.id)}
                            >
                              Ajouter
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Message custom */}
                    {selectedDevis.custom_message && (
                      <div className="mt-3 p-3 bg-light rounded">
                        <small className="text-muted">Message:</small><br />
                        <em>{selectedDevis.custom_message}</em>
                      </div>
                    )}
                  </>
                ) : null}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => downloadPDF(selectedDevis.id, selectedDevis.reference)}
                >
                  Telecharger PDF
                </button>
                {selectedDevis?.status === "brouillon" && (
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={() => sendDevis(selectedDevis.id)}
                  >
                    Envoyer au client
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDetailModal(false)}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
