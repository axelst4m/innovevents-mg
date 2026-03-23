const express = require("express");
const router = express.Router();

const AuthController = require("../controllers/AuthController");

// Recuperer le limiteur d'authentification depuis app.js
let authLimiter;
try {
  const app = require("../app");
  authLimiter = app.authLimiter;
} catch (err) {
  // require a echoue (dependance circulaire au demarrage)
}
if (typeof authLimiter !== "function") {
  authLimiter = (req, res, next) => next();
}

// POST   /api/auth/register          - Inscription
router.post("/register", AuthController.register);

// POST   /api/auth/login             - Connexion
router.post("/login", authLimiter, AuthController.login);

// POST   /api/auth/forgot-password   - Mot de passe oublie
router.post("/forgot-password", authLimiter, AuthController.forgotPassword);

// POST   /api/auth/change-password   - Changer son mot de passe
router.post("/change-password", AuthController.changePassword);

// GET    /api/auth/me                - Recuperer son profil
router.get("/me", AuthController.me);

// GET    /api/auth/users             - Liste des utilisateurs (admin/employe)
router.get("/users", AuthController.listUsers);

// DELETE /api/auth/account           - Suppression de compte (RGPD)
router.delete("/account", AuthController.deleteAccount);

module.exports = router;
