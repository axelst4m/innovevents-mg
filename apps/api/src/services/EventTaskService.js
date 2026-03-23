const EventTaskModel = require("../models/EventTaskModel");

const PRIORITIES = ["basse", "normale", "haute", "urgente"];
const STATUSES = ["a_faire", "en_cours", "terminee", "annulee"];

/**
 * EventTaskService - Logique metier pour les taches d'evenements.
 */
class EventTaskService {

  static _parseId(id, label = "ID") {
    const parsed = Number(id);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      const error = new Error(`${label} invalide`);
      error.status = 400;
      throw error;
    }
    return parsed;
  }

  static async getTasks(eventId, query = {}) {
    const parsedEventId = this._parseId(eventId, "ID evenement");
    const { status } = query;
    const statusFilter = status && STATUSES.includes(status) ? status : null;
    return EventTaskModel.findByEventId(parsedEventId, statusFilter);
  }

  static async getMyTasks(userId, query = {}) {
    const { status } = query;
    const statusFilter = status && STATUSES.includes(status) ? status : null;
    return EventTaskModel.findMyTasks(userId, statusFilter);
  }

  static async createTask(eventId, userId, data) {
    const parsedEventId = this._parseId(eventId, "ID evenement");

    const { title, description, priority, assigned_to, due_date } = data || {};

    if (!title || String(title).trim() === "") {
      const error = new Error("Titre obligatoire");
      error.status = 400;
      throw error;
    }

    const priorityValue = priority && PRIORITIES.includes(priority) ? priority : "normale";

    const exists = await EventTaskModel.eventExists(parsedEventId);
    if (!exists) {
      const error = new Error("Evenement introuvable");
      error.status = 404;
      throw error;
    }

    let assignedToValue = null;
    if (assigned_to) {
      assignedToValue = await EventTaskModel.isValidAssignee(Number(assigned_to));
    }

    return EventTaskModel.create({
      eventId: parsedEventId,
      createdBy: userId,
      assignedTo: assignedToValue,
      title: title.trim(),
      description: description ? description.trim() : null,
      priority: priorityValue,
      dueDate: due_date || null
    });
  }

  static async updateTask(taskId, data) {
    const parsedTaskId = this._parseId(taskId, "ID tache");

    const { title, description, priority, status, assigned_to, due_date } = data || {};

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
        const validId = await EventTaskModel.isValidAssignee(Number(assigned_to));
        if (validId) {
          values.push(validId);
          updates.push(`assigned_to = $${values.length}`);
        }
      }
    }

    if (due_date !== undefined) {
      values.push(due_date || null);
      updates.push(`due_date = $${values.length}`);
    }

    if (!updates.length) {
      const error = new Error("Aucune modification");
      error.status = 400;
      throw error;
    }

    const updated = await EventTaskModel.update(parsedTaskId, updates, values);
    if (!updated) {
      const error = new Error("Tache introuvable");
      error.status = 404;
      throw error;
    }

    return updated;
  }

  static async deleteTask(taskId, user) {
    const parsedTaskId = this._parseId(taskId, "ID tache");

    const task = await EventTaskModel.findById(parsedTaskId);
    if (!task) {
      const error = new Error("Tache introuvable");
      error.status = 404;
      throw error;
    }

    if (task.created_by !== user.id && user.role !== "admin") {
      const error = new Error("Non autorise");
      error.status = 403;
      throw error;
    }

    await EventTaskModel.delete(parsedTaskId);
    return true;
  }
}

module.exports = EventTaskService;
