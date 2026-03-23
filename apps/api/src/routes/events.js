const express = require("express");
const router = express.Router();

const EventController = require("../controllers/EventController");
const { roleRequired, authOptional } = require("../middlewares/auth");

// GET    /api/events/meta/types     - Types d'evenements
router.get("/meta/types", EventController.getTypes);

// GET    /api/events/meta/statuses  - Statuts possibles
router.get("/meta/statuses", EventController.getStatuses);

// GET    /api/events                - Evenements publics
router.get("/", authOptional, EventController.listPublic);

// GET    /api/events/admin          - Liste complete (admin/employe)
router.get("/admin", roleRequired(["admin", "employe"]), EventController.listAdmin);

// GET    /api/events/:id            - Detail d'un evenement
router.get("/:id", authOptional, EventController.getById);

// POST   /api/events                - Creer un evenement (admin)
router.post("/", roleRequired("admin"), EventController.create);

// PUT    /api/events/:id            - Modifier un evenement (admin)
router.put("/:id", roleRequired("admin"), EventController.update);

// DELETE /api/events/:id            - Supprimer un evenement (admin)
router.delete("/:id", roleRequired("admin"), EventController.delete);

// POST   /api/events/:id/prestations              - Ajouter une prestation
router.post("/:id/prestations", roleRequired("admin"), EventController.addPrestation);

// DELETE /api/events/:eventId/prestations/:prestationId - Supprimer une prestation
router.delete("/:eventId/prestations/:prestationId", roleRequired("admin"), EventController.deletePrestation);

module.exports = router;
