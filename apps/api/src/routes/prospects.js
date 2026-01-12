const express = require("express");
const router = express.Router();

const { pool } = require("../db/postgres");
const { getMongoDb } = require("../db/mongo");

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

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

module.exports = router;