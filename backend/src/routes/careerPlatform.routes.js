const express = require("express");
const careerPlatformController = require("../controllers/careerPlatform.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authenticate);

// List platforms status
router.get("/", careerPlatformController.getPlatforms);

// Connect and sync
router.post("/:platform/connect", careerPlatformController.connectPlatform);
router.post("/:platform/refresh", careerPlatformController.refreshPlatform);
router.delete("/:platform", careerPlatformController.disconnectPlatform);

// Update selected resume items (e.g. GitHub repos)
router.put("/:platform/selected", careerPlatformController.updateSelectedItems);

// Sync actions
router.post("/sync/projects", careerPlatformController.syncToNexoraProjects);
router.post("/sync/resume", careerPlatformController.syncToResumeProfile);

module.exports = router;
