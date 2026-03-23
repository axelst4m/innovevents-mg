const express = require("express");
const router = express.Router();

const EventTaskController = require("../controllers/EventTaskController");
const { roleRequired } = require("../middlewares/auth");

// GET    /api/events/:eventId/tasks           - Liste des taches d'un evenement
router.get("/:eventId/tasks", roleRequired(["admin", "employe"]), EventTaskController.list);

// GET    /api/tasks/my                        - Mes taches assignees
router.get("/my", roleRequired(["admin", "employe"]), EventTaskController.myTasks);

// POST   /api/events/:eventId/tasks           - Creer une tache
router.post("/:eventId/tasks", roleRequired(["admin", "employe"]), EventTaskController.create);

// PATCH  /api/events/:eventId/tasks/:taskId   - Modifier une tache
router.patch("/:eventId/tasks/:taskId", roleRequired(["admin", "employe"]), EventTaskController.update);

// DELETE /api/events/:eventId/tasks/:taskId   - Supprimer une tache
router.delete("/:eventId/tasks/:taskId", roleRequired(["admin", "employe"]), EventTaskController.delete);

module.exports = router;
