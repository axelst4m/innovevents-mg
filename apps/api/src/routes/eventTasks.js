const express = require("express");
const router = express.Router();

const { pool } = require("../db/postgres");
const { roleRequired } = require("../middlewares/auth");

const PRIORITIES = ["basse", "normale", "haute", "urgente"];
const STATUSES = ["a_faire", "en_cours", "terminee", "annulee"];

// ============================================
// GET /api/events/:eventId/tasks - Liste des taches d'un evenement
// ============================================
router.get("/:eventId/tasks", roleRequired(["admin", "employe"]), async (req, res) => {
  try {
    const eventId = Number(req.params.eventId);
    if (!Number.isInteger(eventId) || eventId <= 0) {
      return res.status(400).json({ ok: false, error: "ID evenement invalide" });
    }

    const { status } = req.query;

    const where = ["t.event_id = $1"];
    const values = [eventId];

    if (status && STATUSES.includes(status)) {
      values.push(status);
      where.push(`t.status = $${values.length}`);
    }

    const { rows } = await pool.query(
      `
      SELECT t.id, t.title, t.description, t.priority, t.status, t.due_date,
             t.completed_at, t.created_at,
             ua.id as assigned_to_id, ua.firstname as assigned_firstname, ua.lastname as assigned_lastname,
             uc.id as created_by_id, uc.firstname as created_firstname, uc.lastname as created_lastname
      FROM event_tasks t
      LEFT JOIN users ua ON t.assigned_to = ua.id
      JOIN users uc ON t.created_by = uc.id
      WHERE ${where.join(" AND ")}
      ORDER BY
        CASE t.priority
          WHEN 'urgente' THEN 1
          WHEN 'haute' THEN 2
          WHEN 'normale' THEN 3
          WHEN 'basse' THEN 4
        END,
        t.due_date ASC NULLS LAST,
        t.created_at DESC
      `,
      values
    );

    return res.json({ ok: true, count: rows.length, tasks: rows });

  } catch (e) {
    console.error("Erreur GET /events/:eventId/tasks:", e);
    return res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
});

// ============================================
// GET /api/tasks/my - Mes taches assignees (tous evenements)
// ============================================
router.get("/my", roleRequired(["admin", "employe"]), async (req, res) => {
  try {
    const { status } = req.query;

    const where = ["t.assigned_to = $1"];
    const values = [req.user.id];

    if (status && STATUSES.includes(status)) {
      values.push(status);
      where.push(`t.status = $${values.length}`);
    } else {
      // Par defaut, ne pas afficher les terminees/annulees
      where.push("t.status NOT IN ('terminee', 'annulee')");
    }

    const { rows } = await pool.query(
      `
      SELECT t.id, t.title, t.description, t.priority, t.status, t.due_date,
             t.completed_at, t.created_at, t.event_id,
             e.name as event_name, e.event_date,
             uc.firstname as created_firstname, uc.lastname as created_lastname
      FROM event_tasks t
      JOIN events e ON t.event_id = e.id
      JOIN users uc ON t.created_by = uc.id
      WHERE ${where.join(" AND ")}
      ORDER BY
        CASE t.priority
          WHEN 'urgente' THEN 1
          WHEN 'haute' THEN 2
          WHEN 'normale' THEN 3
          WHEN 'basse' THEN 4
        END,
        t.due_date ASC NULLS LAST
      `,
      values
    );

    return res.json({ ok: true, count: rows.length, tasks: rows });

  } catch (e) {
    console.error("Erreur GET /tasks/my:", e);
    return res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
});

// ============================================
// POST /api/events/:eventId/tasks - Creer une tache
// ============================================
router.post("/:eventId/tasks", roleRequired(["admin", "employe"]), async (req, res) => {
  try {
    const eventId = Number(req.params.eventId);
    if (!Number.isInteger(eventId) || eventId <= 0) {
      return res.status(400).json({ ok: false, error: "ID evenement invalide" });
    }

    const { title, description, priority, assigned_to, due_date } = req.body || {};

    // Validation
    if (!title || String(title).trim() === "") {
      return res.status(400).json({ ok: false, error: "Titre obligatoire" });
    }

    const priorityValue = priority && PRIORITIES.includes(priority) ? priority : "normale";

    // Verifier que l'evenement existe
    const eventCheck = await pool.query("SELECT id FROM events WHERE id = $1", [eventId]);
    if (!eventCheck.rows.length) {
      return res.status(404).json({ ok: false, error: "Evenement introuvable" });
    }

    // Verifier l'utilisateur assigne si fourni
    let assignedToValue = null;
    if (assigned_to) {
      const userCheck = await pool.query(
        "SELECT id FROM users WHERE id = $1 AND role IN ('admin', 'employe')",
        [Number(assigned_to)]
      );
      if (userCheck.rows.length) {
        assignedToValue = userCheck.rows[0].id;
      }
    }

    const { rows } = await pool.query(
      `
      INSERT INTO event_tasks (event_id, created_by, assigned_to, title, description, priority, due_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, title, description, priority, status, due_date, created_at
      `,
      [
        eventId,
        req.user.id,
        assignedToValue,
        title.trim(),
        description ? description.trim() : null,
        priorityValue,
        due_date || null
      ]
    );

    return res.status(201).json({ ok: true, task: rows[0] });

  } catch (e) {
    console.error("Erreur POST /events/:eventId/tasks:", e);
    return res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
});

// ============================================
// PATCH /api/events/:eventId/tasks/:taskId - Modifier une tache
// ============================================
router.patch("/:eventId/tasks/:taskId", roleRequired(["admin", "employe"]), async (req, res) => {
  try {
    const taskId = Number(req.params.taskId);
    if (!Number.isInteger(taskId) || taskId <= 0) {
      return res.status(400).json({ ok: false, error: "ID tache invalide" });
    }

    const { title, description, priority, status, assigned_to, due_date } = req.body || {};

    const updates = [];
    const values = [];

    if (title !== undefined) {
      values.push(title.trim());
      updates.push(`title = $${values.length}`);
    }

    if (description !== undefined) {
      values.push(description ? description.trim() : null);
      updates.push(`description = $${values.length}`);
    }

    if (priority !== undefined && PRIORITIES.includes(priority)) {
      values.push(priority);
      updates.push(`priority = $${values.length}`);
    }

    if (status !== undefined && STATUSES.includes(status)) {
      values.push(status);
      updates.push(`status = $${values.length}`);

      // Marquer completed_at si terminee
      if (status === "terminee") {
        updates.push("completed_at = NOW()");
      } else {
        updates.push("completed_at = NULL");
      }
    }

    if (assigned_to !== undefined) {
      if (assigned_to === null || assigned_to === "") {
        updates.push("assigned_to = NULL");
      } else {
        const userCheck = await pool.query(
          "SELECT id FROM users WHERE id = $1 AND role IN ('admin', 'employe')",
          [Number(assigned_to)]
        );
        if (userCheck.rows.length) {
          values.push(userCheck.rows[0].id);
          updates.push(`assigned_to = $${values.length}`);
        }
      }
    }

    if (due_date !== undefined) {
      values.push(due_date || null);
      updates.push(`due_date = $${values.length}`);
    }

    if (!updates.length) {
      return res.status(400).json({ ok: false, error: "Aucune modification" });
    }

    values.push(taskId);
    const { rows } = await pool.query(
      `
      UPDATE event_tasks
      SET ${updates.join(", ")}
      WHERE id = $${values.length}
      RETURNING id, title, description, priority, status, due_date, completed_at
      `,
      values
    );

    if (!rows.length) {
      return res.status(404).json({ ok: false, error: "Tache introuvable" });
    }

    return res.json({ ok: true, task: rows[0] });

  } catch (e) {
    console.error("Erreur PATCH /events/:eventId/tasks/:taskId:", e);
    return res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
});

// ============================================
// DELETE /api/events/:eventId/tasks/:taskId - Supprimer une tache
// ============================================
router.delete("/:eventId/tasks/:taskId", roleRequired(["admin", "employe"]), async (req, res) => {
  try {
    const taskId = Number(req.params.taskId);
    if (!Number.isInteger(taskId) || taskId <= 0) {
      return res.status(400).json({ ok: false, error: "ID tache invalide" });
    }

    // Verifier les droits (createur ou admin)
    const taskCheck = await pool.query(
      "SELECT created_by FROM event_tasks WHERE id = $1",
      [taskId]
    );

    if (!taskCheck.rows.length) {
      return res.status(404).json({ ok: false, error: "Tache introuvable" });
    }

    if (taskCheck.rows[0].created_by !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ ok: false, error: "Non autorise" });
    }

    await pool.query("DELETE FROM event_tasks WHERE id = $1", [taskId]);

    return res.json({ ok: true, deleted: true });

  } catch (e) {
    console.error("Erreur DELETE /events/:eventId/tasks/:taskId:", e);
    return res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
});

module.exports = router;
