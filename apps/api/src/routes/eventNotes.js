const express = require("express");
const router = express.Router();

const { pool } = require("../db/postgres");
const { roleRequired } = require("../middlewares/auth");

// ============================================
// GET /api/events/:eventId/notes - Liste des notes d'un evenement
// ============================================
router.get("/:eventId/notes", roleRequired(["admin", "employe"]), async (req, res) => {
  try {
    const eventId = Number(req.params.eventId);
    if (!Number.isInteger(eventId) || eventId <= 0) {
      return res.status(400).json({ ok: false, error: "ID evenement invalide" });
    }

    // Verifier que l'evenement existe
    const eventCheck = await pool.query("SELECT id FROM events WHERE id = $1", [eventId]);
    if (!eventCheck.rows.length) {
      return res.status(404).json({ ok: false, error: "Evenement introuvable" });
    }

    // Recuperer les notes (les privees seulement pour leur auteur)
    const { rows } = await pool.query(
      `
      SELECT n.id, n.content, n.is_private, n.created_at, n.updated_at,
             u.id as user_id, u.firstname, u.lastname
      FROM event_notes n
      JOIN users u ON n.user_id = u.id
      WHERE n.event_id = $1
        AND (n.is_private = FALSE OR n.user_id = $2)
      ORDER BY n.created_at DESC
      `,
      [eventId, req.user.id]
    );

    return res.json({ ok: true, count: rows.length, notes: rows });

  } catch (e) {
    console.error("Erreur GET /events/:eventId/notes:", e);
    return res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
});

// ============================================
// POST /api/events/:eventId/notes - Ajouter une note
// ============================================
router.post("/:eventId/notes", roleRequired(["admin", "employe"]), async (req, res) => {
  try {
    const eventId = Number(req.params.eventId);
    if (!Number.isInteger(eventId) || eventId <= 0) {
      return res.status(400).json({ ok: false, error: "ID evenement invalide" });
    }

    const { content, is_private } = req.body || {};

    if (!content || String(content).trim() === "") {
      return res.status(400).json({ ok: false, error: "Contenu obligatoire" });
    }

    // Verifier que l'evenement existe
    const eventCheck = await pool.query("SELECT id FROM events WHERE id = $1", [eventId]);
    if (!eventCheck.rows.length) {
      return res.status(404).json({ ok: false, error: "Evenement introuvable" });
    }

    const { rows } = await pool.query(
      `
      INSERT INTO event_notes (event_id, user_id, content, is_private)
      VALUES ($1, $2, $3, $4)
      RETURNING id, content, is_private, created_at
      `,
      [eventId, req.user.id, content.trim(), Boolean(is_private)]
    );

    return res.status(201).json({
      ok: true,
      note: {
        ...rows[0],
        firstname: req.user.firstname,
        lastname: req.user.lastname
      }
    });

  } catch (e) {
    console.error("Erreur POST /events/:eventId/notes:", e);
    return res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
});

// ============================================
// DELETE /api/events/:eventId/notes/:noteId - Supprimer une note
// ============================================
router.delete("/:eventId/notes/:noteId", roleRequired(["admin", "employe"]), async (req, res) => {
  try {
    const noteId = Number(req.params.noteId);
    if (!Number.isInteger(noteId) || noteId <= 0) {
      return res.status(400).json({ ok: false, error: "ID note invalide" });
    }

    // Verifier que la note appartient a l'utilisateur (ou admin)
    const noteCheck = await pool.query(
      "SELECT user_id FROM event_notes WHERE id = $1",
      [noteId]
    );

    if (!noteCheck.rows.length) {
      return res.status(404).json({ ok: false, error: "Note introuvable" });
    }

    if (noteCheck.rows[0].user_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ ok: false, error: "Non autorise" });
    }

    await pool.query("DELETE FROM event_notes WHERE id = $1", [noteId]);

    return res.json({ ok: true, deleted: true });

  } catch (e) {
    console.error("Erreur DELETE /events/:eventId/notes/:noteId:", e);
    return res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
});

module.exports = router;
