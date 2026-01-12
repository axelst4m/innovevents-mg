import { useEffect, useState } from "react";


// Listes des status dispo pour les prospects
// Double usage : filtre front + backend
const STATUSES = [
  { value: "", label: "Tous" },
  { value: "a_contacter", label: "À contacter" },
  { value: "contacte", label: "Contacté" },
  { value: "qualifie", label: "Qualifié" },
  { value: "refuse", label: "Refusé" },
];

// formate une date venant de l'API en chaîne lisible
function fmtDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

// Page d'administration des prospects
// permet de lister, filtrer et mettre à jour le statut
export default function AdminProspects() {
    // URL de l’API
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

    //   Filtres
  const [statusFilter, setStatusFilter] = useState("a_contacter");
  const [limit, setLimit] = useState(50);

    // Etat de la page loadiing / error / prospects
  const [state, setState] = useState({
        loading: true, 
        error: "", 
        prospects: [] 
    });
    // ID du prospect en cours de mise à jour (pour désactiver les boutons)
  const [updatingId, setUpdatingId] = useState(null);

    // Charge les prospects depuis l'API avec les filtres 
  async function load() {
    setState((s) => ({ ...s, loading: true, error: "" }));
    try {
        // Prépare les paramètres
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      params.set("limit", String(limit));
        // Appel API
      const res = await fetch(`${apiUrl}/api/prospects?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur lors du chargement");
        // MàJ état
      setState({ loading: false, error: "", prospects: data.prospects || [] });
    } catch (e) {
      setState({ loading: false, error: e.message || "Erreur", prospects: [] });
    }
  }

    // Rechargement automatique à chaque changement de filtre
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, limit]);

    // Met à jour le statut d'un prospect (appl l’API en PATCH puis recharge liste)
  async function updateStatus(id, nextStatus) {
    try {
      setUpdatingId(id);

      const res = await fetch(`${apiUrl}/api/prospects/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur lors de la mise à jour");

      // Refresh simple 
      await load();
    } catch (e) {
      alert(e.message || "Erreur");
    } finally {
      setUpdatingId(null);
    }
  }
    // Rendu
  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-3">
        <div>
          <h1 className="mb-1">Admin - Prospects</h1>
          <p className="text-muted mb-0">
            Liste des demandes de devis (lecture + mise à jour du statut).
          </p>
        </div>

        <div className="d-flex gap-2 align-items-end">
          <div>
            <label className="form-label mb-1">Statut</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ width: 120 }}>
            <label className="form-label mb-1">Limite</label>
            <input
              type="number"
              min="1"
              max="200"
              className="form-control"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
            />
          </div>

          <button className="btn btn-outline-dark" onClick={load} disabled={state.loading}>
            Rafraîchir
          </button>
        </div>
      </div>

      {state.error && (
        <div className="alert alert-danger" role="alert">
          {state.error}
        </div>
      )}

      <div className="table-responsive">
        <table className="table table-sm align-middle">
          <thead>
            <tr>
              <th>ID</th>
              <th>Entreprise</th>
              <th>Contact</th>
              <th>Email</th>
              <th>Événement</th>
              <th>Date</th>
              <th>Participants</th>
              <th>Statut</th>
              <th style={{ width: 260 }}>Actions</th>
              <th>Créé le</th>
            </tr>
          </thead>

          <tbody>
            {state.loading ? (
              <tr>
                <td colSpan="10" className="text-muted py-4">
                  Chargement...
                </td>
              </tr>
            ) : state.prospects.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-muted py-4">
                  Aucun prospect pour ce filtre.
                </td>
              </tr>
            ) : (
              state.prospects.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.company_name}</td>
                  <td>
                    {p.firstname} {p.lastname}
                  </td>
                  <td>{p.email}</td>
                  <td>{p.event_type}</td>
                  <td>{p.event_date}</td>
                  <td>{p.participants}</td>
                  <td>
                    <span className="badge text-bg-dark">{p.status}</span>
                  </td>
                  <td className="d-flex flex-wrap gap-1">
                    <button
                      className="btn btn-sm btn-outline-dark"
                      disabled={updatingId === p.id}
                      onClick={() => updateStatus(p.id, "contacte")}
                    >
                      Contacté
                    </button>
                    <button
                      className="btn btn-sm btn-outline-dark"
                      disabled={updatingId === p.id}
                      onClick={() => updateStatus(p.id, "qualifie")}
                    >
                      Qualifié
                    </button>
                    <button
                      className="btn btn-sm btn-outline-dark"
                      disabled={updatingId === p.id}
                      onClick={() => updateStatus(p.id, "refuse")}
                    >
                      Refusé
                    </button>
                  </td>
                  <td>{fmtDate(p.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}