const AdministrativeUnit = require("../models/AdministrativeUnit");

// POST /api/administrative-units
const createUnit = async (req, res, next) => {
    try {
        const { name, type, code, parentId } = req.body;
        if (!name || !type) {
            return res.status(400).json({ message: "Name and type are required" });
        }
        const unit = await AdministrativeUnit.create({ name, type, code, parentId: parentId || null });
        res.status(201).json(unit);
    } catch (error) {
        next(error);
    }
};

// GET /api/administrative-units
const getUnits = async (req, res, next) => {
    try {
        const { type, parentId } = req.query;
        const filter = {};
        if (type) filter.type = type;
        if (parentId === "null") filter.parentId = null;
        else if (parentId) filter.parentId = parentId;

        const units = await AdministrativeUnit.find(filter)
            .populate("parentId", "name type")
            .sort({ name: 1 });
        res.json(units);
    } catch (error) {
        next(error);
    }
};

// GET /api/administrative-units/:id
const getUnitById = async (req, res, next) => {
    try {
        const unit = await AdministrativeUnit.findById(req.params.id)
            .populate("parentId", "name type");
        if (!unit) return res.status(404).json({ message: "Administrative unit not found" });
        res.json(unit);
    } catch (error) {
        next(error);
    }
};

// PUT /api/administrative-units/:id
const updateUnit = async (req, res, next) => {
    try {
        const { name, type, code, parentId } = req.body;
        const unit = await AdministrativeUnit.findById(req.params.id);
        if (!unit) return res.status(404).json({ message: "Administrative unit not found" });

        if (name) unit.name = name;
        if (type) unit.type = type;
        if (code !== undefined) unit.code = code;
        if (parentId !== undefined) unit.parentId = parentId || null;

        await unit.save();
        res.json(unit);
    } catch (error) {
        next(error);
    }
};

// DELETE /api/administrative-units/:id
const deleteUnit = async (req, res, next) => {
    try {
        const unit = await AdministrativeUnit.findById(req.params.id);
        if (!unit) return res.status(404).json({ message: "Administrative unit not found" });

        // Check for children
        const children = await AdministrativeUnit.countDocuments({ parentId: req.params.id });
        if (children > 0) {
            return res.status(400).json({ message: "Cannot delete unit with child units" });
        }

        await AdministrativeUnit.findByIdAndDelete(req.params.id);
        res.json({ message: "Administrative unit deleted" });
    } catch (error) {
        next(error);
    }
};

module.exports = { createUnit, getUnits, getUnitById, updateUnit, deleteUnit };
