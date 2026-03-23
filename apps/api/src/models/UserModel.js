const { pool } = require("../db/postgres");

/**
 * UserModel - Couche d'acces aux donnees pour les utilisateurs.
 */
class UserModel {

  static async findAll({ role, status } = {}) {
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

    const { rows } = await pool.query(
      `SELECT id, email, firstname, lastname, role, is_active, must_change_password, created_at, updated_at
       FROM users
       ${whereSql}
       ORDER BY created_at DESC`,
      values
    );
    return rows;
  }

  static async findById(id) {
    const { rows } = await pool.query(
      `SELECT u.id, u.email, u.firstname, u.lastname, u.role, u.is_active,
              u.must_change_password, u.created_at, u.updated_at,
              c.id as client_id, c.company_name
       FROM users u
       LEFT JOIN clients c ON c.user_id = u.id
       WHERE u.id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  static async findByEmail(email) {
    const { rows } = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );
    return rows[0] || null;
  }

  static async create({ email, passwordHash, firstname, lastname, role }) {
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, firstname, lastname, role, must_change_password)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING id, email, firstname, lastname, role, is_active, created_at`,
      [email, passwordHash, firstname, lastname, role]
    );
    return rows[0];
  }

  static async update(id, updates, values) {
    updates.push("updated_at = NOW()");
    values.push(id);

    const { rows } = await pool.query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${values.length}
       RETURNING id, email, firstname, lastname, role, is_active, updated_at`,
      values
    );
    return rows[0] || null;
  }

  static async findWithStatus(id) {
    const { rows } = await pool.query(
      "SELECT id, email, is_active FROM users WHERE id = $1",
      [id]
    );
    return rows[0] || null;
  }

  static async toggleActive(id, newStatus) {
    await pool.query(
      "UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2",
      [newStatus, id]
    );
  }

  static async resetPassword(id, passwordHash) {
    await pool.query(
      `UPDATE users SET password_hash = $1, must_change_password = TRUE, updated_at = NOW()
       WHERE id = $2`,
      [passwordHash, id]
    );
  }

  static async getStats() {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE role = 'admin') as admins,
        COUNT(*) FILTER (WHERE role = 'employe') as employes,
        COUNT(*) FILTER (WHERE role = 'client') as clients,
        COUNT(*) FILTER (WHERE is_active = TRUE) as actifs,
        COUNT(*) FILTER (WHERE is_active = FALSE) as inactifs,
        COUNT(*) as total
      FROM users
    `);
    return rows[0];
  }
}

module.exports = UserModel;
