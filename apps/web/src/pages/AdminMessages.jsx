import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

import { API_URL } from "../config";

export default function AdminMessages() {
  const { token, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showArchived, setShowArchived] = useState(false);

  // Redirection si pas admin
  useEffect(() => {
    if (!isAdmin) {
      navigate("/connexion");
    }
  }, [isAdmin, navigate]);

  // Charger les messages
  async function fetchMessages() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (showArchived) {
        params.set("is_archived", "true");
      }

      const res = await fetch(`${API_URL}/api/contact?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Erreur chargement messages");

      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token && isAdmin) {
      fetchMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAdmin, showArchived]);

  // Marquer comme lu
  async function markAsRead(id, isRead) {
    try {
      const res = await fetch(`${API_URL}/api/contact/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_read: isRead })
      });

      if (!res.ok) throw new Error("Erreur mise a jour");

      // Mettre a jour la liste
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, is_read: isRead } : m))
      );

      // Mettre a jour le message selectionne
      if (selectedMessage?.id === id) {
        setSelectedMessage((prev) => ({ ...prev, is_read: isRead }));
      }
    } catch (err) {
      alert(err.message);
    }
  }

  // Archiver
  async function archiveMessage(id) {
    if (!confirm("Archiver ce message ?")) return;

    try {
      const res = await fetch(`${API_URL}/api/contact/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_archived: true })
      });

      if (!res.ok) throw new Error("Erreur archivage");

      // Retirer de la liste si on n'affiche pas les archives
      if (!showArchived) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
      }

      setSelectedMessage(null);
    } catch (err) {
      alert(err.message);
    }
  }

  // Supprimer
  async function deleteMessage(id) {
    if (!confirm("Supprimer definitivement ce message ?")) return;

    try {
      const res = await fetch(`${API_URL}/api/contact/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Erreur suppression");

      setMessages((prev) => prev.filter((m) => m.id !== id));
      setSelectedMessage(null);
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

  // Ouvrir un message
  function openMessage(msg) {
    setSelectedMessage(msg);
    // Marquer comme lu automatiquement
    if (!msg.is_read) {
      markAsRead(msg.id, true);
    }
  }

  if (!isAdmin) return null;

  const unreadCount = messages.filter((m) => !m.is_read).length;

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Messages de contact</h1>
          {!showArchived && unreadCount > 0 && (
            <span className="badge bg-danger">{unreadCount} non lu(s)</span>
          )}
        </div>
        <div className="d-flex gap-2">
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id="showArchived"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="showArchived">
              Afficher les archives
            </label>
          </div>
          <button
            className="btn btn-outline-primary"
            onClick={fetchMessages}
            disabled={loading}
          >
            Actualiser
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row">
        {/* Liste des messages */}
        <div className="col-lg-5">
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">
                {showArchived ? "Messages archives" : "Boite de reception"}
                <span className="badge bg-secondary ms-2">{messages.length}</span>
              </h6>
            </div>
            <div
              className="list-group list-group-flush"
              style={{ maxHeight: "600px", overflowY: "auto" }}
            >
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border"></div>
                </div>
              ) : messages.length === 0 ? (
                <p className="text-muted text-center py-4">Aucun message</p>
              ) : (
                messages.map((msg) => (
                  <button
                    key={msg.id}
                    className={`list-group-item list-group-item-action ${
                      selectedMessage?.id === msg.id ? "active" : ""
                    } ${!msg.is_read && selectedMessage?.id !== msg.id ? "bg-light" : ""}`}
                    onClick={() => openMessage(msg)}
                  >
                    <div className="d-flex w-100 justify-content-between">
                      <h6 className={`mb-1 ${!msg.is_read ? "fw-bold" : ""}`}>
                        {!msg.is_read && (
                          <span className="badge bg-primary me-2">Nouveau</span>
                        )}
                        {msg.firstname} {msg.lastname}
                      </h6>
                      <small className={selectedMessage?.id === msg.id ? "" : "text-muted"}>
                        {formatDate(msg.created_at).split(" ")[0]}
                      </small>
                    </div>
                    <p className="mb-1 small text-truncate">
                      <strong>{msg.subject}</strong>
                    </p>
                    <small className={`text-truncate d-block ${
                      selectedMessage?.id === msg.id ? "" : "text-muted"
                    }`}>
                      {msg.message.substring(0, 60)}...
                    </small>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Detail du message */}
        <div className="col-lg-7">
          {selectedMessage ? (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-start">
                <div>
                  <h5 className="mb-1">{selectedMessage.subject}</h5>
                  <small className="text-muted">
                    De: {selectedMessage.firstname} {selectedMessage.lastname} ({selectedMessage.email})
                  </small>
                </div>
                <div className="btn-group">
                  {selectedMessage.is_read ? (
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => markAsRead(selectedMessage.id, false)}
                      title="Marquer comme non lu"
                    >
                      <i className="bi bi-envelope"></i>
                    </button>
                  ) : (
                    <button
                      className="btn btn-sm btn-outline-success"
                      onClick={() => markAsRead(selectedMessage.id, true)}
                      title="Marquer comme lu"
                    >
                      <i className="bi bi-envelope-open"></i>
                    </button>
                  )}
                  {!selectedMessage.is_archived && (
                    <button
                      className="btn btn-sm btn-outline-warning"
                      onClick={() => archiveMessage(selectedMessage.id)}
                      title="Archiver"
                    >
                      <i className="bi bi-archive"></i>
                    </button>
                  )}
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => deleteMessage(selectedMessage.id)}
                    title="Supprimer"
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <small className="text-muted">
                    <i className="bi bi-calendar me-1"></i>
                    Recu le {formatDate(selectedMessage.created_at)}
                  </small>
                  {selectedMessage.phone && (
                    <small className="text-muted ms-3">
                      <i className="bi bi-telephone me-1"></i>
                      {selectedMessage.phone}
                    </small>
                  )}
                  {selectedMessage.user_id && (
                    <span className="badge bg-info ms-2">Utilisateur inscrit</span>
                  )}
                </div>
                <hr />
                <div style={{ whiteSpace: "pre-wrap" }}>{selectedMessage.message}</div>
              </div>
              <div className="card-footer">
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                  className="btn btn-primary"
                >
                  <i className="bi bi-reply me-2"></i>
                  Repondre par email
                </a>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-body text-center text-muted py-5">
                <i className="bi bi-envelope fs-1"></i>
                <p className="mt-3">Selectionnez un message pour le lire</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
