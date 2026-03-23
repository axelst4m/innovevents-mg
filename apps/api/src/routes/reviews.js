const express = require("express");
const router = express.Router();

const ReviewController = require("../controllers/ReviewController");
const { roleRequired, authOptional } = require("../middlewares/auth");

// GET    /api/reviews          - Avis publics valides
router.get("/", ReviewController.listPublic);

// GET    /api/reviews/pending  - Avis en attente (admin/employe)
router.get("/pending", roleRequired(["admin", "employe"]), ReviewController.listPending);

// GET    /api/reviews/all      - Liste complete (admin/employe)
router.get("/all", roleRequired(["admin", "employe"]), ReviewController.listAll);

// POST   /api/reviews          - Soumettre un avis (auth optionnelle)
router.post("/", authOptional, ReviewController.submit);

// PATCH  /api/reviews/:id/validate  - Valider un avis
router.patch("/:id/validate", roleRequired(["admin", "employe"]), ReviewController.validate);

// PATCH  /api/reviews/:id/reject    - Refuser un avis
router.patch("/:id/reject", roleRequired(["admin", "employe"]), ReviewController.reject);

// PATCH  /api/reviews/:id/featured  - Toggle featured (admin)
router.patch("/:id/featured", roleRequired("admin"), ReviewController.toggleFeatured);

// DELETE /api/reviews/:id           - Supprimer un avis (admin)
router.delete("/:id", roleRequired("admin"), ReviewController.delete);

module.exports = router;
