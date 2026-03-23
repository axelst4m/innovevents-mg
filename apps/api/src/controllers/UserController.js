const UserService = require("../services/UserService");

/**
 * UserController - Couche HTTP pour la gestion des utilisateurs (admin).
 */
class UserController {

  static async list(req, res) {
    try {
      const users = await UserService.listUsers(req.query);
      return res.json({ users });
    } catch (e) {
      console.error("Erreur GET /users:", e);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  static async getById(req, res) {
    try {
      const user = await UserService.getUserById(req.params.id);
      return res.json({ user });
    } catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message });
      console.error("Erreur GET /users/:id:", e);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  static async create(req, res) {
    try {
      const { user, tempPassword } = await UserService.createUser(req.body, req.user.id);
      return res.status(201).json({
        message: "Utilisateur cree avec succes",
        user,
        tempPassword
      });
    } catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message });
      console.error("Erreur POST /users:", e);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  static async update(req, res) {
    try {
      const user = await UserService.updateUser(req.params.id, req.body, req.user.id);
      return res.json({ message: "Utilisateur modifie", user });
    } catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message });
      console.error("Erreur PUT /users/:id:", e);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  static async toggleStatus(req, res) {
    try {
      const result = await UserService.toggleStatus(req.params.id, req.user.id);
      return res.json(result);
    } catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message });
      console.error("Erreur PATCH /users/:id/toggle-status:", e);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  static async resetPassword(req, res) {
    try {
      const { tempPassword } = await UserService.resetPassword(req.params.id, req.user.id);
      return res.json({ message: "Mot de passe reinitialise", tempPassword });
    } catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message });
      console.error("Erreur POST /users/:id/reset-password:", e);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  static async stats(req, res) {
    try {
      const stats = await UserService.getStats();
      return res.json({ stats });
    } catch (e) {
      console.error("Erreur GET /users/stats/count:", e);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }
}

module.exports = UserController;
