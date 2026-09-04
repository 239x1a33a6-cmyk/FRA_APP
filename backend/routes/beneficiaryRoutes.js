const express = require("express");
const router = express.Router();
const { createBeneficiary, getBeneficiaries, getBeneficiaryById, updateBeneficiary, deleteBeneficiary } = require("../controllers/beneficiaryController");
const { protect } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/authorize");

router.post("/", protect, authorizeRoles("ADMIN", "OFFICER"), createBeneficiary);
router.get("/", protect, getBeneficiaries);
router.get("/:id", protect, getBeneficiaryById);
router.put("/:id", protect, authorizeRoles("ADMIN", "OFFICER"), updateBeneficiary);
router.delete("/:id", protect, authorizeRoles("ADMIN"), deleteBeneficiary);

module.exports = router;
