const express = require("express");
const router = express.Router();
const { createAuthority, getAuthorities, getAuthorityById, updateAuthority, deleteAuthority } = require("../controllers/authorityController");
const { protect } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/authorize");

router.post("/", protect, authorizeRoles("ADMIN"), createAuthority);
router.get("/", protect, getAuthorities);
router.get("/:id", protect, getAuthorityById);
router.put("/:id", protect, authorizeRoles("ADMIN"), updateAuthority);
router.delete("/:id", protect, authorizeRoles("ADMIN"), deleteAuthority);

module.exports = router;
