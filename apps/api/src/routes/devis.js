const express = require("express");
const { pool } = require("../db/postgres");
const { getMongoDb } = require("../db/mongo");
const { authRequired, roleRequired } = require("../middlewares/auth");
const { generateDevisPDF } = require("../utils/pdfGenerator");

const router = express.Router();

// ============================================
// Log une action dans MongoDB
// ============================================
async function logAction(type_action, userId, details) {
  try {
    const db = await getMongoDb();
    await db.collection("logs").insertOne({
      horodatage: new Date(),
      type_action,
      id_utilisateur: userId,
      details
    });
  } catch (err) {
    console.error("Erreur log MongoDB:", err.message);
  }
}

// ============================================
// GET /api/devis - Liste des devis (admin)
// ============================================
router.get("/", roleRequired("admin"), async (req, res) => {
  try {
    const { status, client_id, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT
        d.*,
        c.company_name as client_company,
        c.firstname as client_firstname,
        c.lastname as client_lastname,
        c.email as client_email,
        e.name as event_name
      FROM devis d
      JOIN clients c ON d.client_id = c.id
      LEFT JOIN events e ON d.event_id = e.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND d.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (client_id) {
      query += ` AND d.client_id = $${paramIndex}`;
      params.push(client_id);
      paramIndex++;
    }

    query += ` ORDER BY d.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    res.json({
      devis: result.rows,
      count: result.rows.length
    });

  } catch (err) {
    console.error("Erreur GET /devis:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// GET /api/devis/client - Devis du client connecte
// ============================================
router.get("/client", authRequired, async (req, res) => {
  try {
    // Trouver le client_id associe a l'utilisateur
    const userResult = await pool.query(
      "SELECT id FROM clients WHERE user_id = $1",
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.json({ devis: [] });
    }

    const clientId = userResult.rows[0].id;

    const result = await pool.query(`
      SELECT
        d.*,
        e.name as event_name,
        e.start_date as event_start_date,
        e.location as event_location
      FROM devis d
      LEFT JOIN events e ON d.event_id = e.id
      WHERE d.client_id = $1
      ORDER BY d.created_at DESC
    `, [clientId]);

    res.json({ devis: result.rows });

  } catch (err) {
    console.error("Erreur GET /devis/client:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// GET /api/devis/:id - Detail d'un devis
// ============================================
router.get("/:id", authRequired, async (req, res) => {
  try {
    const { id } = req.params;

    // Recuperer le devis
    const devisResult = await pool.query(`
      SELECT
        d.*,
        c.company_name as client_company,
        c.firstname as client_firstname,
        c.lastname as client_lastname,
        c.email as client_email,
        c.phone as client_phone,
        c.location as client_location,
        c.user_id as client_user_id,
        e.name as event_name,
        e.start_date as event_start_date,
        e.end_date as event_end_date,
        e.location as event_location
      FROM devis d
      JOIN clients c ON d.client_id = c.id
      LEFT JOIN events e ON d.event_id = e.id
      WHERE d.id = $1
    `, [id]);

    if (devisResult.rows.length === 0) {
      return res.status(404).json({ error: "Devis non trouve" });
    }

    const devis = devisResult.rows[0];

    // Verifier les droits d'acces
    const isAdmin = req.user.role === 'admin';
    const isEmploye = req.user.role === 'employe';
    const isOwner = devis.client_user_id === req.user.id;

    if (!isAdmin && !isEmploye && !isOwner) {
      return res.status(403).json({ error: "Acces refuse" });
    }

    // Recuperer les lignes du devis
    const lignesResult = await pool.query(`
      SELECT * FROM lignes_devis
      WHERE devis_id = $1
      ORDER BY sort_order, id
    `, [id]);

    devis.lignes = lignesResult.rows;

    res.json({ devis });

  } catch (err) {
    console.error("Erreur GET /devis/:id:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// POST /api/devis - Creer un devis (admin)
// ============================================
router.post("/", roleRequired("admin"), async (req, res) => {
  try {
    const {
      client_id,
      event_id,
      valid_until,
      custom_message,
      lignes = []
    } = req.body;

    if (!client_id) {
      return res.status(400).json({ error: "client_id est requis" });
    }

    // Creer le devis (la reference sera generee automatiquement)
    const devisResult = await pool.query(`
      INSERT INTO devis (client_id, event_id, valid_until, custom_message, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      client_id,
      event_id || null,
      valid_until || null,
      custom_message || null,
      req.user.id
    ]);

    const devis = devisResult.rows[0];

    // Ajouter les lignes si fournies
    for (let i = 0; i < lignes.length; i++) {
      const ligne = lignes[i];
      const quantity = ligne.quantity || 1;
      const unitPriceHt = parseFloat(ligne.unit_price_ht);
      const tvaRate = parseFloat(ligne.tva_rate || 20);

      const totalHt = quantity * unitPriceHt;
      const totalTva = totalHt * (tvaRate / 100);
      const totalTtc = totalHt + totalTva;

      await pool.query(`
        INSERT INTO lignes_devis (devis_id, label, description, quantity, unit_price_ht, tva_rate, total_ht, total_tva, total_ttc, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        devis.id,
        ligne.label,
        ligne.description || null,
        quantity,
        unitPriceHt,
        tvaRate,
        totalHt,
        totalTva,
        totalTtc,
        i
      ]);
    }

    // Recuperer le devis mis a jour avec les totaux
    const updatedDevis = await pool.query("SELECT * FROM devis WHERE id = $1", [devis.id]);

    await logAction("CREATION_DEVIS", req.user.id, {
      devis_id: devis.id,
      reference: devis.reference,
      client_id
    });

    res.status(201).json({
      message: "Devis cree avec succes",
      devis: updatedDevis.rows[0]
    });

  } catch (err) {
    console.error("Erreur POST /devis:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// PUT /api/devis/:id - Modifier un devis (admin)
// ============================================
router.put("/:id", roleRequired("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      event_id,
      valid_until,
      custom_message,
      status
    } = req.body;

    // Verifier que le devis existe
    const existing = await pool.query("SELECT * FROM devis WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Devis non trouve" });
    }

    const result = await pool.query(`
      UPDATE devis SET
        event_id = COALESCE($1, event_id),
        valid_until = COALESCE($2, valid_until),
        custom_message = COALESCE($3, custom_message),
        status = COALESCE($4, status),
        updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `, [event_id, valid_until, custom_message, status, id]);

    res.json({
      message: "Devis mis a jour",
      devis: result.rows[0]
    });

  } catch (err) {
    console.error("Erreur PUT /devis/:id:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// POST /api/devis/:id/lignes - Ajouter une ligne
// ============================================
router.post("/:id/lignes", roleRequired("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { label, description, quantity = 1, unit_price_ht, tva_rate = 20 } = req.body;

    if (!label || !unit_price_ht) {
      return res.status(400).json({ error: "label et unit_price_ht requis" });
    }

    // Verifier que le devis existe
    const devisExists = await pool.query("SELECT id FROM devis WHERE id = $1", [id]);
    if (devisExists.rows.length === 0) {
      return res.status(404).json({ error: "Devis non trouve" });
    }

    const qty = parseInt(quantity);
    const priceHt = parseFloat(unit_price_ht);
    const tva = parseFloat(tva_rate);

    const totalHt = qty * priceHt;
    const totalTva = totalHt * (tva / 100);
    const totalTtc = totalHt + totalTva;

    // Trouver le prochain sort_order
    const maxOrder = await pool.query(
      "SELECT COALESCE(MAX(sort_order), -1) + 1 as next_order FROM lignes_devis WHERE devis_id = $1",
      [id]
    );

    const result = await pool.query(`
      INSERT INTO lignes_devis (devis_id, label, description, quantity, unit_price_ht, tva_rate, total_ht, total_tva, total_ttc, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [id, label, description, qty, priceHt, tva, totalHt, totalTva, totalTtc, maxOrder.rows[0].next_order]);

    res.status(201).json({
      message: "Ligne ajoutee",
      ligne: result.rows[0]
    });

  } catch (err) {
    console.error("Erreur POST /devis/:id/lignes:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// DELETE /api/devis/:devisId/lignes/:ligneId
// ============================================
router.delete("/:devisId/lignes/:ligneId", roleRequired("admin"), async (req, res) => {
  try {
    const { devisId, ligneId } = req.params;

    const result = await pool.query(
      "DELETE FROM lignes_devis WHERE id = $1 AND devis_id = $2 RETURNING *",
      [ligneId, devisId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Ligne non trouvee" });
    }

    res.json({ message: "Ligne supprimee" });

  } catch (err) {
    console.error("Erreur DELETE ligne:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// POST /api/devis/:id/send - Envoyer le devis au client
// ============================================
router.post("/:id/send", roleRequired("admin"), async (req, res) => {
  try {
    const { id } = req.params;

    // Verifier le devis avec info sur le compte client
    const devisResult = await pool.query(`
      SELECT d.*,
             c.email as client_email,
             c.firstname as client_firstname,
             c.user_id as client_user_id
      FROM devis d
      JOIN clients c ON d.client_id = c.id
      WHERE d.id = $1
    `, [id]);

    if (devisResult.rows.length === 0) {
      return res.status(404).json({ error: "Devis non trouve" });
    }

    const devis = devisResult.rows[0];
    const clientHasAccount = !!devis.client_user_id;

    // Verifier qu'il y a des lignes
    const lignesCount = await pool.query(
      "SELECT COUNT(*) FROM lignes_devis WHERE devis_id = $1",
      [id]
    );

    if (parseInt(lignesCount.rows[0].count) === 0) {
      return res.status(400).json({ error: "Le devis doit contenir au moins une ligne" });
    }

    // Mettre a jour le statut
    await pool.query(`
      UPDATE devis
      SET status = 'envoye', sent_at = NOW(), updated_at = NOW()
      WHERE id = $1
    `, [id]);

    // TODO: Envoyer l'email avec le PDF
    console.log(`[DEV] Email envoye a ${devis.client_email} pour le devis ${devis.reference}`);

    await logAction("ENVOI_DEVIS", req.user.id, {
      devis_id: id,
      reference: devis.reference,
      client_email: devis.client_email,
      client_has_account: clientHasAccount
    });

    res.json({
      message: clientHasAccount
        ? "Devis envoye au client"
        : "Devis envoye. Note: ce client n'a pas encore de compte. Il devra s'inscrire avec l'email " + devis.client_email + " pour consulter son devis en ligne.",
      sent_to: devis.client_email,
      client_has_account: clientHasAccount
    });

  } catch (err) {
    console.error("Erreur POST /devis/:id/send:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// POST /api/devis/:id/accept - Client accepte le devis
// ============================================
router.post("/:id/accept", authRequired, async (req, res) => {
  try {
    const { id } = req.params;

    // Recuperer le devis et verifier l'acces
    const devisResult = await pool.query(`
      SELECT d.*, c.user_id as client_user_id
      FROM devis d
      JOIN clients c ON d.client_id = c.id
      WHERE d.id = $1
    `, [id]);

    if (devisResult.rows.length === 0) {
      return res.status(404).json({ error: "Devis non trouve" });
    }

    const devis = devisResult.rows[0];

    // Verifier que c'est bien le client ou un admin
    if (devis.client_user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Acces refuse" });
    }

    // Verifier le statut
    if (!['envoye', 'en_etude'].includes(devis.status)) {
      return res.status(400).json({ error: "Ce devis ne peut pas etre accepte dans son etat actuel" });
    }

    // Mettre a jour
    await pool.query(`
      UPDATE devis
      SET status = 'accepte', accepted_at = NOW(), updated_at = NOW()
      WHERE id = $1
    `, [id]);

    // Si lie a un evenement, mettre a jour son statut aussi
    if (devis.event_id) {
      await pool.query(`
        UPDATE events SET status = 'accepte', updated_at = NOW() WHERE id = $1
      `, [devis.event_id]);
    }

    await logAction("ACCEPTATION_DEVIS", req.user.id, {
      devis_id: id,
      reference: devis.reference
    });

    // TODO: Envoyer notification a Innov'Events

    res.json({ message: "Devis accepte" });

  } catch (err) {
    console.error("Erreur POST /devis/:id/accept:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// POST /api/devis/:id/refuse - Client refuse le devis
// ============================================
router.post("/:id/refuse", authRequired, async (req, res) => {
  try {
    const { id } = req.params;

    const devisResult = await pool.query(`
      SELECT d.*, c.user_id as client_user_id
      FROM devis d
      JOIN clients c ON d.client_id = c.id
      WHERE d.id = $1
    `, [id]);

    if (devisResult.rows.length === 0) {
      return res.status(404).json({ error: "Devis non trouve" });
    }

    const devis = devisResult.rows[0];

    if (devis.client_user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Acces refuse" });
    }

    if (!['envoye', 'en_etude'].includes(devis.status)) {
      return res.status(400).json({ error: "Ce devis ne peut pas etre refuse dans son etat actuel" });
    }

    await pool.query(`
      UPDATE devis
      SET status = 'refuse', refused_at = NOW(), updated_at = NOW()
      WHERE id = $1
    `, [id]);

    await logAction("REFUS_DEVIS", req.user.id, {
      devis_id: id,
      reference: devis.reference
    });

    res.json({ message: "Devis refuse" });

  } catch (err) {
    console.error("Erreur POST /devis/:id/refuse:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// POST /api/devis/:id/request-modification - Demander modif
// ============================================
router.post("/:id/request-modification", authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim() === "") {
      return res.status(400).json({ error: "Le motif de modification est requis" });
    }

    const devisResult = await pool.query(`
      SELECT d.*, c.user_id as client_user_id
      FROM devis d
      JOIN clients c ON d.client_id = c.id
      WHERE d.id = $1
    `, [id]);

    if (devisResult.rows.length === 0) {
      return res.status(404).json({ error: "Devis non trouve" });
    }

    const devis = devisResult.rows[0];

    if (devis.client_user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Acces refuse" });
    }

    await pool.query(`
      UPDATE devis
      SET status = 'modification', modification_reason = $1, updated_at = NOW()
      WHERE id = $2
    `, [reason.trim(), id]);

    await logAction("DEMANDE_MODIFICATION_DEVIS", req.user.id, {
      devis_id: id,
      reference: devis.reference,
      reason: reason.trim()
    });

    res.json({ message: "Demande de modification envoyee" });

  } catch (err) {
    console.error("Erreur POST /devis/:id/request-modification:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// GET /api/devis/:id/pdf - Generer le PDF
// ============================================
router.get("/:id/pdf", authRequired, async (req, res) => {
  try {
    const { id } = req.params;

    // Recuperer le devis complet
    const devisResult = await pool.query(`
      SELECT
        d.*,
        c.company_name as client_company,
        c.firstname as client_firstname,
        c.lastname as client_lastname,
        c.email as client_email,
        c.phone as client_phone,
        c.location as client_location,
        c.user_id as client_user_id,
        e.name as event_name,
        e.start_date as event_start_date,
        e.location as event_location
      FROM devis d
      JOIN clients c ON d.client_id = c.id
      LEFT JOIN events e ON d.event_id = e.id
      WHERE d.id = $1
    `, [id]);

    if (devisResult.rows.length === 0) {
      return res.status(404).json({ error: "Devis non trouve" });
    }

    const devis = devisResult.rows[0];

    // Verifier les droits
    const isAdmin = req.user.role === 'admin';
    const isEmploye = req.user.role === 'employe';
    const isOwner = devis.client_user_id === req.user.id;

    if (!isAdmin && !isEmploye && !isOwner) {
      return res.status(403).json({ error: "Acces refuse" });
    }

    // Recuperer les lignes
    const lignesResult = await pool.query(`
      SELECT * FROM lignes_devis WHERE devis_id = $1 ORDER BY sort_order, id
    `, [id]);

    devis.lignes = lignesResult.rows;

    // Log
    await logAction("GENERATION_PDF_DEVIS", req.user.id, {
      devis_id: id,
      reference: devis.reference
    });

    // Generer le PDF avec pdfkit
    const pdfBuffer = await generateDevisPDF(devis);

    // Envoyer le PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="devis-${devis.reference}.pdf"`
    );
    res.send(pdfBuffer);

  } catch (err) {
    console.error("Erreur GET /devis/:id/pdf:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
