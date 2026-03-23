const { pool } = require("../db/postgres");

/**
 * DevisModel - Couche d'acces aux donnees pour les devis.
 */
class DevisModel {

  static async findAll({ status, clientId, limit = 50, offset = 0 }) {
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

    if (clientId) {
      query += ` AND d.client_id = $${paramIndex}`;
      params.push(clientId);
      paramIndex++;
    }

    query += ` ORDER BY d.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const { rows } = await pool.query(query, params);
    return rows;
  }

  static async findByClientUserId(userId) {
    const clientResult = await pool.query(
      "SELECT id FROM clients WHERE user_id = $1",
      [userId]
    );

    if (clientResult.rows.length === 0) return [];

    const clientId = clientResult.rows[0].id;

    const { rows } = await pool.query(`
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
    return rows;
  }

  static async findById(id) {
    const { rows } = await pool.query(`
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
    return rows[0] || null;
  }

  static async create({ clientId, eventId, validUntil, customMessage, createdBy }) {
    const { rows } = await pool.query(`
      INSERT INTO devis (client_id, event_id, valid_until, custom_message, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [clientId, eventId || null, validUntil || null, customMessage || null, createdBy]);
    return rows[0];
  }

  static async createLigne({ devisId, label, description, quantity, unitPriceHt, tvaRate, totalHt, totalTva, totalTtc, sortOrder }) {
    await pool.query(`
      INSERT INTO lignes_devis (devis_id, label, description, quantity, unit_price_ht, tva_rate, total_ht, total_tva, total_ttc, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [devisId, label, description, quantity, unitPriceHt, tvaRate, totalHt, totalTva, totalTtc, sortOrder]);
  }

  static async findFresh(id) {
    const { rows } = await pool.query("SELECT * FROM devis WHERE id = $1", [id]);
    return rows[0] || null;
  }

  static async update(id, { eventId, validUntil, customMessage, status }) {
    const { rows } = await pool.query(`
      UPDATE devis SET
        event_id = COALESCE($1, event_id),
        valid_until = COALESCE($2, valid_until),
        custom_message = COALESCE($3, custom_message),
        status = COALESCE($4, status),
        updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `, [eventId, validUntil, customMessage, status, id]);
    return rows[0] || null;
  }

  static async addLigne({ devisId, label, description, quantity, unitPriceHt, tvaRate, totalHt, totalTva, totalTtc }) {
    const maxOrder = await pool.query(
      "SELECT COALESCE(MAX(sort_order), -1) + 1 as next_order FROM lignes_devis WHERE devis_id = $1",
      [devisId]
    );

    const { rows } = await pool.query(`
      INSERT INTO lignes_devis (devis_id, label, description, quantity, unit_price_ht, tva_rate, total_ht, total_tva, total_ttc, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [devisId, label, description, quantity, unitPriceHt, tvaRate, totalHt, totalTva, totalTtc, maxOrder.rows[0].next_order]);
    return rows[0];
  }

  static async deleteLigne(ligneId, devisId) {
    const { rows } = await pool.query(
      "DELETE FROM lignes_devis WHERE id = $1 AND devis_id = $2 RETURNING *",
      [ligneId, devisId]
    );
    return rows[0] || null;
  }

  static async findWithClient(id) {
    const { rows } = await pool.query(`
      SELECT d.*,
             c.email as client_email,
             c.firstname as client_firstname,
             c.user_id as client_user_id
      FROM devis d
      JOIN clients c ON d.client_id = c.id
      WHERE d.id = $1
    `, [id]);
    return rows[0] || null;
  }

  static async findWithClientFull(id) {
    const { rows } = await pool.query(`
      SELECT d.*,
             c.user_id as client_user_id,
             c.firstname as client_firstname,
             c.company_name as client_company
      FROM devis d
      JOIN clients c ON d.client_id = c.id
      WHERE d.id = $1
    `, [id]);
    return rows[0] || null;
  }

  static async countLignes(devisId) {
    const { rows } = await pool.query(
      "SELECT COUNT(*) FROM lignes_devis WHERE devis_id = $1",
      [devisId]
    );
    return parseInt(rows[0].count);
  }

  static async updateStatus(id, status, extraFields = {}) {
    // status passe en parametre prepare ($1), id en $2 : aucune concatenation de valeur dans le SQL
    const sets = ["status = $1", "updated_at = NOW()"];
    for (const [key, val] of Object.entries(extraFields)) {
      if (val === "NOW()") {
        sets.push(`${key} = NOW()`);
      }
    }
    await pool.query(
      `UPDATE devis SET ${sets.join(", ")} WHERE id = $2`,
      [status, id]
    );
  }

  static async setModification(id, reason) {
    await pool.query(
      `UPDATE devis SET status = 'modification', modification_reason = $1, updated_at = NOW() WHERE id = $2`,
      [reason, id]
    );
  }

  static async updateEventStatus(eventId, status) {
    await pool.query(
      `UPDATE events SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, eventId]
    );
  }

  static async findLignes(devisId) {
    const { rows } = await pool.query(`
      SELECT * FROM lignes_devis WHERE devis_id = $1 ORDER BY sort_order, id
    `, [devisId]);
    return rows;
  }

  static async findForPdf(id) {
    const { rows } = await pool.query(`
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
    return rows[0] || null;
  }
}

module.exports = DevisModel;
