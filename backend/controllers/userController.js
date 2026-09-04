const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { createAuditLog } = require("../utils/auditLogger");

// GET /api/users  (ADMIN only)
const getUsers = async (req, res, next) => {
    try {
        const users = await User.find()
            .select("-password")
            .populate("authorityId", "name type")
            .sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        next(error);
    }
};

// GET /api/users/:id
const getUserById = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id)
            .select("-password")
            .populate("authorityId", "name type");
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (error) {
        next(error);
    }
};

// PUT /api/users/:id  (ADMIN only)
const updateUser = async (req, res, next) => {
    try {
        const { name, email, role, authorityId, isActive } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (name) user.name = name;
        if (email) user.email = email;
        if (role) user.role = role;
        if (authorityId !== undefined) user.authorityId = authorityId || null;
        if (isActive !== undefined) user.isActive = isActive;
        if (req.body.isApproved !== undefined) user.isApproved = req.body.isApproved;

        await user.save();

        await createAuditLog({
            userId: req.user._id,
            action: "UPDATE_USER",
            entityType: "User",
            entityId: user._id,
            description: `Admin updated user ${user.name}`
        });

        res.json({ message: "User updated", user: { ...user.toObject(), password: undefined } });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/users/:id  (ADMIN only)
const deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: "Cannot delete your own account" });
        }

        await User.findByIdAndDelete(req.params.id);

        await createAuditLog({
            userId: req.user._id,
            action: "DELETE_USER",
            entityType: "User",
            entityId: user._id,
            description: `Admin deleted user ${user.name}`
        });

        res.json({ message: "User deleted" });
    } catch (error) {
        next(error);
    }
};

// PATCH /api/users/:id/approve  (ADMIN only)
const approveUser = async (req, res, next) => {
    try {
        const { role, authorityId } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.isApproved = true;
        if (role) user.role = role;
        if (authorityId !== undefined) user.authorityId = authorityId || null;

        await user.save();

        await createAuditLog({
            userId: req.user._id,
            action: "APPROVE_USER",
            entityType: "User",
            entityId: user._id,
            description: `Admin approved user ${user.name} with role ${user.role}`
        });

        res.json({ message: "User approved", user: { ...user.toObject(), password: undefined } });
    } catch (error) {
        next(error);
    }
};

// PUT /api/users/profile  (own profile)
const updateProfile = async (req, res, next) => {
    try {
        const { name, password } = req.body;
        const user = await User.findById(req.user._id);

        if (name) user.name = name;
        if (password) {
            if (password.length < 6) {
                return res.status(400).json({ message: "Password must be at least 6 characters" });
            }
            user.password = await bcrypt.hash(password, 12);
        }

        await user.save();
        res.json({ message: "Profile updated" });
    } catch (error) {
        next(error);
    }
};

module.exports = { getUsers, getUserById, updateUser, deleteUser, updateProfile, approveUser };
