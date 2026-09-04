const express = require("express");
const router = express.Router();
const {
    createClaim, getClaims, getClaimStats, getClaimById, updateClaim,
    forwardToFRC, submitVerification, submitDecision,
    getClaimHistory, getClaimVerifications, getClaimDecisions,
    getClaimDocuments, addDocument
} = require("../controllers/claimController");
const { protect } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/authorize");

// Stats (must be before /:id)
router.get("/stats", protect, getClaimStats);

// Core CRUD
router.post("/", protect, authorizeRoles("ADMIN", "OFFICER"), createClaim);
router.get("/", protect, getClaims);
router.get("/:id", protect, getClaimById);
router.put("/:id", protect, authorizeRoles("ADMIN", "OFFICER"), updateClaim);

// Workflow actions
router.post("/:id/forward", protect, authorizeRoles("ADMIN", "OFFICER"), forwardToFRC);
router.post("/:id/verification", protect, authorizeRoles("ADMIN", "OFFICER"), submitVerification);
router.post("/:id/decisions", protect, authorizeRoles("ADMIN", "OFFICER"), submitDecision);

// Sub-resources
router.get("/:id/history", protect, getClaimHistory);
router.get("/:id/verifications", protect, getClaimVerifications);
router.get("/:id/decisions", protect, getClaimDecisions);
router.get("/:id/documents", protect, getClaimDocuments);
router.post("/:id/documents", protect, authorizeRoles("ADMIN", "OFFICER"), addDocument);

module.exports = router;
