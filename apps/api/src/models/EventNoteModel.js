const { pool } = require("../db/postgres");

/**
 * EventNoteModel - Couche d'acces aux donnees pour les notes d'evenements.
 */
class EventNoteModel {

  static async findByEventId(eventId, userId) {
    const { rows } = await pool.query(
      `SELECT n.id, n.content, n.is_private, n.created_at, n.updated_at,
              u.id as user_id, u.firstname, u.lastname
       FROM event_notes n
       JOIN users u ON n.user_id = u.id
       WHERE n.event_id = $1
         AND (n.is_private = FALSE OR n.user_id = $2)
       ORDER BY n.created_at DESC`,
      [eventId, userId]
    );
    return rows;
  }

  static async create({ eventId, userId, content, isPrivate }) {
    const { rows } = await pool.query(
      `INSERT INTO event_notes (event_id, user_id, content, is_private)
       VALUES ($1, $2, $3, $4)
       RETURNING id, content, is_private, created_at`,
      [eventId, userId, content, Boolean(isPrivate)]
    );
    return rows[0];
  }

  static async findById(id) {
    const { rows } = await pool.query(
      "SELECT id, user_id FROM event_notes WHERE id = $1",
      [id]
    );
    return rows[0] || null;
  }

  static async delete(id) {
    const { rows } = await pool.query(
      "DELETE FROM event_notes WHERE id = $1 RETURNING id",
      [id]
    );
    return rows.length > 0;
  }

  static async eventExists(eventId) {
    const { rows } = await pool.query(
      "SELECT id FROM events WHERE id = $1",
      [eventId]
    );
    return rows.length > 0;
  }
}

module.exports = EventNoteModel;
