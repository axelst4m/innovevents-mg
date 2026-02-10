const express = require("express");
const bcrypt = require("bcryptjs");
const { pool } = require("../db/postgres");
const { roleRequired } = require("../middlewares/auth");
const { logAction } = require("../utils/logger");
const { validateEmail } = require("../utils/validators");
const { generateTempPassword } = require("../utils/password");

const router = express.Router();

// ============================================
// GET /api/users - Liste tous les utilisateurs (admin only)
// ============================================
router.get("/", roleRequired("admin"), async (req, res) => {
  try {
    const { role, status } = req.query;

    const where = [];
    const values = [];

    if (role) {
      values.push(role);
      where.push(`role = $${values.length}`);
    }

    if (status === "active") {
      where.push("is_active = TRUE");
    } else if (status === "inactive") {
      where.push("is_active = FALSE");
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const result = await pool.query(
      `SELECT id, email, firstname, lastname, role, is_active, must_change_password, created_at, updated_at
       FROM users
       ${whereSql}
       ORDER BY created_at DESC`,
      values
    );

    res.json({ users: result.rows });

  } catch (err) {
    console.error("Erreur GET /users:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// GET /api/users/:id - Detail d'un utilisateur
// ============================================
router.get("/:id", roleRequired("admin"), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT u.id, u.email, u.firstname, u.lastname, u.role, u.is_active,
              u.must_change_password, u.created_at, u.updated_at,
              c.id as client_id, c.company_name
       FROM users u
       LEFT JOIN clients c ON c.user_id = u.id
       WHERE u.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouve" });
    }

    res.json({ user: result.rows[0] });

  } catch (err) {
    console.error("Erreur GET /users/:id:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// POST /api/users - Creer un utilisateur (admin only)
// ============================================
router.post("/", roleRequired("admin"), async (req, res) => {
  try {
    const { email, firstname, lastname, role } = req.body;

    // Validation
    if (!email || !firstname || !lastname || !role) {
      return res.status(400).json({
        error: "Champs requis: email, firstname, lastname, role"
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: "Format d'email invalide" });
    }

    if (!["admin", "employe", "client"].includes(role)) {
      return res.status(400).json({ error: "Role invalide (admin, employe, client)" });
    }

    // Verifier si email existe deja
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase()]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Cet email est deja utilise" });
    }

    // Generer mot de passe temporaire
    const tempPassword = generateTempPassword();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    // Insertion
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, firstname, lastname, role, must_change_password)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING id, email, firstname, lastname, role, is_active, created_at`,
      [email.toLowerCase(), passwordHash, firstname, lastname, role]
    );

    const user = result.rows[0];

    // Log
    await logAction({ type_action: "CREATION_UTILISATEUR_ADMIN", userId: req.user.id, details: {
      created_user_id: user.id,
      email: user.email,
      role: user.role
    } });

    // TODO: envoyer email avec mot de passe temporaire
    console.log(`[DEV] Mot de passe temporaire pour ${user.email}: ${tempPassword}`);

    res.status(201).json({
      message: "Utilisateur cree avec succes",
      user,
      tempPassword // En dev, a retirer en prod
    });

  } catch (err) {
    console.error("Erreur POST /users:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// PUT /api/users/:id - Modifier un utilisateur
// ============================================
router.put("/:id", roleRequired("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { firstname, lastname, role } = req.body;

    // Verifier que l'utilisateur existe
    const existing = await pool.query("SELECT id, role FROM users WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouve" });
    }

    // Empecher de modifier son propre role (securite)
    if (parseInt(id) === req.user.id && role && role !== existing.rows[0].role) {
      return res.status(403).json({ error: "Vous ne pouvez pas modifier votre propre role" });
    }

    // Construire la requete dynamique
    const updates = [];
    const values = [];

    if (firstname) {
      values.push(firstname);
      updates.push(`firstname = $${values.length}`);
    }
    if (lastname) {
      values.push(lastname);
      updates.push(`lastname = $${values.length}`);
    }
    if (role && ["admin", "employe", "client"].includes(role)) {
      values.push(role);
      updates.push(`role = $${values.length}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "Aucune donnee a modifier" });
    }

    updates.push("updated_at = NOW()");
    values.push(id);

    const result = await pool.query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${values.length}
       RETURNING id, email, firstname, lastname, role, is_active, updated_at`,
      values
    );

    // Log
    await logAction({ type_action: "MODIFICATION_UTILISATEUR", userId: req.user.id, details: {
      modified_user_id: parseInt(id),
      changes: { firstname, lastname, role }
    } });

    res.json({
      message: "Utilisateur modifie",
      user: result.rows[0]
    });

  } catch (err) {
    console.error("Erreur PUT /users/:id:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// PATCH /api/users/:id/toggle-status - Activer/Desactiver
// ============================================
router.patch("/:id/toggle-status", roleRequired("admin"), async (req, res) => {
  try {
    const { id } = req.params;

    // Empecher de se desactiver soi-meme
    if (parseInt(id) === req.user.id) {
      return res.status(403).json({ error: "Vous ne pouvez pas desactiver votre propre compte" });
    }

    // Verifier que l'utilisateur existe
    const existing = await pool.query(
      "SELECT id, email, is_active FROM users WHERE id = $1",
      [id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouve" });
    }

    const currentStatus = existing.rows[0].is_active;
    const newStatus = !currentStatus;

    await pool.query(
      "UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2",
      [newStatus, id]
    );

    // Log
    await logAction({ type_action: newStatus ? "REACTIVATION_COMPTE" : "DESACTIVATION_COMPTE", userId: req.user.id, details: {
      target_user_id: parseInt(id),
      email: existing.rows[0].email
    } });

    res.json({
      message: newStatus ? "Compte reactive" : "Compte desactive",
      is_active: newStatus
    });

  } catch (err) {
    console.error("Erreur PATCH /users/:id/toggle-status:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// POST /api/users/:id/reset-password - Reset mot de passe
// ============================================
router.post("/:id/reset-password", roleRequired("admin"), async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query(
      "SELECT id, email FROM users WHERE id = $1",
      [id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouve" });
    }

    // Generer nouveau mot de passe
    const tempPassword = generateTempPassword();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    await pool.query(
      `UPDATE users SET password_hash = $1, must_change_password = TRUE, updated_at = NOW()
       WHERE id = $2`,
      [passwordHash, id]
    );

    // Log
    await logAction({ type_action: "RESET_PASSWORD_ADMIN", userId: req.user.id, details: {
      target_user_id: parseInt(id),
      email: existing.rows[0].email
    } });

    // TODO: envoyer email
    console.log(`[DEV] Nouveau mot de passe pour ${existing.rows[0].email}: ${tempPassword}`);

    res.json({
      message: "Mot de passe reinitialise",
      tempPassword // En dev
    });

  } catch (err) {
    console.error("Erreur POST /users/:id/reset-password:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// GET /api/users/stats/count - Stats utilisateurs
// ============================================
router.get("/stats/count", roleRequired("admin"), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE role = 'admin') as admins,
        COUNT(*) FILTER (WHERE role = 'employe') as employes,
        COUNT(*) FILTER (WHERE role = 'client') as clients,
        COUNT(*) FILTER (WHERE is_active = TRUE) as actifs,
        COUNT(*) FILTER (WHERE is_active = FALSE) as inactifs,
        COUNT(*) as total
      FROM users
    `);

    res.json({ stats: result.rows[0] });

  } catch (err) {
    console.error("Erreur GET /users/stats/count:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
