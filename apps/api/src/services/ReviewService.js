const ReviewModel = require("../models/ReviewModel");
const { logAction } = require("../utils/logger");

/**
 * ReviewService - Logique metier pour les avis clients.
 */
class ReviewService {

  static _parseId(id) {
    const parsed = Number(id);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      const error = new Error("ID invalide");
      error.status = 400;
      throw error;
    }
    return parsed;
  }

  static async getPublicReviews(query = {}) {
    const { limit, rating, event_id, featured } = query;

    let limitInt = Number(limit || 20);
    if (!Number.isInteger(limitInt) || limitInt <= 0) limitInt = 20;
    if (limitInt > 100) limitInt = 100;

    const ratingInt = rating ? Number(rating) : null;
    const validRating = ratingInt && ratingInt >= 1 && ratingInt <= 5 ? ratingInt : null;

    const reviews = await ReviewModel.findPublic({
      rating: validRating,
      eventId: event_id,
      featured: featured === "true",
      limit: limitInt
    });

    const stats = await ReviewModel.getStats();

    return { reviews, stats };
  }

  static async getPendingReviews() {
    return ReviewModel.findPending();
  }

  static async getAllReviews(query = {}) {
    const { status, limit } = query;
    let limitInt = Number(limit || 50);
    if (limitInt > 200) limitInt = 200;
    return ReviewModel.findAll({ status, limit: limitInt });
  }

  static async submitReview(data, userId = null) {
    const { author_name, author_company, rating, title, content, event_id } = data || {};

    const errors = [];

    if (!author_name || String(author_name).trim() === "") {
      errors.push({ field: "author_name", message: "Nom obligatoire" });
    }

    const ratingInt = Number(rating);
    if (!Number.isInteger(ratingInt) || ratingInt < 1 || ratingInt > 5) {
      errors.push({ field: "rating", message: "Note entre 1 et 5 obligatoire" });
    }

    if (!title || String(title).trim() === "") {
      errors.push({ field: "title", message: "Titre obligatoire" });
    }

    if (!content || String(content).trim() === "") {
      errors.push({ field: "content", message: "Commentaire obligatoire" });
    }

    if (errors.length) {
      const error = new Error("Validation echouee");
      error.status = 400;
      error.errors = errors;
      throw error;
    }

    // Client connecte ?
    let clientId = null;
    if (userId) {
      const client = await ReviewModel.findClientByUserId(userId);
      if (client) clientId = client.id;
    }

    // Verifier l'evenement si fourni
    let eventIdValue = null;
    if (event_id) {
      const exists = await ReviewModel.eventExists(Number(event_id));
      if (exists) eventIdValue = Number(event_id);
    }

    const created = await ReviewModel.create({
      clientId,
      eventId: eventIdValue,
      authorName: author_name.trim(),
      authorCompany: author_company ? author_company.trim() : null,
      rating: ratingInt,
      title: title.trim(),
      content: content.trim()
    });

    await logAction({
      type_action: "REVIEW_SUBMITTED",
      userId,
      details: { review_id: created.id, author_name: author_name.trim(), rating: ratingInt }
    });

    return created;
  }

  static async validateReview(id, userId, data = {}) {
    const parsedId = this._parseId(id);
    const { is_featured } = data;

    const updated = await ReviewModel.validate(parsedId, userId, is_featured);
    if (!updated) {
      const error = new Error("Avis introuvable");
      error.status = 404;
      throw error;
    }

    await logAction({ type_action: "REVIEW_VALIDATED", userId, details: { review_id: parsedId } });
    return updated;
  }

  static async rejectReview(id, userId, data = {}) {
    const parsedId = this._parseId(id);
    const { reason } = data;

    const updated = await ReviewModel.reject(parsedId, userId, reason ? reason.trim() : null);
    if (!updated) {
      const error = new Error("Avis introuvable");
      error.status = 404;
      throw error;
    }

    await logAction({ type_action: "REVIEW_REJECTED", userId, details: { review_id: parsedId, reason } });
    return updated;
  }

  static async toggleFeatured(id, data = {}) {
    const parsedId = this._parseId(id);
    const { is_featured } = data;

    const updated = await ReviewModel.toggleFeatured(parsedId, is_featured);
    if (!updated) {
      const error = new Error("Avis introuvable ou non valide");
      error.status = 404;
      throw error;
    }

    return updated;
  }

  static async deleteReview(id) {
    const parsedId = this._parseId(id);

    const deleted = await ReviewModel.delete(parsedId);
    if (!deleted) {
      const error = new Error("Avis introuvable");
      error.status = 404;
      throw error;
    }

    return true;
  }
}

module.exports = ReviewService;
