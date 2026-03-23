const express = require("express");
const router = express.Router();

const EventNoteController = require("../controllers/EventNoteController");
const { roleRequired } = require("../middlewares/auth");

// GET    /api/events/:eventId/notes           - Liste des notes d'un evenement
router.get("/:eventId/notes", roleRequired(["admin", "employe"]), EventNoteController.list);

// POST   /api/events/:eventId/notes           - Ajouter une note
router.post("/:eventId/notes", roleRequired(["admin", "employe"]), EventNoteController.create);

// DELETE /api/events/:eventId/notes/:noteId   - Supprimer une note
router.delete("/:eventId/notes/:noteId", roleRequired(["admin", "employe"]), EventNoteController.delete);

module.exports = router;
