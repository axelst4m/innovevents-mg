const bcrypt = require("bcryptjs");
const UserModel = require("../models/UserModel");
const { logAction } = require("../utils/logger");
const { validateEmail } = require("../utils/validators");
const { generateTempPassword } = require("../utils/password");

/**
 * UserService - Logique metier pour la gestion des utilisateurs (admin).
 */
class UserService {

  static async listUsers(query = {}) {
    return UserModel.findAll(query);
  }

  static async getUserById(id) {
    const user = await UserModel.findById(id);
    if (!user) {
      const error = new Error("Utilisateur non trouve");
      error.status = 404;
      throw error;
    }
    return user;
  }

  static async createUser(data, adminId) {
    const { email, firstname, lastname, role } = data;

    if (!email || !firstname || !lastname || !role) {
      const error = new Error("Champs requis: email, firstname, lastname, role");
      error.status = 400;
      throw error;
    }

    if (!validateEmail(email)) {
      const error = new Error("Format d'email invalide");
      error.status = 400;
      throw error;
    }

    if (!["admin", "employe", "client"].includes(role)) {
      const error = new Error("Role invalide (admin, employe, client)");
      error.status = 400;
      throw error;
    }

    const existing = await UserModel.findByEmail(email.toLowerCase());
    if (existing) {
      const error = new Error("Cet email est deja utilise");
      error.status = 409;
      throw error;
    }

    const tempPassword = generateTempPassword();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    const user = await UserModel.create({
      email: email.toLowerCase(),
      passwordHash,
      firstname,
      lastname,
      role
    });

    await logAction({
      type_action: "CREATION_UTILISATEUR_ADMIN",
      userId: adminId,
      details: { created_user_id: user.id, email: user.email, role: user.role }
    });

    console.log(`[DEV] Mot de passe temporaire pour ${user.email}: ${tempPassword}`);

    return { user, tempPassword };
  }

  static async updateUser(id, data, adminId) {
    const { firstname, lastname, role } = data;

    const existing = await UserModel.findById(id);
    if (!existing) {
      const error = new Error("Utilisateur non trouve");
      error.status = 404;
      throw error;
    }

    if (parseInt(id) === adminId && role && role !== existing.role) {
      const error = new Error("Vous ne pouvez pas modifier votre propre role");
      error.status = 403;
      throw error;
    }

    const updates = [];
    const values = [];

    if (firstname) {
      values.push(firstname);
      updates.push(`firstname = $${values.length}`);
    }
    if (lastname) {
      values.push(lastname);
      updates.push(`lastname = $${values.length}`);
    }
    if (role && ["admin", "employe", "client"].includes(role)) {
      values.push(role);
      updates.push(`role = $${values.length}`);
    }

    if (updates.length === 0) {
      const error = new Error("Aucune donnee a modifier");
      error.status = 400;
      throw error;
    }

    const updated = await UserModel.update(id, updates, values);

    await logAction({
      type_action: "MODIFICATION_UTILISATEUR",
      userId: adminId,
      details: { modified_user_id: parseInt(id), changes: { firstname, lastname, role } }
    });

    return updated;
  }

  static async toggleStatus(id, adminId) {
    if (parseInt(id) === adminId) {
      const error = new Error("Vous ne pouvez pas desactiver votre propre compte");
      error.status = 403;
      throw error;
    }

    const existing = await UserModel.findWithStatus(id);
    if (!existing) {
      const error = new Error("Utilisateur non trouve");
      error.status = 404;
      throw error;
    }

    const newStatus = !existing.is_active;
    await UserModel.toggleActive(id, newStatus);

    await logAction({
      type_action: newStatus ? "REACTIVATION_COMPTE" : "DESACTIVATION_COMPTE",
      userId: adminId,
      details: { target_user_id: parseInt(id), email: existing.email }
    });

    return { message: newStatus ? "Compte reactive" : "Compte desactive", is_active: newStatus };
  }

  static async resetPassword(id, adminId) {
    const existing = await UserModel.findWithStatus(id);
    if (!existing) {
      const error = new Error("Utilisateur non trouve");
      error.status = 404;
      throw error;
    }

    const tempPassword = generateTempPassword();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    await UserModel.resetPassword(id, passwordHash);

    await logAction({
      type_action: "RESET_PASSWORD_ADMIN",
      userId: adminId,
      details: { target_user_id: parseInt(id), email: existing.email }
    });

    console.log(`[DEV] Nouveau mot de passe pour ${existing.email}: ${tempPassword}`);

    return { tempPassword };
  }

  static async getStats() {
    return UserModel.getStats();
  }
}

module.exports = UserService;
