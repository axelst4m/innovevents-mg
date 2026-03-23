const { pool } = require("../db/postgres");

/**
 * EventModel - Couche d'acces aux donnees pour les evenements.
 */
class EventModel {

  static async findPublic({ type, theme, startDate, endDate, limit = 20, offset = 0 }) {
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

    if (type) {
      query += ` AND e.event_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (theme) {
      query += ` AND e.theme ILIKE $${paramIndex}`;
      params.push(`%${theme}%`);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND e.start_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND e.end_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY e.start_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const { rows } = await pool.query(query, params);
    return rows;
  }

  static async findAdmin({ status, clientId, limit = 50, offset = 0 }) {
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

    if (clientId) {
      query += ` AND e.client_id = $${paramIndex}`;
      params.push(clientId);
      paramIndex++;
    }

    query += ` ORDER BY e.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const { rows } = await pool.query(query, params);
    return rows;
  }

  static async findById(id) {
    const { rows } = await pool.query(
      `SELECT
        e.*,
        c.company_name as client_name,
        c.firstname as client_firstname,
        c.lastname as client_lastname
       FROM events e
       LEFT JOIN clients c ON e.client_id = c.id
       WHERE e.id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  static async create(data) {
    const { rows } = await pool.query(
      `INSERT INTO events (
        name, description, event_type, theme,
        start_date, end_date, location, participants_count,
        image_url, status, is_public, client_id, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        data.name, data.description || null, data.event_type || 'autre',
        data.theme || null, data.start_date, data.end_date, data.location,
        data.participants_count || null, data.image_url || null,
        data.status || 'brouillon', data.is_public || false,
        data.client_id || null, data.created_by
      ]
    );
    return rows[0];
  }

  static async update(id, data) {
    const { rows } = await pool.query(
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
        data.name, data.description, data.event_type, data.theme,
        data.start_date, data.end_date, data.location, data.participants_count,
        data.image_url, data.status, data.is_public, data.client_approved_public,
        data.client_id, id
      ]
    );
    return rows[0] || null;
  }

  static async delete(id) {
    const { rows } = await pool.query(
      "DELETE FROM events WHERE id = $1 RETURNING id, name",
      [id]
    );
    return rows[0] || null;
  }

  static async findPrestations(eventId) {
    const { rows } = await pool.query(
      "SELECT * FROM prestations WHERE event_id = $1 ORDER BY id",
      [eventId]
    );
    return rows;
  }

  static async createPrestation({ eventId, label, amountHt, tvaRate }) {
    const { rows } = await pool.query(
      `INSERT INTO prestations (event_id, label, amount_ht, tva_rate)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [eventId, label, amountHt, tvaRate]
    );
    return rows[0];
  }

  static async deletePrestation(prestationId, eventId) {
    const { rows } = await pool.query(
      "DELETE FROM prestations WHERE id = $1 AND event_id = $2 RETURNING *",
      [prestationId, eventId]
    );
    return rows[0] || null;
  }
}

module.exports = EventModel;
