const express = require("express");
const router = express.Router();
const { getAuditLogs } = require("../controllers/auditLogController");
const { protect } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/authorize");

router.get("/", protect, authorizeRoles("ADMIN"), getAuditLogs);

module.exports = router;
