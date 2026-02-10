const express = require("express");
const router = express.Router();

const { pool } = require("../db/postgres");
const { authRequired, roleRequired, authOptional } = require("../middlewares/auth");
const { logAction } = require("../utils/logger");

// ============================================
// GET /api/reviews - Liste des avis publics (valides uniquement)
// ============================================
router.get("/", async (req, res) => {
  try {
    const { limit, rating, event_id, featured } = req.query;

    let limitInt = Number(limit || 20);
    if (!Number.isInteger(limitInt) || limitInt <= 0) limitInt = 20;
    if (limitInt > 100) limitInt = 100;

    const where = ["status = 'valide'"];
    const values = [];

    // Filtres
    if (rating) {
      const ratingInt = Number(rating);
      if (ratingInt >= 1 && ratingInt <= 5) {
        values.push(ratingInt);
        where.push(`rating = $${values.length}`);
      }
    }

    if (event_id) {
      values.push(Number(event_id));
      where.push(`event_id = $${values.length}`);
    }

    if (featured === "true") {
      where.push("is_featured = TRUE");
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const { rows } = await pool.query(
      `
      SELECT r.id, r.author_name, r.author_company, r.rating, r.title, r.content,
             r.is_featured, r.created_at,
             e.name as event_name
      FROM reviews r
      LEFT JOIN events e ON r.event_id = e.id
      ${whereSql}
      ORDER BY r.is_featured DESC, r.created_at DESC
      LIMIT ${limitInt}
      `,
      values
    );

    // Calculer les stats
    const statsResult = await pool.query(`
      SELECT
        COUNT(*) as total,
        ROUND(AVG(rating)::numeric, 1) as average_rating,
        COUNT(*) FILTER (WHERE rating = 5) as five_stars,
        COUNT(*) FILTER (WHERE rating = 4) as four_stars,
        COUNT(*) FILTER (WHERE rating = 3) as three_stars,
        COUNT(*) FILTER (WHERE rating = 2) as two_stars,
        COUNT(*) FILTER (WHERE rating = 1) as one_star
      FROM reviews
      WHERE status = 'valide'
    `);

    return res.json({
      ok: true,
      count: rows.length,
      stats: statsResult.rows[0],
      reviews: rows
    });

  } catch (e) {
    console.error("Erreur GET /reviews:", e);
    return res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
});

// ============================================
// GET /api/reviews/pending - Liste des avis en attente (admin/employe)
// ============================================
router.get("/pending", roleRequired(["admin", "employe"]), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT r.id, r.author_name, r.author_company, r.rating, r.title, r.content,
             r.status, r.created_at,
             e.name as event_name,
             c.company_name as client_company
      FROM reviews r
      LEFT JOIN events e ON r.event_id = e.id
      LEFT JOIN clients c ON r.client_id = c.id
      WHERE r.status = 'en_attente'
      ORDER BY r.created_at ASC
    `);

    return res.json({ ok: true, count: rows.length, reviews: rows });

  } catch (e) {
    console.error("Erreur GET /reviews/pending:", e);
    return res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
});

// ============================================
// GET /api/reviews/all - Liste complete (admin/employe)
// ============================================
router.get("/all", roleRequired(["admin", "employe"]), async (req, res) => {
  try {
    const { status, limit } = req.query;

    let limitInt = Number(limit || 50);
    if (limitInt > 200) limitInt = 200;

    const where = [];
    const values = [];

    if (status) {
      values.push(status);
      where.push(`r.status = $${values.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const { rows } = await pool.query(
      `
      SELECT r.id, r.author_name, r.author_company, r.rating, r.title, r.content,
             r.status, r.is_featured, r.created_at, r.validated_at, r.rejection_reason,
             e.name as event_name,
             c.company_name as client_company,
             u.firstname as validated_by_firstname, u.lastname as validated_by_lastname
      FROM reviews r
      LEFT JOIN events e ON r.event_id = e.id
      LEFT JOIN clients c ON r.client_id = c.id
      LEFT JOIN users u ON r.validated_by = u.id
      ${whereSql}
      ORDER BY r.created_at DESC
      LIMIT ${limitInt}
      `,
      values
    );

    return res.json({ ok: true, count: rows.length, reviews: rows });

  } catch (e) {
    console.error("Erreur GET /reviews/all:", e);
    return res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
});

// ============================================
// POST /api/reviews - Soumettre un avis (client connecte ou anonyme)
// ============================================
router.post("/", authOptional, async (req, res) => {
  try {
    const { author_name, author_company, rating, title, content, event_id } = req.body || {};

    // Validation
    const errors = [];

    if (!author_name || String(author_name).trim() === "") {
      errors.push({ field: "author_name", message: "Nom obligatoire" });
    }

    const ratingInt = Number(rating);
    if (!Number.isInteger(ratingInt) || ratingInt < 1 || ratingInt > 5) {
      errors.push({ field: "rating", message: "Note entre 1 et 5 obligatoire" });
    }

    if (!title || String(title).trim() === "") {
      errors.push({ field: "title", message: "Titre obligatoire" });
    }

    if (!content || String(content).trim() === "") {
      errors.push({ field: "content", message: "Commentaire obligatoire" });
    }

    if (errors.length) {
      return res.status(400).json({ ok: false, errors });
    }

    // Client connecte ?
    let clientId = null;
    if (req.user) {
      // Chercher le client lie a cet utilisateur
      const clientResult = await pool.query(
        "SELECT id FROM clients WHERE user_id = $1 LIMIT 1",
        [req.user.id]
      );
      if (clientResult.rows.length > 0) {
        clientId = clientResult.rows[0].id;
      }
    }

    // Verifier l'evenement si fourni
    let eventIdValue = null;
    if (event_id) {
      const eventResult = await pool.query(
        "SELECT id FROM events WHERE id = $1",
        [Number(event_id)]
      );
      if (eventResult.rows.length > 0) {
        eventIdValue = eventResult.rows[0].id;
      }
    }

    // Inserer l'avis
    const { rows } = await pool.query(
      `
      INSERT INTO reviews (client_id, event_id, author_name, author_company, rating, title, content, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'en_attente')
      RETURNING id, created_at
      `,
      [
        clientId,
        eventIdValue,
        author_name.trim(),
        author_company ? author_company.trim() : null,
        ratingInt,
        title.trim(),
        content.trim()
      ]
    );

    const created = rows[0];

    // Log MongoDB
    await logAction({ type_action: "REVIEW_SUBMITTED", userId: req.user?.id || null, details: {
      review_id: created.id,
      author_name: author_name.trim(),
      rating: ratingInt
    } });

    return res.status(201).json({
      ok: true,
      message: "Merci pour votre avis ! Il sera publie apres validation par notre equipe.",
      review: { id: created.id, created_at: created.created_at }
    });

  } catch (e) {
    console.error("Erreur POST /reviews:", e);
    return res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
});

// ============================================
// PATCH /api/reviews/:id/validate - Valider un avis (admin/employe)
// ============================================
router.patch("/:id/validate", roleRequired(["admin", "employe"]), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ ok: false, error: "ID invalide" });
    }

    const { is_featured } = req.body || {};

    const { rows } = await pool.query(
      `
      UPDATE reviews
      SET status = 'valide',
          validated_by = $1,
          validated_at = NOW(),
          is_featured = $3
      WHERE id = $2
      RETURNING id, status, is_featured
      `,
      [req.user.id, id, Boolean(is_featured)]
    );

    if (!rows.length) {
      return res.status(404).json({ ok: false, error: "Avis introuvable" });
    }

    // Log
    await logAction({ type_action: "REVIEW_VALIDATED", userId: req.user.id, details: {
      review_id: id
    } });

    return res.json({ ok: true, review: rows[0] });

  } catch (e) {
    console.error("Erreur PATCH /reviews/:id/validate:", e);
    return res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
});

