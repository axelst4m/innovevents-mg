const AuthService = require("../services/AuthService");

/**
 * AuthController - Couche HTTP pour l'authentification.
 */
class AuthController {

  static async register(req, res) {
    try {
      const { user, linkedClient } = await AuthService.register(req.body);

      return res.status(201).json({
        message: linkedClient
          ? `Compte cree avec succes. Votre espace client (${linkedClient.company_name}) a ete lie a votre compte.`
          : "Compte cree avec succes",
        user: {
          id: user.id, email: user.email,
          firstname: user.firstname, lastname: user.lastname,
          role: user.role
        },
        linkedClient: linkedClient ? { id: linkedClient.id, company_name: linkedClient.company_name } : null
      });
    } catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message });
      console.error("Erreur register:", e);
      return res.status(500).json({ error: "Erreur serveur lors de l'inscription" });
    }
  }

  static async login(req, res) {
    try {
      const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
      const result = await AuthService.login(req.body, clientIp);

      return res.json({
        message: "Connexion reussie",
        token: result.token,
        user: result.user
      });
    } catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message });
      console.error("Erreur login:", e);
      return res.status(500).json({ error: "Erreur serveur lors de la connexion" });
    }
  }

  static async forgotPassword(req, res) {
    try {
      const result = await AuthService.forgotPassword(req.body?.email);
      return res.json(result);
    } catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message });
      console.error("Erreur forgot-password:", e);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  static async changePassword(req, res) {
    try {
      const decoded = AuthService.verifyToken(req.headers.authorization);
      const result = await AuthService.changePassword(decoded.userId, req.body);
      return res.json(result);
    } catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message });
      console.error("Erreur change-password:", e);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  static async me(req, res) {
    try {
      const decoded = AuthService.verifyToken(req.headers.authorization);
      const user = await AuthService.getProfile(decoded.userId);
      return res.json({ user });
    } catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message });
      console.error("Erreur /me:", e);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  static async listUsers(req, res) {
    try {
      const decoded = AuthService.verifyToken(req.headers.authorization);

      if (decoded.role !== "admin" && decoded.role !== "employe") {
        return res.status(403).json({ error: "Acces refuse" });
      }

      const users = await AuthService.listUsers(req.query);
      return res.json({ users });
    } catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message });
      console.error("Erreur /users:", e);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  static async deleteAccount(req, res) {
    try {
      const decoded = AuthService.verifyToken(req.headers.authorization);
      await AuthService.deleteAccount(decoded.userId, req.body?.password);
      return res.json({ ok: true, message: "Compte supprime et anonymise avec succes" });
    } catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message });
      console.error("Erreur delete account:", e);
      return res.status(500).json({ error: "Erreur serveur lors de la suppression" });
    }
  }
}

module.exports = AuthController;
