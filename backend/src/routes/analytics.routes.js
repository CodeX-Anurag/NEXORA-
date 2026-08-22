const express = require("express");
const analyticsController = require("../controllers/analytics.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authenticate);

// GET /api/v1/analytics/dashboard
router.get("/dashboard", analyticsController.getDashboardAnalytics);

// GET /api/v1/analytics/productivity
router.get("/productivity", analyticsController.getProductivityAnalytics);

// GET /api/v1/analytics/career
router.get("/career", analyticsController.getCareerAnalytics);

module.exports = router;
