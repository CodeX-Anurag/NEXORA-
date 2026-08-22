const express = require("express");
const careerController = require("../controllers/career.controller");

const router = express.Router();

// GET /api/v1/careers (public catalog)
router.get("/", careerController.getCareers);

// GET /api/v1/careers/:id (public catalog item)
router.get("/:id", careerController.getCareerById);

module.exports = router;
