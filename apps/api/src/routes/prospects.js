const express = require("express");
const router = express.Router();

const { pool } = require("../db/postgres");
const { getMongoDb } = require("../db/mongo");

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// Route POST

router.post("/prospects", async (req, res) => {
  try {
    const {
      company_name,
      firstname,
      lastname,
      email,
      phone,
      location,
      event_type,
      event_date,
      participants,
      message,
    } = req.body || {};

    // Validd simple
    const errors = [];
    const required = {
      company_name,
      firstname,
      lastname,
      email,
      phone,
      location,
      event_type,
      event_date,
      participants,
      message,
    };

    for (const [k, v] of Object.entries(required)) {
      if (v === undefined || v === null || String(v).trim() === "") {
        errors.push({ field: k, message: "Champ obligatoire" });
      }
    }

    if (email && !isEmail(email)) errors.push({ field: "email", message: "Email invalide" });

    const participantsInt = Number(participants);
    if (!Number.isInteger(participantsInt) || participantsInt <= 0) {
      errors.push({ field: "participants", message: "Nombre de participants invalide" });
    }

    if (errors.length) return res.status(400).json({ ok: false, errors });

    // Insert SQL
    const insertQuery = `
      INSERT INTO prospects (
        company_name, firstname, lastname, email, phone, location,
        event_type, event_date, participants, message
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING id, status, created_at
    `;

    const values = [
      company_name.trim(),
      firstname.trim(),
      lastname.trim(),
      email.trim(),
      phone.trim(),
      location.trim(),
      event_type.trim(),
      event_date, // YYYY-MM-DD
      participantsInt,
      message.trim(),
    ];

    const { rows } = await pool.query(insertQuery, values);
    const created = rows[0];

    // Log MongoDB
    try {
      const mongo = await getMongoDb();
      await mongo.collection("logs").insertOne({
        timestamp: new Date(),
        type_action: "QUOTE_REQUEST_CREATED",
        id_utilisateur: null,
        details: {
          prospect_id: created.id,
          email: email.trim(),
          event_type: event_type.trim(),
        },
      });
    } catch (e) {
      // blok pas la feature si log NoSQL échoue (bug v1)
      console.error("Mongo log failed:", e.message);
    }

    return res.status(201).json({
      ok: true,
      prospect: { id: created.id, status: created.status, created_at: created.created_at },
      message:
        "Merci pour votre demande. Axel vous recontactera dans les plus brefs délais pour discuter de votre projet.",
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
});

// Route GET
router.get("/prospects", async (req, res) => {
  try {
    const { status, limit } = req.query;

    // limit : sécupour éviter des gros dumps
    let limitInt = Number(limit || 50);
    if (!Number.isInteger(limitInt) || limitInt <= 0) limitInt = 50;
    if (limitInt > 200) limitInt = 200;

    const where = [];
    const values = [];

    if (status && String(status).trim() !== "") {
      values.push(String(status).trim());
      where.push(`status = $${values.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const query = `
      SELECT
        id,
        company_name,
        firstname,
        lastname,
        email,
        phone,
        location,
        event_type,
        event_date,
        participants,
        status,
        created_at
      FROM prospects
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT ${limitInt}
    `;

    const { rows } = await pool.query(query, values);

    return res.json({ ok: true, count: rows.length, prospects: rows });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
});

// Route GET by ID
router.get("/prospects/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ ok: false, error: "ID invalide" });
    }

    const query = `
      SELECT
        p.id,
        p.company_name,
        p.firstname,
        p.lastname,
        p.email,
        p.phone,
        p.location,
        p.event_type,
        p.event_date,
        p.participants,
        p.message,
        p.status,
        p.created_at,
        p.client_id,
        d.id as devis_id,
        d.reference as devis_reference
      FROM prospects p
      LEFT JOIN devis d ON d.client_id = p.client_id
      WHERE p.id = $1
      LIMIT 1
    `;

    const { rows } = await pool.query(query, [id]);
    if (!rows.length) {
      return res.status(404).json({ ok: false, error: "Prospect introuvable" });
    }

    return res.json({ ok: true, prospect: rows[0] });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
});

// Route PATCH status
router.patch("/prospects/:id/status", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ ok: false, error: "ID invalide" });
    }

    const { status } = req.body || {};
    const nextStatus = String(status || "").trim();

    // Liste volontairement simple (on peut étendre plus tard)
    const allowed = new Set(["a_contacter", "contacte", "qualifie", "refuse"]);
    if (!allowed.has(nextStatus)) {
      return res.status(400).json({
        ok: false,
        error: "Statut invalide",
        allowed: Array.from(allowed),
      });
    }

    const query = `
      UPDATE prospects
      SET status = $1
      WHERE id = $2
      RETURNING id, status, created_at
    `;

    const { rows } = await pool.query(query, [nextStatus, id]);
    if (!rows.length) {
      return res.status(404).json({ ok: false, error: "Prospect introuvable" });
    }

    // Log Mongo (optionnel, non bloquant)
    try {
      const mongo = await getMongoDb();
      await mongo.collection("logs").insertOne({
        timestamp: new Date(),
        type_action: "PROSPECT_STATUS_UPDATED",
        id_utilisateur: null,
        details: { prospect_id: id, status: nextStatus },
      });
    } catch (e) {
      console.error("Mongo log failed:", e.message);
    }

    return res.json({ ok: true, prospect: rows[0] });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
});
// Route GET clients (pour les selects, etc.)
router.get("/clients", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, company_name, firstname, lastname, email, phone, location, is_active, created_at
      FROM clients
      WHERE is_active = TRUE
      ORDER BY company_name ASC
    `);

    return res.json({ ok: true, clients: rows });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
});

// Route POST convert prospect to client
router.post("/prospects/:id/convert", async (req, res) => {
  try {
    const prospectId = Number(req.params.id);
    if (!Number.isInteger(prospectId) || prospectId <= 0) {
      return res.status(400).json({ ok: false, error: "ID prospect invalide" });
    }

    // 1) Charger le prospect avec toutes les infos de la demande
    const { rows: prospectRows } = await pool.query(
      `
      SELECT id, company_name, firstname, lastname, email, phone, location, client_id,
             event_type, event_date, participants, message
      FROM prospects
      WHERE id = $1
      LIMIT 1
      `,
      [prospectId]
    );

    if (!prospectRows.length) {
      return res.status(404).json({ ok: false, error: "Prospect introuvable" });
    }

    const prospect = prospectRows[0];

    // Si déjà converti
    if (prospect.client_id) {
      return res.status(409).json({
        ok: false,
        error: "Ce prospect est déjà rattaché à un client",
        client_id: prospect.client_id,
      });
    }

    // 2) Créer le client
    const { rows: clientRows } = await pool.query(
      `
      INSERT INTO clients (company_name, firstname, lastname, email, phone, location)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, company_name, firstname, lastname, email, created_at
      `,
      [
        prospect.company_name,
        prospect.firstname,
        prospect.lastname,
        prospect.email,
        prospect.phone,
        prospect.location,
      ]
    );

    const client = clientRows[0];

    // 2b) Si un compte utilisateur existe déjà avec cet email, on le lie
    const { rows: userRows } = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [prospect.email]
    );
    if (userRows.length > 0) {
      await pool.query(
        "UPDATE clients SET user_id = $1 WHERE id = $2",
        [userRows[0].id, client.id]
      );
    }

    // 3) Marquer le prospect comme converti (lien + date)
    await pool.query(
      `
      UPDATE prospects
      SET client_id = $1, converted_at = NOW(), status = 'qualifie'
      WHERE id = $2
      `,
      [client.id, prospectId]
    );

    // 4) Creer un devis brouillon avec les infos de la demande
    const customMessage = [
      `Demande initiale du ${new Date().toLocaleDateString("fr-FR")}:`,
      `- Type d'evenement: ${prospect.event_type || "Non specifie"}`,
      `- Date souhaitee: ${prospect.event_date || "Non specifiee"}`,
      `- Nombre de participants: ${prospect.participants || "Non specifie"}`,
      prospect.message ? `\nMessage du client:\n${prospect.message}` : ""
    ].filter(Boolean).join("\n");

    const { rows: devisRows } = await pool.query(
      `
      INSERT INTO devis (client_id, status, custom_message, valid_until)
      VALUES ($1, 'brouillon', $2, $3)
      RETURNING id, reference
      `,
      [
        client.id,
        customMessage,
        // Validite par defaut: 30 jours
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      ]
    );

    const devis = devisRows[0];

    // 5) Journalisation NoSQL (Mongo)
    try {
      const mongo = await getMongoDb();
      await mongo.collection("logs").insertOne({
        timestamp: new Date(),
        type_action: "CREATION_CLIENT",
        id_utilisateur: null,
        details: {
          client_id: client.id,
          client_name: `${client.firstname} ${client.lastname}`,
          devis_id: devis.id,
          devis_reference: devis.reference
        },
      });
    } catch (e) {
      console.error("Mongo log failed:", e.message);
    }

    return res.status(201).json({ ok: true, client, devis });
  } catch (e) {
    // email déjà existant (UNIQUE)
    if (String(e?.message || "").includes("duplicate key value")) {
      return res.status(409).json({ ok: false, error: "Email déjà utilisé par un client" });
    }

    console.error(e);
    return res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
});
module.exports = router;