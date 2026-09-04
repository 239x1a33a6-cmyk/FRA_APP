const express = require("express");
const router = express.Router();
const { getUsers, getUserById, updateUser, deleteUser, updateProfile, approveUser } = require("../controllers/userController");
const { protect } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/authorize");

router.get("/", protect, authorizeRoles("ADMIN"), getUsers);
router.put("/profile", protect, updateProfile);           // must be before /:id
router.get("/:id", protect, authorizeRoles("ADMIN"), getUserById);
router.put("/:id", protect, authorizeRoles("ADMIN"), updateUser);
router.patch("/:id/approve", protect, authorizeRoles("ADMIN"), approveUser);
router.delete("/:id", protect, authorizeRoles("ADMIN"), deleteUser);

module.exports = router;
