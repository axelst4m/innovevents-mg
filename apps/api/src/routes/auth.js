const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../db/postgres");
const { logAction } = require("../utils/logger");
const { validateEmail, validatePassword } = require("../utils/validators");
const { generateTempPassword } = require("../utils/password");

const { sendWelcomeEmail, sendPasswordResetEmail } = require("../utils/mailer");

const router = express.Router();

// Récupérer le limiteur d'authentification depuis app.js
// Attention : dependance circulaire app -> auth -> app
// app.authLimiter peut etre undefined si app.js n'a pas fini de charger
let authLimiter;
try {
  const app = require("../app");
  authLimiter = app.authLimiter;
} catch (err) {
  // require a echoue
}
if (typeof authLimiter !== "function") {
  authLimiter = (req, res, next) => next(); // fallback: pas de limitation
}

// Config JWT — doit etre configure dans .env (pas de valeur par defaut)
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET manquant dans les variables d'environnement");
}
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "24h";

// ============================================
// POST /api/auth/register - Inscription
// ============================================
router.post("/register", async (req, res) => {
  try {
    const { email, password, firstname, lastname } = req.body;

    // Validation des champs obligatoires
    if (!email || !password || !firstname || !lastname) {
      return res.status(400).json({
        error: "Tous les champs sont obligatoires (email, password, firstname, lastname)"
      });
    }

    // Validation email
    if (!validateEmail(email)) {
      return res.status(400).json({ error: "Format d'email invalide" });
    }

    // Validation mot de passe
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    // Verifier si l'email existe deja
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase()]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Cet email est deja utilise" });
    }

    // Hashage du mot de passe (10 rounds de salt)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insertion en base
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, firstname, lastname, role)
       VALUES ($1, $2, $3, $4, 'client')
       RETURNING id, email, firstname, lastname, role, created_at`,
      [email.toLowerCase(), passwordHash, firstname, lastname]
    );

    const user = result.rows[0];

    // Verifier si un client existe avec cet email et le lier au compte
    let linkedClient = null;
    const clientResult = await pool.query(
      "SELECT id, company_name FROM clients WHERE email = $1 AND user_id IS NULL",
      [email.toLowerCase()]
    );

    if (clientResult.rows.length > 0) {
      // Lier le client au nouveau compte utilisateur
      await pool.query(
        "UPDATE clients SET user_id = $1 WHERE id = $2",
        [user.id, clientResult.rows[0].id]
      );
      linkedClient = clientResult.rows[0];
    }

    // Log de l'action
    await logAction({ type_action: "CREATION_COMPTE", userId: user.id, details: {
      email: user.email,
      role: user.role,
      linked_client_id: linkedClient?.id || null
    } });

    // Envoi email de bienvenue (non bloquant, on n'attend pas le résultat)
    sendWelcomeEmail(user).catch(err =>
      console.error("Erreur envoi email bienvenue:", err.message)
    );

    res.status(201).json({
      message: linkedClient
        ? `Compte cree avec succes. Votre espace client (${linkedClient.company_name}) a ete lie a votre compte.`
        : "Compte cree avec succes",
      user: {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role
      },
      linkedClient: linkedClient ? { id: linkedClient.id, company_name: linkedClient.company_name } : null
    });

  } catch (err) {
    console.error("Erreur register:", err);
    res.status(500).json({ error: "Erreur serveur lors de l'inscription" });
  }
});

// ============================================
// POST /api/auth/login - Connexion
// ============================================
router.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }

    // Recherche de l'utilisateur
    const result = await pool.query(
      `SELECT id, email, password_hash, firstname, lastname, role, is_active, must_change_password
       FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      // Log tentative echouee
      await logAction({ type_action: "CONNEXION_ECHOUEE", userId: null, details: {
        email: email.toLowerCase(),
        ip: clientIp,
        raison: "Email inconnu"
      } });
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }

    const user = result.rows[0];

    // Verifier si le compte est actif
    if (!user.is_active) {
      await logAction({ type_action: "CONNEXION_ECHOUEE", userId: user.id, details: {
        email: user.email,
        ip: clientIp,
        raison: "Compte desactive"
      } });
      return res.status(403).json({ error: "Compte desactive. Contactez l'administrateur." });
    }

    // Verifier le mot de passe
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      await logAction({ type_action: "CONNEXION_ECHOUEE", userId: user.id, details: {
        email: user.email,
        ip: clientIp,
        raison: "Mot de passe incorrect"
      } });
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }

    // Generer le token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Log connexion reussie
    await logAction({ type_action: "CONNEXION_REUSSIE", userId: user.id, details: {
      ip: clientIp
    } });

    res.json({
      message: "Connexion reussie",
      token,
      user: {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
        mustChangePassword: user.must_change_password
      }
    });

  } catch (err) {
    console.error("Erreur login:", err);
    res.status(500).json({ error: "Erreur serveur lors de la connexion" });
  }
});

