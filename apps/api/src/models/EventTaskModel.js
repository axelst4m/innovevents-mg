const { pool } = require("../db/postgres");

/**
 * EventTaskModel - Couche d'acces aux donnees pour les taches d'evenements.
 */
class EventTaskModel {

  static async findByEventId(eventId, statusFilter) {
    const where = ["t.event_id = $1"];
    const values = [eventId];

    if (statusFilter) {
      values.push(statusFilter);
      where.push(`t.status = $${values.length}`);
    }

    const { rows } = await pool.query(
      `SELECT t.id, t.title, t.description, t.priority, t.status, t.due_date,
              t.completed_at, t.created_at,
              ua.id as assigned_to_id, ua.firstname as assigned_firstname, ua.lastname as assigned_lastname,
              uc.id as created_by_id, uc.firstname as created_firstname, uc.lastname as created_lastname
       FROM event_tasks t
       LEFT JOIN users ua ON t.assigned_to = ua.id
       JOIN users uc ON t.created_by = uc.id
       WHERE ${where.join(" AND ")}
       ORDER BY
         CASE t.priority
           WHEN 'urgente' THEN 1
           WHEN 'haute' THEN 2
           WHEN 'normale' THEN 3
           WHEN 'basse' THEN 4
         END,
         t.due_date ASC NULLS LAST,
         t.created_at DESC`,
      values
    );
    return rows;
  }

  static async findMyTasks(userId, statusFilter) {
    const where = ["t.assigned_to = $1"];
    const values = [userId];

    if (statusFilter) {
      values.push(statusFilter);
      where.push(`t.status = $${values.length}`);
    } else {
      where.push("t.status NOT IN ('terminee', 'annulee')");
    }

    const { rows } = await pool.query(
      `SELECT t.id, t.title, t.description, t.priority, t.status, t.due_date,
              t.completed_at, t.created_at, t.event_id,
              e.name as event_name, e.event_date,
              uc.firstname as created_firstname, uc.lastname as created_lastname
       FROM event_tasks t
       JOIN events e ON t.event_id = e.id
       JOIN users uc ON t.created_by = uc.id
       WHERE ${where.join(" AND ")}
       ORDER BY
         CASE t.priority
           WHEN 'urgente' THEN 1
           WHEN 'haute' THEN 2
           WHEN 'normale' THEN 3
           WHEN 'basse' THEN 4
         END,
         t.due_date ASC NULLS LAST`,
      values
    );
    return rows;
  }

  static async create({ eventId, createdBy, assignedTo, title, description, priority, dueDate }) {
    const { rows } = await pool.query(
      `INSERT INTO event_tasks (event_id, created_by, assigned_to, title, description, priority, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, title, description, priority, status, due_date, created_at`,
      [eventId, createdBy, assignedTo, title, description, priority, dueDate]
    );
    return rows[0];
  }

  static async update(id, updates, values) {
    values.push(id);
    const { rows } = await pool.query(
      `UPDATE event_tasks
       SET ${updates.join(", ")}
       WHERE id = $${values.length}
       RETURNING id, title, description, priority, status, due_date, completed_at`,
      values
    );
    return rows[0] || null;
  }

  static async findById(id) {
    const { rows } = await pool.query(
      "SELECT id, created_by FROM event_tasks WHERE id = $1",
      [id]
    );
    return rows[0] || null;
  }

  static async delete(id) {
    const { rows } = await pool.query(
      "DELETE FROM event_tasks WHERE id = $1 RETURNING id",
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

  static async isValidAssignee(userId) {
    const { rows } = await pool.query(
      "SELECT id FROM users WHERE id = $1 AND role IN ('admin', 'employe')",
      [userId]
    );
    return rows.length > 0 ? rows[0].id : null;
  }
}

module.exports = EventTaskModel;
