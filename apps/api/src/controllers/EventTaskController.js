const EventTaskService = require("../services/EventTaskService");

/**
 * EventTaskController - Couche HTTP pour les taches d'evenements.
 */
class EventTaskController {

  static async list(req, res) {
    try {
      const tasks = await EventTaskService.getTasks(req.params.eventId, req.query);
      return res.json({ ok: true, count: tasks.length, tasks });
    } catch (e) {
      if (e.status) return res.status(e.status).json({ ok: false, error: e.message });
      console.error("Erreur GET /events/:eventId/tasks:", e);
      return res.status(500).json({ ok: false, error: "Erreur serveur" });
    }
  }

  static async myTasks(req, res) {
    try {
      const tasks = await EventTaskService.getMyTasks(req.user.id, req.query);
      return res.json({ ok: true, count: tasks.length, tasks });
    } catch (e) {
      console.error("Erreur GET /tasks/my:", e);
      return res.status(500).json({ ok: false, error: "Erreur serveur" });
    }
  }

  static async create(req, res) {
    try {
      const task = await EventTaskService.createTask(req.params.eventId, req.user.id, req.body);
      return res.status(201).json({ ok: true, task });
    } catch (e) {
      if (e.status) return res.status(e.status).json({ ok: false, error: e.message });
      console.error("Erreur POST /events/:eventId/tasks:", e);
      return res.status(500).json({ ok: false, error: "Erreur serveur" });
    }
  }

  static async update(req, res) {
    try {
      const task = await EventTaskService.updateTask(req.params.taskId, req.body);
      return res.json({ ok: true, task });
    } catch (e) {
      if (e.status) return res.status(e.status).json({ ok: false, error: e.message });
      console.error("Erreur PATCH /events/:eventId/tasks/:taskId:", e);
      return res.status(500).json({ ok: false, error: "Erreur serveur" });
    }
  }

  static async delete(req, res) {
    try {
      await EventTaskService.deleteTask(req.params.taskId, req.user);
      return res.json({ ok: true, deleted: true });
    } catch (e) {
      if (e.status) return res.status(e.status).json({ ok: false, error: e.message });
      console.error("Erreur DELETE /events/:eventId/tasks/:taskId:", e);
      return res.status(500).json({ ok: false, error: "Erreur serveur" });
    }
  }
}

module.exports = EventTaskController;
