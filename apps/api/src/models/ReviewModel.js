const { pool } = require("../db/postgres");

/**
 * ReviewModel - Couche d'acces aux donnees pour les avis clients.
 */
class ReviewModel {

  static async findPublic({ rating, eventId, featured, limit = 20 }) {
    const where = ["r.status = 'valide'"];
    const values = [];

    if (rating) {
      values.push(rating);
      where.push(`r.rating = $${values.length}`);
    }

    if (eventId) {
      values.push(Number(eventId));
      where.push(`r.event_id = $${values.length}`);
    }

    if (featured) {
      where.push("r.is_featured = TRUE");
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    values.push(limit);
    const { rows } = await pool.query(
      `SELECT r.id, r.author_name, r.author_company, r.rating, r.title, r.content,
              r.is_featured, r.created_at,
              e.name as event_name
       FROM reviews r
       LEFT JOIN events e ON r.event_id = e.id
       ${whereSql}
       ORDER BY r.is_featured DESC, r.created_at DESC
       LIMIT $${values.length}`,
      values
    );
    return rows;
  }

  static async getStats() {
    const { rows } = await pool.query(`
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
    return rows[0];
  }

  static async findPending() {
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
    return rows;
  }

  static async findAll({ status, limit = 50 } = {}) {
    const where = [];
    const values = [];

    if (status) {
      values.push(status);
      where.push(`r.status = $${values.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    values.push(limit);
    const { rows } = await pool.query(
      `SELECT r.id, r.author_name, r.author_company, r.rating, r.title, r.content,
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
       LIMIT $${values.length}`,
      values
    );
    return rows;
  }

  static async create({ clientId, eventId, authorName, authorCompany, rating, title, content }) {
    const { rows } = await pool.query(
      `INSERT INTO reviews (client_id, event_id, author_name, author_company, rating, title, content, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'en_attente')
       RETURNING id, created_at`,
      [clientId, eventId, authorName, authorCompany, rating, title, content]
    );
    return rows[0];
  }

  static async validate(id, userId, isFeatured) {
    const { rows } = await pool.query(
      `UPDATE reviews
       SET status = 'valide', validated_by = $1, validated_at = NOW(), is_featured = $3
       WHERE id = $2
       RETURNING id, status, is_featured`,
      [userId, id, Boolean(isFeatured)]
    );
    return rows[0] || null;
  }

  static async reject(id, userId, reason) {
    const { rows } = await pool.query(
      `UPDATE reviews
       SET status = 'refuse', validated_by = $1, validated_at = NOW(), rejection_reason = $3
       WHERE id = $2
       RETURNING id, status`,
      [userId, id, reason || null]
    );
    return rows[0] || null;
  }

  static async toggleFeatured(id, isFeatured) {
    const { rows } = await pool.query(
      `UPDATE reviews
       SET is_featured = $1
       WHERE id = $2 AND status = 'valide'
       RETURNING id, is_featured`,
      [Boolean(isFeatured), id]
    );
    return rows[0] || null;
  }

  static async delete(id) {
    const { rows } = await pool.query(
      "DELETE FROM reviews WHERE id = $1 RETURNING id",
      [id]
    );
    return rows.length > 0;
  }

  static async findClientByUserId(userId) {
    const { rows } = await pool.query(
      "SELECT id FROM clients WHERE user_id = $1 LIMIT 1",
      [userId]
    );
    return rows[0] || null;
  }

  static async eventExists(eventId) {
    const { rows } = await pool.query(
      "SELECT id FROM events WHERE id = $1",
      [eventId]
    );
    return rows.length > 0;
  }
}

module.exports = ReviewModel;
