const express = require("express");
const { pool } = require("../db/postgres");
const { authRequired, roleRequired, authOptional } = require("../middlewares/auth");
const { logAction } = require("../utils/logger");

const router = express.Router();

// ============================================
// GET /api/events - Liste des evenements publics
// Accessible a tous (avec filtres)
// ============================================
router.get("/", authOptional, async (req, res) => {
  try {
    const { type, theme, start_date, end_date, limit = 20, offset = 0 } = req.query;

    // Construction de la requete avec filtres
    let query = `
      SELECT
        e.id, e.name, e.description, e.event_type, e.theme,
        e.start_date, e.end_date, e.location, e.participants_count,
        e.image_url, e.status,
        c.company_name as client_name
      FROM events e
      LEFT JOIN clients c ON e.client_id = c.id
      WHERE e.is_public = TRUE
        AND e.client_approved_public = TRUE
        AND e.status != 'brouillon'
    `;

    const params = [];
    let paramIndex = 1;

    // Filtre par type
    if (type) {
      query += ` AND e.event_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    // Filtre par theme
    if (theme) {
      query += ` AND e.theme ILIKE $${paramIndex}`;
      params.push(`%${theme}%`);
      paramIndex++;
    }

    // Filtre par plage de dates
    if (start_date) {
      query += ` AND e.start_date >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND e.end_date <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    // Tri et pagination
    query += ` ORDER BY e.start_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    res.json({
      events: result.rows,
      count: result.rows.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (err) {
    console.error("Erreur GET /events:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// GET /api/events/admin - Liste complete (admin/employe)
// ============================================
router.get("/admin", roleRequired(["admin", "employe"]), async (req, res) => {
  try {
    const { status, client_id, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT
        e.*,
        c.company_name as client_name,
        c.firstname as client_firstname,
        c.lastname as client_lastname,
        u.firstname as created_by_firstname,
        u.lastname as created_by_lastname
      FROM events e
      LEFT JOIN clients c ON e.client_id = c.id
      LEFT JOIN users u ON e.created_by = u.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND e.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (client_id) {
      query += ` AND e.client_id = $${paramIndex}`;
      params.push(client_id);
      paramIndex++;
    }

    query += ` ORDER BY e.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    res.json({
      events: result.rows,
      count: result.rows.length
    });

  } catch (err) {
    console.error("Erreur GET /events/admin:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// GET /api/events/:id - Detail d'un evenement
// ============================================
router.get("/:id", authOptional, async (req, res) => {
  try {
    const { id } = req.params;

    // Requete de base
    let query = `
      SELECT
        e.*,
        c.company_name as client_name,
        c.firstname as client_firstname,
        c.lastname as client_lastname
      FROM events e
      LEFT JOIN clients c ON e.client_id = c.id
      WHERE e.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Evenement non trouve" });
    }

    const event = result.rows[0];

    // Si l'evenement n'est pas public, verifier les droits
    if (!event.is_public || event.status === 'brouillon') {
      if (!req.user) {
        return res.status(403).json({ error: "Acces refuse" });
      }
      // Seuls admin, employe ou le client concerne peuvent voir
      const isStaff = ['admin', 'employe'].includes(req.user.role);
      const isOwner = event.client_id && req.user.clientId === event.client_id;

      if (!isStaff && !isOwner) {
        return res.status(403).json({ error: "Acces refuse" });
      }
    }

    // Recuperer les prestations associees
    const prestationsResult = await pool.query(
      "SELECT * FROM prestations WHERE event_id = $1 ORDER BY id",
      [id]
    );

    event.prestations = prestationsResult.rows;

    res.json({ event });

  } catch (err) {
    console.error("Erreur GET /events/:id:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// POST /api/events - Creer un evenement (admin)
// ============================================
router.post("/", roleRequired("admin"), async (req, res) => {
  try {
    const {
      name, description, event_type, theme,
      start_date, end_date, location, participants_count,
      image_url, status, is_public, client_id
    } = req.body;

    // Validation
    if (!name || !start_date || !end_date || !location) {
      return res.status(400).json({
        error: "Champs obligatoires: name, start_date, end_date, location"
      });
    }

    const result = await pool.query(
      `INSERT INTO events (
        name, description, event_type, theme,
        start_date, end_date, location, participants_count,
        image_url, status, is_public, client_id, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        name,
        description || null,
        event_type || 'autre',
        theme || null,
        start_date,
        end_date,
        location,
        participants_count || null,
        image_url || null,
        status || 'brouillon',
        is_public || false,
        client_id || null,
        req.user.id
      ]
    );

    const event = result.rows[0];

    // Log de l'action
    await logAction({ type_action: "CREATION_EVENEMENT", userId: req.user.id, details: {
      event_id: event.id,
      event_name: event.name
    } });

    res.status(201).json({
      message: "Evenement cree avec succes",
      event
    });

  } catch (err) {
    console.error("Erreur POST /events:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// PUT /api/events/:id - Modifier un evenement (admin)
// ============================================
router.put("/:id", roleRequired("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, description, event_type, theme,
      start_date, end_date, location, participants_count,
      image_url, status, is_public, client_approved_public, client_id
    } = req.body;

    // Verifier que l'evenement existe
    const existing = await pool.query("SELECT * FROM events WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Evenement non trouve" });
    }

    const oldEvent = existing.rows[0];

    const result = await pool.query(
      `UPDATE events SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        event_type = COALESCE($3, event_type),
        theme = COALESCE($4, theme),
        start_date = COALESCE($5, start_date),
        end_date = COALESCE($6, end_date),
        location = COALESCE($7, location),
        participants_count = COALESCE($8, participants_count),
        image_url = COALESCE($9, image_url),
        status = COALESCE($10, status),
        is_public = COALESCE($11, is_public),
        client_approved_public = COALESCE($12, client_approved_public),
        client_id = COALESCE($13, client_id),
        updated_at = NOW()
      WHERE id = $14
      RETURNING *`,
      [
        name, description, event_type, theme,
        start_date, end_date, location, participants_count,
        image_url, status, is_public, client_approved_public, client_id,
        id
      ]
    );

    const event = result.rows[0];

    // Log si changement de statut
    if (status && status !== oldEvent.status) {
      await logAction({ type_action: "MODIFICATION_STATUT_EVENEMENT", userId: req.user.id, details: {
        event_id: event.id,
        ancien_statut: oldEvent.status,
        nouveau_statut: status
      } });
    }

    res.json({
      message: "Evenement mis a jour",
      event
    });

  } catch (err) {
    console.error("Erreur PUT /events/:id:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// DELETE /api/events/:id - Supprimer un evenement (admin)
// ============================================
router.delete("/:id", roleRequired("admin"), async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query("SELECT * FROM events WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Evenement non trouve" });
    }

    const event = existing.rows[0];

    await pool.query("DELETE FROM events WHERE id = $1", [id]);

    await logAction({ type_action: "SUPPRESSION_EVENEMENT", userId: req.user.id, details: {
      event_id: event.id,
      event_name: event.name
    } });

    res.json({ message: "Evenement supprime" });

  } catch (err) {
    console.error("Erreur DELETE /events/:id:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// POST /api/events/:id/prestations - Ajouter une prestation
// ============================================
router.post("/:id/prestations", roleRequired("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { label, amount_ht, tva_rate = 20 } = req.body;

    if (!label || !amount_ht) {
      return res.status(400).json({ error: "label et amount_ht sont requis" });
    }

    // Verifier que l'evenement existe
    const eventExists = await pool.query("SELECT id FROM events WHERE id = $1", [id]);
    if (eventExists.rows.length === 0) {
      return res.status(404).json({ error: "Evenement non trouve" });
    }

    const result = await pool.query(
      `INSERT INTO prestations (event_id, label, amount_ht, tva_rate)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, label, amount_ht, tva_rate]
    );

    res.status(201).json({
      message: "Prestation ajoutee",
      prestation: result.rows[0]
    });

  } catch (err) {
    console.error("Erreur POST /events/:id/prestations:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// DELETE /api/events/:eventId/prestations/:prestationId
// ============================================
router.delete("/:eventId/prestations/:prestationId", roleRequired("admin"), async (req, res) => {
  try {
    const { eventId, prestationId } = req.params;

    const result = await pool.query(
      "DELETE FROM prestations WHERE id = $1 AND event_id = $2 RETURNING *",
      [prestationId, eventId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Prestation non trouvee" });
    }

    res.json({ message: "Prestation supprimee" });

  } catch (err) {
    console.error("Erreur DELETE prestation:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// GET /api/events/types - Liste des types d'evenements
// ============================================
router.get("/meta/types", async (req, res) => {
  res.json({
    types: [
      { value: "seminaire", label: "Séminaire" },
      { value: "conference", label: "Conférence" },
      { value: "soiree_entreprise", label: "Soirée d'entreprise" },
      { value: "team_building", label: "Team Building" },
      { value: "inauguration", label: "Inauguration" },
      { value: "autre", label: "Autre" }
    ]
  });
});

// ============================================
// GET /api/events/statuses - Liste des statuts
// ============================================
router.get("/meta/statuses", async (req, res) => {
  res.json({
    statuses: [
      { value: "brouillon", label: "Brouillon" },
      { value: "en_attente", label: "En attente" },
      { value: "accepte", label: "Accepté" },
      { value: "en_cours", label: "En cours" },
      { value: "termine", label: "Terminé" },
      { value: "annule", label: "Annulé" }
    ]
  });
});

module.exports = router;
