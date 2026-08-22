const express = require("express");
const dashboardController = require("../controllers/dashboard.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authenticate);

// GET /api/v1/dashboard/overview
router.get("/overview", dashboardController.getOverview);

module.exports = router;
