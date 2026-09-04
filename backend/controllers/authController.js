const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { createAuditLog } = require("../utils/auditLogger");

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

// POST /api/auth/register
const register = async (req, res, next) => {
    try {
        const { name, email, password, role, authorityId } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email and password are required" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: "VIEWER",          // always start as VIEWER, admin assigns role
            isApproved: false,        // requires admin approval before login
            authorityId: null
        });

        await createAuditLog({
            userId: user._id,
            action: "REGISTER",
            entityType: "User",
            entityId: user._id,
            description: `User ${user.name} registered — awaiting admin approval`
        });

        // Do NOT issue a token — user must be approved first
        res.status(201).json({
            pending: true,
            message: "Account created. Please wait for an administrator to approve your account before logging in."
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/auth/login
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email }).populate("authorityId");
        if (!user || !user.isActive) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        if (!user.isApproved) {
            return res.status(403).json({ message: "Your account is pending administrator approval. Please contact your administrator." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = generateToken(user._id);
        res.cookie("token", token, cookieOptions);

        await createAuditLog({
            userId: user._id,
            action: "LOGIN",
            entityType: "User",
            entityId: user._id,
            description: `User ${user.name} logged in`
        });

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            authorityId: user.authorityId
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/auth/logout
const logout = async (req, res) => {
    res.cookie("token", "", { httpOnly: true, expires: new Date(0) });
    res.json({ message: "Logged out successfully" });
};

// GET /api/auth/me
const getMe = async (req, res) => {
    res.json(req.user);
};

module.exports = { register, login, logout, getMe };