// ============================================
// PATCH /api/reviews/:id/reject - Refuser un avis (admin/employe)
// ============================================
router.patch("/:id/reject", roleRequired(["admin", "employe"]), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ ok: false, error: "ID invalide" });
    }

    const { reason } = req.body || {};

    const { rows } = await pool.query(
      `
      UPDATE reviews
      SET status = 'refuse',
          validated_by = $1,
          validated_at = NOW(),
          rejection_reason = $3
      WHERE id = $2
      RETURNING id, status
      `,
      [req.user.id, id, reason ? reason.trim() : null]
    );

    if (!rows.length) {
      return res.status(404).json({ ok: false, error: "Avis introuvable" });
    }

    // Log
    await logAction({ type_action: "REVIEW_REJECTED", userId: req.user.id, details: {
      review_id: id,
      reason
    } });

    return res.json({ ok: true, review: rows[0] });

  } catch (e) {
    console.error("Erreur PATCH /reviews/:id/reject:", e);
    return res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
});

// ============================================
// PATCH /api/reviews/:id/featured - Toggle featured (admin)
// ============================================
router.patch("/:id/featured", roleRequired("admin"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ ok: false, error: "ID invalide" });
    }

    const { is_featured } = req.body;

    const { rows } = await pool.query(
      `
      UPDATE reviews
      SET is_featured = $1
      WHERE id = $2 AND status = 'valide'
      RETURNING id, is_featured
      `,
      [Boolean(is_featured), id]
    );

    if (!rows.length) {
      return res.status(404).json({ ok: false, error: "Avis introuvable ou non valide" });
    }

    return res.json({ ok: true, review: rows[0] });

  } catch (e) {
    console.error("Erreur PATCH /reviews/:id/featured:", e);
    return res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
});

// ============================================
// DELETE /api/reviews/:id - Supprimer un avis (admin)
// ============================================
router.delete("/:id", roleRequired("admin"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ ok: false, error: "ID invalide" });
    }

    const { rows } = await pool.query(
      "DELETE FROM reviews WHERE id = $1 RETURNING id",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ ok: false, error: "Avis introuvable" });
    }

    return res.json({ ok: true, deleted: true });

  } catch (e) {
    console.error("Erreur DELETE /reviews/:id:", e);
    return res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
});

module.exports = router;
