const express = require("express");
const router = express.Router();

const ContactController = require("../controllers/ContactController");
const { roleRequired, authOptional } = require("../middlewares/auth");

// POST   /api/contact      - Envoyer un message (public, auth optionnelle)
router.post("/", authOptional, ContactController.send);

// GET    /api/contact       - Liste des messages (admin)
router.get("/", roleRequired("admin"), ContactController.list);

// GET    /api/contact/:id   - Detail d'un message (admin)
router.get("/:id", roleRequired("admin"), ContactController.getById);

// PATCH  /api/contact/:id   - Marquer lu/archive (admin)
router.patch("/:id", roleRequired("admin"), ContactController.update);

// DELETE /api/contact/:id   - Supprimer un message (admin)
router.delete("/:id", roleRequired("admin"), ContactController.delete);

module.exports = router;
