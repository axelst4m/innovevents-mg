const express = require("express");
const router = express.Router();

const DashboardController = require("../controllers/DashboardController");
const { roleRequired } = require("../middlewares/auth");

// GET /api/dashboard/stats - Statistiques globales (admin)
router.get("/stats", roleRequired("admin"), DashboardController.getStats);

module.exports = router;
