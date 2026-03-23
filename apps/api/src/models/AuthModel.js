const { pool } = require("../db/postgres");

/**
 * AuthModel - Couche d'acces aux donnees pour l'authentification.
 */
class AuthModel {

  static async findByEmail(email) {
    const { rows } = await pool.query(
      `SELECT id, email, password_hash, firstname, lastname, role, is_active, must_change_password
       FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );
    return rows[0] || null;
  }

  static async emailExists(email) {
    const { rows } = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase()]
    );
    return rows.length > 0;
  }

  static async createUser({ email, passwordHash, firstname, lastname, role = "client" }) {
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, firstname, lastname, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, firstname, lastname, role, created_at`,
      [email.toLowerCase(), passwordHash, firstname, lastname, role]
    );
    return rows[0];
  }

  static async findClientByEmail(email) {
    const { rows } = await pool.query(
      "SELECT id, company_name FROM clients WHERE email = $1 AND user_id IS NULL",
      [email.toLowerCase()]
    );
    return rows[0] || null;
  }

  static async linkClientToUser(userId, clientId) {
    await pool.query(
      "UPDATE clients SET user_id = $1 WHERE id = $2",
      [userId, clientId]
    );
  }

  static async findActiveByEmail(email) {
    const { rows } = await pool.query(
      "SELECT id, email, firstname FROM users WHERE email = $1 AND is_active = TRUE",
      [email.toLowerCase()]
    );
    return rows[0] || null;
  }

  static async updatePassword(userId, passwordHash, mustChange = false) {
    await pool.query(
      `UPDATE users
       SET password_hash = $1, must_change_password = $2, updated_at = NOW()
       WHERE id = $3`,
      [passwordHash, mustChange, userId]
    );
  }

  static async findById(userId) {
    const { rows } = await pool.query(
      `SELECT id, email, firstname, lastname, role, is_active, must_change_password, created_at
       FROM users WHERE id = $1`,
      [userId]
    );
    return rows[0] || null;
  }

  static async findPasswordHash(userId) {
    const { rows } = await pool.query(
      "SELECT id, password_hash FROM users WHERE id = $1",
      [userId]
    );
    return rows[0] || null;
  }

  static async findActiveUsers({ role } = {}) {
    const where = ["is_active = TRUE"];
    const values = [];

    if (role) {
      if (role === "employe") {
        where.push("role IN ('admin', 'employe')");
      } else {
        values.push(role);
        where.push(`role = $${values.length}`);
      }
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const { rows } = await pool.query(
      `SELECT id, email, firstname, lastname, role, created_at
       FROM users
       ${whereSql}
       ORDER BY firstname, lastname`,
      values
    );
    return rows;
  }

  static async anonymizeUser(userId) {
    const anonymizedEmail = `deleted_${userId}@anonymized.com`;
    await pool.query(
      `UPDATE users
       SET email = $1, firstname = $2, lastname = $2, is_active = FALSE, updated_at = NOW()
       WHERE id = $3`,
      [anonymizedEmail, "Utilisateur supprime", userId]
    );
    return anonymizedEmail;
  }

  static async findClientsByUserId(userId) {
    const { rows } = await pool.query(
      "SELECT id FROM clients WHERE user_id = $1",
      [userId]
    );
    return rows;
  }

  static async anonymizeClient(clientId, anonymizedEmail) {
    await pool.query(
      `UPDATE clients
       SET company_name = $1, contact_name = $2, email = $3, phone = $4, updated_at = NOW()
       WHERE id = $5`,
      ["Entreprise supprimee", "Utilisateur supprime", anonymizedEmail, null, clientId]
    );
  }

  static async anonymizeClientDevis(clientId) {
    await pool.query(
      `UPDATE devis
       SET client_name = $1, event_contact_name = $2, updated_at = NOW()
       WHERE client_id = $3`,
      ["Entreprise supprimee", "Utilisateur supprime", clientId]
    );
  }

  static async anonymizeClientReviews(clientId) {
    await pool.query(
      `UPDATE reviews
       SET author_name = $1, updated_at = NOW()
       WHERE devis_id IN (SELECT id FROM devis WHERE client_id = $2)`,
      ["Utilisateur supprime", clientId]
    );
  }
}

module.exports = AuthModel;
