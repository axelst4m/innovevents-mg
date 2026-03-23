const ReviewService = require("../services/ReviewService");

/**
 * ReviewController - Couche HTTP pour les avis clients.
 */
class ReviewController {

  static async listPublic(req, res) {
    try {
      const { reviews, stats } = await ReviewService.getPublicReviews(req.query);
      return res.json({ ok: true, count: reviews.length, stats, reviews });
    } catch (e) {
      console.error("Erreur GET /reviews:", e);
      return res.status(500).json({ ok: false, error: "Erreur serveur" });
    }
  }

  static async listPending(req, res) {
    try {
      const reviews = await ReviewService.getPendingReviews();
      return res.json({ ok: true, count: reviews.length, reviews });
    } catch (e) {
      console.error("Erreur GET /reviews/pending:", e);
      return res.status(500).json({ ok: false, error: "Erreur serveur" });
    }
  }

  static async listAll(req, res) {
    try {
      const reviews = await ReviewService.getAllReviews(req.query);
      return res.json({ ok: true, count: reviews.length, reviews });
    } catch (e) {
      console.error("Erreur GET /reviews/all:", e);
      return res.status(500).json({ ok: false, error: "Erreur serveur" });
    }
  }

  static async submit(req, res) {
    try {
      const userId = req.user?.id || null;
      const created = await ReviewService.submitReview(req.body, userId);
      return res.status(201).json({
        ok: true,
        message: "Merci pour votre avis ! Il sera publie apres validation par notre equipe.",
        review: { id: created.id, created_at: created.created_at }
      });
    } catch (e) {
      if (e.status === 400 && e.errors) {
        return res.status(400).json({ ok: false, errors: e.errors });
      }
      if (e.status) return res.status(e.status).json({ ok: false, error: e.message });
      console.error("Erreur POST /reviews:", e);
      return res.status(500).json({ ok: false, error: "Erreur serveur" });
    }
  }

  static async validate(req, res) {
    try {
      const review = await ReviewService.validateReview(req.params.id, req.user.id, req.body);
      return res.json({ ok: true, review });
    } catch (e) {
      if (e.status) return res.status(e.status).json({ ok: false, error: e.message });
      console.error("Erreur PATCH /reviews/:id/validate:", e);
      return res.status(500).json({ ok: false, error: "Erreur serveur" });
    }
  }

  static async reject(req, res) {
    try {
      const review = await ReviewService.rejectReview(req.params.id, req.user.id, req.body);
      return res.json({ ok: true, review });
    } catch (e) {
      if (e.status) return res.status(e.status).json({ ok: false, error: e.message });
      console.error("Erreur PATCH /reviews/:id/reject:", e);
      return res.status(500).json({ ok: false, error: "Erreur serveur" });
    }
  }

  static async toggleFeatured(req, res) {
    try {
      const review = await ReviewService.toggleFeatured(req.params.id, req.body);
      return res.json({ ok: true, review });
    } catch (e) {
      if (e.status) return res.status(e.status).json({ ok: false, error: e.message });
      console.error("Erreur PATCH /reviews/:id/featured:", e);
      return res.status(500).json({ ok: false, error: "Erreur serveur" });
    }
  }

  static async delete(req, res) {
    try {
      await ReviewService.deleteReview(req.params.id);
      return res.json({ ok: true, deleted: true });
    } catch (e) {
      if (e.status) return res.status(e.status).json({ ok: false, error: e.message });
      console.error("Erreur DELETE /reviews/:id:", e);
      return res.status(500).json({ ok: false, error: "Erreur serveur" });
    }
  }
}

module.exports = ReviewController;
