import { useEffect, useState } from "react";

const ROLES = [
  { value: "", label: "Tous" },
  { value: "admin", label: "Admin" },
  { value: "employe", label: "Employe" },
  { value: "client", label: "Client" },
];

const STATUSES = [
  { value: "", label: "Tous" },
  { value: "active", label: "Actifs" },
  { value: "inactive", label: "Inactifs" },
];

function fmtDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("fr-FR");
}

export default function AdminUsers() {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
  const token = localStorage.getItem("token");

  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");

  const [state, setState] = useState({
    loading: true,
    error: "",
    users: [],
  });

  const [stats, setStats] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // create | edit
  const [formData, setFormData] = useState({
    id: null,
    email: "",
    firstname: "",
    lastname: "",
    role: "employe",
  });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState("");

  const [actionLoading, setActionLoading] = useState(null);

  // Charge les stats
  async function loadStats() {
    try {
      const res = await fetch(`${apiUrl}/api/users/stats/count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setStats(data.stats);
    } catch (e) {
      console.error("Erreur stats:", e);
    }
  }

  // Charge les utilisateurs
  async function load() {
    setState((s) => ({ ...s, loading: true, error: "" }));
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.set("role", roleFilter);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`${apiUrl}/api/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur");
      setState({ loading: false, error: "", users: data.users || [] });
    } catch (e) {
      setState({ loading: false, error: e.message, users: [] });
    }
  }

  useEffect(() => {
    load();
    loadStats();
  }, [roleFilter, statusFilter]);

  // Ouvre le modal creation
  function openCreate() {
    setModalMode("create");
    setFormData({ id: null, email: "", firstname: "", lastname: "", role: "employe" });
    setFormError("");
    setTempPassword("");
    setModalOpen(true);
  }

  // Ouvre le modal edition
  function openEdit(user) {
    setModalMode("edit");
    setFormData({
      id: user.id,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      role: user.role,
    });
    setFormError("");
    setTempPassword("");
    setModalOpen(true);
  }

  // Soumet le formulaire (creation ou edition)
  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);
    setTempPassword("");

    try {
      if (modalMode === "create") {
        const res = await fetch(`${apiUrl}/api/users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: formData.email,
            firstname: formData.firstname,
            lastname: formData.lastname,
            role: formData.role,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Erreur");
        setTempPassword(data.tempPassword || "");
        await load();
        await loadStats();
      } else {
        const res = await fetch(`${apiUrl}/api/users/${formData.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            firstname: formData.firstname,
            lastname: formData.lastname,
            role: formData.role,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Erreur");
        setModalOpen(false);
        await load();
      }
    } catch (e) {
      setFormError(e.message);
    } finally {
      setFormLoading(false);
    }
  }

  // Toggle actif/inactif
  async function toggleStatus(user) {
    if (!confirm(`${user.is_active ? "Desactiver" : "Reactiver"} ${user.firstname} ${user.lastname} ?`)) {
      return;
    }
    setActionLoading(user.id);
    try {
      const res = await fetch(`${apiUrl}/api/users/${user.id}/toggle-status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur");
      await load();
      await loadStats();
    } catch (e) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  }

  // Reset mot de passe
  async function resetPassword(user) {
    if (!confirm(`Reinitialiser le mot de passe de ${user.firstname} ${user.lastname} ?`)) {
      return;
    }
    setActionLoading(user.id);
    try {
      const res = await fetch(`${apiUrl}/api/users/${user.id}/reset-password`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur");
      alert(`Nouveau mot de passe : ${data.tempPassword}\n\n(A communiquer a l'utilisateur)`);
    } catch (e) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-3">
        <div>
          <h1 className="mb-1">Gestion des utilisateurs</h1>
          <p className="text-muted mb-0">
            Creer, modifier et gerer les comptes utilisateurs.
          </p>
        </div>

        <button className="btn btn-dark" onClick={openCreate}>
          + Nouvel utilisateur
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-2">
            <div className="card text-center">
              <div className="card-body py-2">
                <div className="fs-4 fw-bold">{stats.total}</div>
                <small className="text-muted">Total</small>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-2">
            <div className="card text-center">
              <div className="card-body py-2">
                <div className="fs-4 fw-bold text-danger">{stats.admins}</div>
                <small className="text-muted">Admins</small>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-2">
            <div className="card text-center">
              <div className="card-body py-2">
                <div className="fs-4 fw-bold text-primary">{stats.employes}</div>
                <small className="text-muted">Employes</small>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-2">
            <div className="card text-center">
              <div className="card-body py-2">
                <div className="fs-4 fw-bold text-success">{stats.clients}</div>
                <small className="text-muted">Clients</small>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-2">
            <div className="card text-center">
              <div className="card-body py-2">
                <div className="fs-4 fw-bold text-success">{stats.actifs}</div>
                <small className="text-muted">Actifs</small>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-2">
            <div className="card text-center">
              <div className="card-body py-2">
                <div className="fs-4 fw-bold text-secondary">{stats.inactifs}</div>
                <small className="text-muted">Inactifs</small>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="d-flex gap-2 align-items-end mb-3">
        <div>
          <label className="form-label mb-1">Role</label>
          <select
            className="form-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label mb-1">Statut</label>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-outline-dark" onClick={load} disabled={state.loading}>
          Rafraichir
        </button>
      </div>

      {state.error && (
        <div className="alert alert-danger">{state.error}</div>
      )}

      {/* Table */}
      <div className="table-responsive">
        <table className="table table-sm align-middle">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom</th>
              <th>Email</th>
              <th>Role</th>
              <th>Statut</th>
              <th>Cree le</th>
              <th style={{ width: 280 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {state.loading ? (
              <tr>
                <td colSpan="7" className="text-muted py-4">Chargement...</td>
              </tr>
            ) : state.users.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-muted py-4">Aucun utilisateur.</td>
              </tr>
            ) : (
              state.users.map((u) => (
                <tr key={u.id} className={!u.is_active ? "table-secondary" : ""}>
                  <td>{u.id}</td>
                  <td>{u.firstname} {u.lastname}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge ${
                      u.role === "admin" ? "bg-danger" :
                      u.role === "employe" ? "bg-primary" : "bg-success"
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    {u.is_active ? (
                      <span className="badge bg-success">Actif</span>
                    ) : (
                      <span className="badge bg-secondary">Inactif</span>
                    )}
                  </td>
                  <td>{fmtDate(u.created_at)}</td>
                  <td>
                    <div className="d-flex flex-wrap gap-1">
                      <button
                        className="btn btn-sm btn-outline-dark"
                        onClick={() => openEdit(u)}
                      >
                        Modifier
                      </button>
                      <button
                        className="btn btn-sm btn-outline-warning"
                        onClick={() => resetPassword(u)}
                        disabled={actionLoading === u.id}
                      >
                        Reset MDP
                      </button>
                      <button
                        className={`btn btn-sm ${u.is_active ? "btn-outline-danger" : "btn-outline-success"}`}
                        onClick={() => toggleStatus(u)}
                        disabled={actionLoading === u.id}
                      >
                        {u.is_active ? "Desactiver" : "Reactiver"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal creation/edition */}
      {modalOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {modalMode === "create" ? "Nouvel utilisateur" : "Modifier l'utilisateur"}
                </h5>
                <button type="button" className="btn-close" onClick={() => setModalOpen(false)} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {formError && <div className="alert alert-danger py-2">{formError}</div>}

                  {tempPassword && (
                    <div className="alert alert-success">
                      <strong>Utilisateur cree !</strong><br />
                      Mot de passe temporaire : <code>{tempPassword}</code><br />
                      <small className="text-muted">A communiquer a l'utilisateur. Il devra le changer a la premiere connexion.</small>
                    </div>
                  )}

                  {!tempPassword && (
                    <>
                      <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          className="form-control"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          disabled={modalMode === "edit"}
                        />
                        {modalMode === "edit" && (
                          <small className="text-muted">L'email ne peut pas etre modifie</small>
                        )}
                      </div>
                      <div className="row mb-3">
                        <div className="col">
                          <label className="form-label">Prenom</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.firstname}
                            onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                            required
                          />
                        </div>
                        <div className="col">
                          <label className="form-label">Nom</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.lastname}
                            onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Role</label>
                        <select
                          className="form-select"
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                          <option value="admin">Admin</option>
                          <option value="employe">Employe</option>
                          <option value="client">Client</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
                <div className="modal-footer">
                  {tempPassword ? (
                    <button type="button" className="btn btn-primary" onClick={() => setModalOpen(false)}>
                      Fermer
                    </button>
                  ) : (
                    <>
                      <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                        Annuler
                      </button>
                      <button type="submit" className="btn btn-dark" disabled={formLoading}>
                        {formLoading ? "..." : modalMode === "create" ? "Creer" : "Enregistrer"}
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
