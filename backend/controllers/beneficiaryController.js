const Beneficiary = require("../models/Beneficiary");
const { createAuditLog } = require("../utils/auditLogger");

// POST /api/beneficiaries
const createBeneficiary = async (req, res, next) => {
    try {
        const { name, fatherOrMotherName, gender, dateOfBirth, category, contactNumber, address, administrativeUnitId } = req.body;
        if (!name || !gender || !category || !administrativeUnitId) {
            return res.status(400).json({ message: "Name, gender, category, and administrative unit are required" });
        }
        const beneficiary = await Beneficiary.create({
            name, fatherOrMotherName, gender, dateOfBirth,
            category, contactNumber, address, administrativeUnitId,
            createdBy: req.user._id
        });

        await createAuditLog({
            userId: req.user._id,
            action: "CREATE",
            entityType: "Beneficiary",
            entityId: beneficiary._id,
            description: `Created beneficiary ${name}`
        });

        res.status(201).json(beneficiary);
    } catch (error) {
        next(error);
    }
};

// GET /api/beneficiaries
const getBeneficiaries = async (req, res, next) => {
    try {
        const { search, administrativeUnitId, category, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (administrativeUnitId) filter.administrativeUnitId = administrativeUnitId;
        if (category) filter.category = category;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { contactNumber: { $regex: search, $options: "i" } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [beneficiaries, total] = await Promise.all([
            Beneficiary.find(filter)
                .populate("administrativeUnitId", "name type")
                .skip(skip)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 }),
            Beneficiary.countDocuments(filter)
        ]);

        res.json({ beneficiaries, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
    } catch (error) {
        next(error);
    }
};

// GET /api/beneficiaries/:id
const getBeneficiaryById = async (req, res, next) => {
    try {
        const beneficiary = await Beneficiary.findById(req.params.id)
            .populate("administrativeUnitId", "name type parentId");
        if (!beneficiary) return res.status(404).json({ message: "Beneficiary not found" });
        res.json(beneficiary);
    } catch (error) {
        next(error);
    }
};

// PUT /api/beneficiaries/:id
const updateBeneficiary = async (req, res, next) => {
    try {
        const allowedFields = ["name", "fatherOrMotherName", "gender", "dateOfBirth", "category", "contactNumber", "address", "administrativeUnitId"];
        const beneficiary = await Beneficiary.findById(req.params.id);
        if (!beneficiary) return res.status(404).json({ message: "Beneficiary not found" });

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) beneficiary[field] = req.body[field];
        });
        await beneficiary.save();

        await createAuditLog({
            userId: req.user._id,
            action: "UPDATE",
            entityType: "Beneficiary",
            entityId: beneficiary._id,
            description: `Updated beneficiary ${beneficiary.name}`
        });

        res.json(beneficiary);
    } catch (error) {
        next(error);
    }
};

// DELETE /api/beneficiaries/:id
const deleteBeneficiary = async (req, res, next) => {
    try {
        const beneficiary = await Beneficiary.findById(req.params.id);
        if (!beneficiary) return res.status(404).json({ message: "Beneficiary not found" });
        await Beneficiary.findByIdAndDelete(req.params.id);

        await createAuditLog({
            userId: req.user._id,
            action: "DELETE",
            entityType: "Beneficiary",
            entityId: beneficiary._id,
            description: `Deleted beneficiary ${beneficiary.name}`
        });

        res.json({ message: "Beneficiary deleted" });
    } catch (error) {
        next(error);
    }
};

module.exports = { createBeneficiary, getBeneficiaries, getBeneficiaryById, updateBeneficiary, deleteBeneficiary };
