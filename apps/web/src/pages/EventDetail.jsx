import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

import { API_URL } from "../config";

const PRIORITIES = [
  { value: "basse", label: "Basse", color: "info" },
  { value: "normale", label: "Normale", color: "secondary" },
  { value: "haute", label: "Haute", color: "warning" },
  { value: "urgente", label: "Urgente", color: "danger" }
];

const TASK_STATUSES = [
  { value: "a_faire", label: "A faire", color: "secondary" },
  { value: "en_cours", label: "En cours", color: "primary" },
  { value: "terminee", label: "Terminee", color: "success" },
  { value: "annulee", label: "Annulee", color: "dark" }
];

export default function EventDetail() {
  const { id } = useParams();
  const { token, user, isAdmin, isEmploye } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [notes, setNotes] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Formulaires
  const [newNote, setNewNote] = useState({ content: "", is_private: false });
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "normale",
    assigned_to: "",
    due_date: ""
  });
  const [activeTab, setActiveTab] = useState("notes");

  // Redirection si pas autorise
  useEffect(() => {
    if (!isAdmin && !isEmploye) {
      navigate("/connexion");
    }
  }, [isAdmin, isEmploye, navigate]);

  // Charger l'evenement
  async function fetchEvent() {
    try {
      const res = await fetch(`${API_URL}/api/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Evenement introuvable");
      const data = await res.json();
      setEvent(data.event);
    } catch (err) {
      setError(err.message);
    }
  }

  // Charger les notes
  async function fetchNotes() {
    try {
      const res = await fetch(`${API_URL}/api/events/${id}/notes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes || []);
      }
    } catch (err) {
      console.error("Erreur chargement notes:", err);
    }
  }

  // Charger les taches
  async function fetchTasks() {
    try {
      const res = await fetch(`${API_URL}/api/events/${id}/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error("Erreur chargement taches:", err);
    }
  }

  // Charger les employes pour l'assignation
  async function fetchEmployees() {
    try {
      const res = await fetch(`${API_URL}/api/auth/users?role=employe`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.users || []);
      }
    } catch (err) {
      console.error("Erreur chargement employes:", err);
    }
  }

  async function loadAll() {
    setLoading(true);
    await Promise.all([fetchEvent(), fetchNotes(), fetchTasks(), fetchEmployees()]);
    setLoading(false);
  }

  useEffect(() => {
    if (token && id) {
      loadAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, id]);

  // Ajouter une note
  async function handleAddNote(e) {
    e.preventDefault();
    if (!newNote.content.trim()) return;

    try {
      const res = await fetch(`${API_URL}/api/events/${id}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newNote)
      });

      if (!res.ok) throw new Error("Erreur ajout note");

      setNewNote({ content: "", is_private: false });
      fetchNotes();
    } catch (err) {
      alert(err.message);
    }
  }

  // Supprimer une note
  async function handleDeleteNote(noteId) {
    if (!confirm("Supprimer cette note ?")) return;

    try {
      const res = await fetch(`${API_URL}/api/events/${id}/notes/${noteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Erreur suppression");
      fetchNotes();
    } catch (err) {
      alert(err.message);
    }
  }

  // Ajouter une tache
  async function handleAddTask(e) {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    try {
      const res = await fetch(`${API_URL}/api/events/${id}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newTask)
      });

      if (!res.ok) throw new Error("Erreur ajout tache");

      setNewTask({
        title: "",
        description: "",
        priority: "normale",
        assigned_to: "",
        due_date: ""
      });
      fetchTasks();
    } catch (err) {
      alert(err.message);
    }
  }

  // Mettre a jour le statut d'une tache
  async function updateTaskStatus(taskId, newStatus) {
    try {
      const res = await fetch(`${API_URL}/api/events/${id}/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error("Erreur mise a jour");
      fetchTasks();
    } catch (err) {
      alert(err.message);
    }
  }

  // Supprimer une tache
  async function handleDeleteTask(taskId) {
    if (!confirm("Supprimer cette tache ?")) return;

    try {
      const res = await fetch(`${API_URL}/api/events/${id}/tasks/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Erreur suppression");
      fetchTasks();
    } catch (err) {
      alert(err.message);
    }
  }

  // Formater la date
  function formatDate(dateStr) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function formatDateShort(dateStr) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("fr-FR");
  }

  if (!isAdmin && !isEmploye) return null;

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">{error || "Evenement introuvable"}</div>
        <Link to="/admin/evenements" className="btn btn-outline-primary">
          Retour aux evenements
        </Link>
      </div>
    );
  }

  const taskStats = {
    total: tasks.length,
    a_faire: tasks.filter((t) => t.status === "a_faire").length,
    en_cours: tasks.filter((t) => t.status === "en_cours").length,
    terminee: tasks.filter((t) => t.status === "terminee").length
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <Link to="/admin/evenements" className="text-muted mb-2 d-block">
            <i className="bi bi-arrow-left me-1"></i> Retour aux evenements
          </Link>
          <h1>{event.name}</h1>
          <p className="text-muted mb-0">
            <i className="bi bi-calendar me-2"></i>
            {formatDate(event.start_date)}
            <span className="mx-2">-</span>
            {formatDate(event.end_date)}
          </p>
          <p className="text-muted">
            <i className="bi bi-geo-alt me-2"></i>
            {event.location}
          </p>
        </div>
        <div>
          <span className={`badge bg-${event.status === "termine" ? "success" : "primary"} fs-6`}>
            {event.status}
          </span>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h3 className="mb-0">{notes.length}</h3>
              <small className="text-muted">Notes</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h3 className="mb-0">{taskStats.total}</h3>
              <small className="text-muted">Taches totales</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center border-warning">
            <div className="card-body">
              <h3 className="mb-0 text-warning">{taskStats.a_faire + taskStats.en_cours}</h3>
              <small className="text-muted">Taches en cours</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center border-success">
            <div className="card-body">
              <h3 className="mb-0 text-success">{taskStats.terminee}</h3>
              <small className="text-muted">Taches terminees</small>
            </div>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "notes" ? "active" : ""}`}
            onClick={() => setActiveTab("notes")}
          >
            <i className="bi bi-sticky me-2"></i>
            Notes ({notes.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "tasks" ? "active" : ""}`}
            onClick={() => setActiveTab("tasks")}
          >
            <i className="bi bi-check2-square me-2"></i>
            Taches ({tasks.length})
          </button>
        </li>
      </ul>

      {/* Contenu des onglets */}
      {activeTab === "notes" && (
        <div className="row">
          {/* Formulaire d'ajout de note */}
          <div className="col-lg-4">
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">Ajouter une note</h6>
              </div>
              <div className="card-body">
                <form onSubmit={handleAddNote}>
                  <div className="mb-3">
                    <textarea
                      className="form-control"
                      rows="4"
                      placeholder="Votre note..."
                      value={newNote.content}
                      onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                      required
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="is_private"
                        checked={newNote.is_private}
                        onChange={(e) => setNewNote({ ...newNote, is_private: e.target.checked })}
                      />
                      <label className="form-check-label" htmlFor="is_private">
                        Note privee (visible uniquement par moi)
                      </label>
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary w-100">
                    <i className="bi bi-plus-lg me-2"></i>
                    Ajouter
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Liste des notes */}
          <div className="col-lg-8">
            {notes.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-sticky fs-1"></i>
                <p className="mt-2">Aucune note pour cet evenement</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className={`card ${note.is_private ? "border-warning" : ""}`}
                  >
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          {note.is_private && (
                            <span className="badge bg-warning text-dark me-2">
                              <i className="bi bi-lock-fill"></i> Privee
                            </span>
                          )}
                          <p className="mb-2" style={{ whiteSpace: "pre-wrap" }}>
                            {note.content}
                          </p>
                          <small className="text-muted">
                            Par {note.firstname} {note.lastname} - {formatDate(note.created_at)}
                          </small>
                        </div>
                        {(note.user_id === user?.id || isAdmin) && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "tasks" && (
        <div className="row">
          {/* Formulaire d'ajout de tache */}
          <div className="col-lg-4">
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">Nouvelle tache</h6>
              </div>
              <div className="card-body">
                <form onSubmit={handleAddTask}>
                  <div className="mb-3">
                    <label className="form-label">Titre *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    ></textarea>
                  </div>
                  <div className="row mb-3">
                    <div className="col-6">
                      <label className="form-label">Priorite</label>
                      <select
                        className="form-select"
                        value={newTask.priority}
                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                      >
                        {PRIORITIES.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label">Echeance</label>
                      <input
                        type="date"
                        className="form-control"
                        value={newTask.due_date}
                        onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Assigner a</label>
                    <select
                      className="form-select"
                      value={newTask.assigned_to}
                      onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                    >
                      <option value="">-- Non assigne --</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.firstname} {emp.lastname}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary w-100">
                    <i className="bi bi-plus-lg me-2"></i>
                    Creer la tache
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Liste des taches */}
          <div className="col-lg-8">
            {tasks.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-check2-square fs-1"></i>
                <p className="mt-2">Aucune tache pour cet evenement</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Tache</th>
                      <th>Priorite</th>
                      <th>Assigne a</th>
                      <th>Echeance</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr key={task.id} className={task.status === "terminee" ? "table-success" : ""}>
                        <td>
                          <strong>{task.title}</strong>
                          {task.description && (
                            <>
                              <br />
                              <small className="text-muted">{task.description}</small>
                            </>
                          )}
                        </td>
                        <td>
                          <span
                            className={`badge bg-${
                              PRIORITIES.find((p) => p.value === task.priority)?.color || "secondary"
                            }`}
                          >
                            {PRIORITIES.find((p) => p.value === task.priority)?.label || task.priority}
                          </span>
                        </td>
                        <td>
                          {task.assigned_firstname
                            ? `${task.assigned_firstname} ${task.assigned_lastname}`
                            : "-"}
                        </td>
                        <td>{task.due_date ? formatDateShort(task.due_date) : "-"}</td>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={task.status}
                            onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                            style={{ width: "130px" }}
                          >
                            {TASK_STATUSES.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
