const Authority = require("../models/Authority");
const User = require("../models/User");

// POST /api/authorities
const createAuthority = async (req, res, next) => {
    try {
        const { name, type, administrativeUnitId, description } = req.body;
        if (!name || !type || !administrativeUnitId) {
            return res.status(400).json({ message: "Name, type, and administrative unit are required" });
        }
        const authority = await Authority.create({ name, type, administrativeUnitId, description });
        res.status(201).json(authority);
    } catch (error) {
        next(error);
    }
};

// GET /api/authorities
const getAuthorities = async (req, res, next) => {
    try {
        const { type, administrativeUnitId } = req.query;
        const filter = {};
        if (type) filter.type = type;
        if (administrativeUnitId) filter.administrativeUnitId = administrativeUnitId;

        const authorities = await Authority.find(filter)
            .populate("administrativeUnitId", "name type")
            .sort({ name: 1 });
        res.json(authorities);
    } catch (error) {
        next(error);
    }
};

// GET /api/authorities/:id
const getAuthorityById = async (req, res, next) => {
    try {
        const authority = await Authority.findById(req.params.id)
            .populate("administrativeUnitId", "name type");
        if (!authority) return res.status(404).json({ message: "Authority not found" });

        // Get members of this authority
        const members = await User.find({ authorityId: req.params.id }).select("-password");
        res.json({ ...authority.toObject(), members });
    } catch (error) {
        next(error);
    }
};

// PUT /api/authorities/:id
const updateAuthority = async (req, res, next) => {
    try {
        const { name, type, administrativeUnitId, description } = req.body;
        const authority = await Authority.findById(req.params.id);
        if (!authority) return res.status(404).json({ message: "Authority not found" });

        if (name) authority.name = name;
        if (type) authority.type = type;
        if (administrativeUnitId) authority.administrativeUnitId = administrativeUnitId;
        if (description !== undefined) authority.description = description;

        await authority.save();
        res.json(authority);
    } catch (error) {
        next(error);
    }
};

// DELETE /api/authorities/:id
const deleteAuthority = async (req, res, next) => {
    try {
        const authority = await Authority.findById(req.params.id);
        if (!authority) return res.status(404).json({ message: "Authority not found" });
        await Authority.findByIdAndDelete(req.params.id);
        res.json({ message: "Authority deleted" });
    } catch (error) {
        next(error);
    }
};

module.exports = { createAuthority, getAuthorities, getAuthorityById, updateAuthority, deleteAuthority };
