const express = require("express");
const router = express.Router();

const { pool } = require("../db/postgres");
const { roleRequired, authOptional } = require("../middlewares/auth");
const { validateEmail } = require("../utils/validators");
const { logAction } = require("../utils/logger");

// ============================================
// POST /api/contact - Envoyer un message
// ============================================
router.post("/", authOptional, async (req, res) => {
  try {
    const { firstname, lastname, email, phone, subject, message } = req.body || {};

    // Validation
    const errors = [];
    const required = { firstname, lastname, email, subject, message };

    for (const [k, v] of Object.entries(required)) {
      if (v === undefined || v === null || String(v).trim() === "") {
        errors.push({ field: k, message: "Champ obligatoire" });
      }
    }

    if (email && !validateEmail(email)) {
      errors.push({ field: "email", message: "Email invalide" });
    }

    if (errors.length) {
      return res.status(400).json({ ok: false, errors });
    }

    // User connecte (optionnel)
    const userId = req.user?.id || null;

    // Insert en BDD
    const { rows } = await pool.query(
      `
      INSERT INTO contact_messages (firstname, lastname, email, phone, subject, message, user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, created_at
      `,
      [
        firstname.trim(),
        lastname.trim(),
        email.trim().toLowerCase(),
        phone ? phone.trim() : null,
        subject.trim(),
        message.trim(),
        userId
      ]
    );

    const created = rows[0];

    // Log MongoDB
    await logAction({ type_action: "CONTACT_MESSAGE_SENT", userId: userId, details: {
      message_id: created.id,
      email: email.trim().toLowerCase(),
      subject: subject.trim()
    } });

    return res.status(201).json({
      ok: true,
      message: "Merci pour votre message ! Nous vous repondrons dans les meilleurs delais.",
      contact: { id: created.id, created_at: created.created_at }
    });

  } catch (e) {
    console.error("Erreur POST /contact:", e);
    return res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
});

// ============================================
// GET /api/contact - Liste des messages (admin)
// ============================================
router.get("/", roleRequired("admin"), async (req, res) => {
  try {
    const { is_read, is_archived, limit } = req.query;

    let limitInt = Number(limit || 50);
    if (!Number.isInteger(limitInt) || limitInt <= 0) limitInt = 50;
    if (limitInt > 200) limitInt = 200;

    const where = [];
    const values = [];

    // Filtres
    if (is_read !== undefined) {
      values.push(is_read === "true" || is_read === "1");
      where.push(`is_read = $${values.length}`);
    }

    if (is_archived !== undefined) {
      values.push(is_archived === "true" || is_archived === "1");
      where.push(`is_archived = $${values.length}`);
    } else {
      // Par defaut, ne pas afficher les archives
      where.push("is_archived = FALSE");
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // On paramétrise le LIMIT pour éviter toute injection
    values.push(limitInt);
    const { rows } = await pool.query(
      `
      SELECT id, firstname, lastname, email, phone, subject, message,
             is_read, is_archived, user_id, created_at
      FROM contact_messages
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT $${values.length}
      `,
      values
    );

    return res.json({ ok: true, count: rows.length, messages: rows });

  } catch (e) {
    console.error("Erreur GET /contact:", e);
    return res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
});

// ============================================
// GET /api/contact/:id - Detail d'un message (admin)
// ============================================
router.get("/:id", roleRequired("admin"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ ok: false, error: "ID invalide" });
    }

    const { rows } = await pool.query(
      `
      SELECT id, firstname, lastname, email, phone, subject, message,
             is_read, is_archived, user_id, created_at
      FROM contact_messages
      WHERE id = $1
      `,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ ok: false, error: "Message introuvable" });
    }

    return res.json({ ok: true, message: rows[0] });

  } catch (e) {
    console.error("Erreur GET /contact/:id:", e);
    return res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
});

// ============================================
// PATCH /api/contact/:id - Marquer lu/archive (admin)
// ============================================
router.patch("/:id", roleRequired("admin"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ ok: false, error: "ID invalide" });
    }

    const { is_read, is_archived } = req.body || {};

    const updates = [];
    const values = [];

    if (is_read !== undefined) {
      values.push(Boolean(is_read));
      updates.push(`is_read = $${values.length}`);
    }

    if (is_archived !== undefined) {
      values.push(Boolean(is_archived));
      updates.push(`is_archived = $${values.length}`);
    }

    if (!updates.length) {
      return res.status(400).json({ ok: false, error: "Aucune modification" });
    }

    values.push(id);
    const { rows } = await pool.query(
      `
      UPDATE contact_messages
      SET ${updates.join(", ")}
      WHERE id = $${values.length}
      RETURNING id, is_read, is_archived
      `,
      values
    );

    if (!rows.length) {
      return res.status(404).json({ ok: false, error: "Message introuvable" });
    }

    return res.json({ ok: true, message: rows[0] });

  } catch (e) {
    console.error("Erreur PATCH /contact/:id:", e);
    return res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
});

// ============================================
// DELETE /api/contact/:id - Supprimer un message (admin)
// ============================================
router.delete("/:id", roleRequired("admin"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ ok: false, error: "ID invalide" });
    }

    const { rows } = await pool.query(
      "DELETE FROM contact_messages WHERE id = $1 RETURNING id",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ ok: false, error: "Message introuvable" });
    }

    return res.json({ ok: true, deleted: true });

  } catch (e) {
    console.error("Erreur DELETE /contact/:id:", e);
    return res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
});

module.exports = router;
