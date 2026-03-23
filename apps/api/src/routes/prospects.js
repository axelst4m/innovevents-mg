const express = require("express");
const router = express.Router();

const ProspectController = require("../controllers/ProspectController");

// POST   /api/prospects                  - Creer un prospect
router.post("/prospects", ProspectController.create);

// GET    /api/prospects                  - Liste des prospects
router.get("/prospects", ProspectController.list);

// GET    /api/prospects/:id              - Detail d'un prospect
router.get("/prospects/:id", ProspectController.getById);

// PATCH  /api/prospects/:id/status       - Modifier le statut
router.patch("/prospects/:id/status", ProspectController.updateStatus);

// GET    /api/clients                    - Liste des clients
router.get("/clients", ProspectController.listClients);

// POST   /api/prospects/:id/convert      - Convertir en client
router.post("/prospects/:id/convert", ProspectController.convert);

module.exports = router;
