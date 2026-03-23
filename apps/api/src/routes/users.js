const express = require("express");
const router = express.Router();

const UserController = require("../controllers/UserController");
const { roleRequired } = require("../middlewares/auth");

// GET    /api/users               - Liste des utilisateurs (admin)
router.get("/", roleRequired("admin"), UserController.list);

// GET    /api/users/stats/count   - Stats utilisateurs (admin)
router.get("/stats/count", roleRequired("admin"), UserController.stats);

// GET    /api/users/:id           - Detail d'un utilisateur (admin)
router.get("/:id", roleRequired("admin"), UserController.getById);

// POST   /api/users               - Creer un utilisateur (admin)
router.post("/", roleRequired("admin"), UserController.create);

// PUT    /api/users/:id           - Modifier un utilisateur (admin)
router.put("/:id", roleRequired("admin"), UserController.update);

// PATCH  /api/users/:id/toggle-status - Activer/Desactiver (admin)
router.patch("/:id/toggle-status", roleRequired("admin"), UserController.toggleStatus);

// POST   /api/users/:id/reset-password - Reset mot de passe (admin)
router.post("/:id/reset-password", roleRequired("admin"), UserController.resetPassword);

module.exports = router;