// ============================================
// POST /api/auth/forgot-password - Mot de passe oublie
// Genere un nouveau mot de passe et l'envoie par mail
// ============================================
router.post("/forgot-password", authLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email requis" });
    }

    // Recherche de l'utilisateur
    const result = await pool.query(
      "SELECT id, email, firstname FROM users WHERE email = $1 AND is_active = TRUE",
      [email.toLowerCase()]
    );

    // On repond toujours OK pour eviter l'enumeration d'emails
    if (result.rows.length === 0) {
      return res.json({
        message: "Si cet email existe, un nouveau mot de passe a ete envoye"
      });
    }

    const user = result.rows[0];

    const tempPassword = generateTempPassword();

    // Hasher le nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    // Mettre a jour en base avec must_change_password = true
    await pool.query(
      `UPDATE users
       SET password_hash = $1, must_change_password = TRUE, updated_at = NOW()
       WHERE id = $2`,
      [passwordHash, user.id]
    );

    // Log de l'action
    await logAction({ type_action: "MOT_DE_PASSE_REINITIALISE", userId: user.id, details: {
      email: user.email
    } });

    // Envoi du mail avec le mot de passe temporaire
    sendPasswordResetEmail(user, tempPassword).catch(err =>
      console.error("Erreur envoi email reset:", err.message)
    );
    // Log en console aussi (pratique pour le dev)
    console.log(`[DEV] Nouveau mot de passe pour ${user.email}: ${tempPassword}`);

    res.json({
      message: "Si cet email existe, un nouveau mot de passe a ete envoye"
    });

  } catch (err) {
    console.error("Erreur forgot-password:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// POST /api/auth/change-password - Changer son mot de passe
// Necessite d'etre connecte
// ============================================
router.post("/change-password", async (req, res) => {
  try {
    // Recuperer le token depuis le header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token requis" });
    }

    const token = authHeader.split(" ")[1];

    // Verifier le token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Token invalide ou expire" });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Mot de passe actuel et nouveau mot de passe requis"
      });
    }

    // Validation du nouveau mot de passe
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    // Recuperer l'utilisateur
    const result = await pool.query(
      "SELECT id, password_hash FROM users WHERE id = $1",
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouve" });
    }

    const user = result.rows[0];

    // Verifier l'ancien mot de passe
    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: "Mot de passe actuel incorrect" });
    }

    // Hasher le nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Mettre a jour
    await pool.query(
      `UPDATE users
       SET password_hash = $1, must_change_password = FALSE, updated_at = NOW()
       WHERE id = $2`,
      [passwordHash, user.id]
    );

    // Log
    await logAction({ type_action: "CHANGEMENT_MOT_DE_PASSE", userId: user.id, details: {} });

    res.json({ message: "Mot de passe modifie avec succes" });

  } catch (err) {
    console.error("Erreur change-password:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// GET /api/auth/me - Recuperer son profil
// ============================================
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token requis" });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Token invalide ou expire" });
    }

    const result = await pool.query(
      `SELECT id, email, firstname, lastname, role, is_active, must_change_password, created_at
       FROM users WHERE id = $1`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouve" });
    }

    const user = result.rows[0];
    res.json({ user });

  } catch (err) {
    console.error("Erreur /me:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// GET /api/auth/users - Liste des utilisateurs (admin/employe)
// ============================================
router.get("/users", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token requis" });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Token invalide ou expire" });
    }

    // Seuls admin et employe peuvent lister
    if (decoded.role !== "admin" && decoded.role !== "employe") {
      return res.status(403).json({ error: "Acces refuse" });
    }

    const { role } = req.query;

    const where = ["is_active = TRUE"];
    const values = [];

    // Filtrer par role si demande
    if (role) {
      if (role === "employe") {
        where.push("role IN ('admin', 'employe')");
      } else {
        values.push(role);
        where.push(`role = $${values.length}`);
      }
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const result = await pool.query(
      `SELECT id, email, firstname, lastname, role, created_at
       FROM users
       ${whereSql}
       ORDER BY firstname, lastname`,
      values
    );

    res.json({ users: result.rows });

  } catch (err) {
    console.error("Erreur /users:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// DELETE /api/auth/account - Suppression de compte (RGPD)
// Anonymise les donnees de l'utilisateur et des clients lies
// ============================================
router.delete("/account", async (req, res) => {
  try {
    // Recuperer le token depuis le header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token requis" });
    }

    const token = authHeader.split(" ")[1];

    // Verifier le token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Token invalide ou expire" });
    }

    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Mot de passe requis" });
    }

    // Recuperer l'utilisateur
    const userResult = await pool.query(
      "SELECT id, password_hash FROM users WHERE id = $1",
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouve" });
    }

    const user = userResult.rows[0];

    // Verifier le mot de passe
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: "Mot de passe incorrect" });
    }

    const userId = user.id;

    // Anonymiser les donnees de l'utilisateur
    // Email -> deleted_<id>@anonymized.com
    // Nom/Prenom -> "Utilisateur supprime"
    // is_active -> false
    const anonymizedEmail = `deleted_${userId}@anonymized.com`;

    await pool.query(
      `UPDATE users
       SET email = $1, firstname = $2, lastname = $2, is_active = FALSE, updated_at = NOW()
       WHERE id = $3`,
      [anonymizedEmail, "Utilisateur supprimé", userId]
    );

    // Trouver les clients lies a cet utilisateur
    const clientsResult = await pool.query(
      "SELECT id FROM clients WHERE user_id = $1",
      [userId]
    );

    // Anonymiser les clients lies
    if (clientsResult.rows.length > 0) {
      for (const client of clientsResult.rows) {
        await pool.query(
          `UPDATE clients
           SET company_name = $1, contact_name = $2, email = $3, phone = $4, updated_at = NOW()
           WHERE id = $5`,
          ["Entreprise supprimée", "Utilisateur supprimé", anonymizedEmail, null, client.id]
        );

        // Anonymiser les devis de ce client
        await pool.query(
          `UPDATE devis
           SET client_name = $1, event_contact_name = $2, updated_at = NOW()
           WHERE client_id = $3`,
          ["Entreprise supprimée", "Utilisateur supprimé", client.id]
        );

        // Anonymiser les reviews/avis lies aux devis de ce client
        await pool.query(
          `UPDATE reviews
           SET author_name = $1, updated_at = NOW()
           WHERE devis_id IN (SELECT id FROM devis WHERE client_id = $2)`,
          ["Utilisateur supprimé", client.id]
        );
      }
    }

    // Log de l'action
    await logAction({ type_action: "SUPPRESSION_COMPTE", userId: userId, details: {
      email: `deleted_${userId}@anonymized.com`,
      clients_anonymises: clientsResult.rows.length
    } });

    res.json({ ok: true, message: "Compte supprime et anonymise avec succes" });

  } catch (err) {
    console.error("Erreur delete account:", err);
    res.status(500).json({ error: "Erreur serveur lors de la suppression" });
  }
});

module.exports = router;
