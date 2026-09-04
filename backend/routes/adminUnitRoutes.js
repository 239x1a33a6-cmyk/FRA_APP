const express = require("express");
const router = express.Router();
const { createUnit, getUnits, getUnitById, updateUnit, deleteUnit } = require("../controllers/adminUnitController");
const { protect } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/authorize");

router.post("/", protect, authorizeRoles("ADMIN"), createUnit);
router.get("/", protect, getUnits);
router.get("/:id", protect, getUnitById);
router.put("/:id", protect, authorizeRoles("ADMIN"), updateUnit);
router.delete("/:id", protect, authorizeRoles("ADMIN"), deleteUnit);

module.exports = router;
