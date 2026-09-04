const mongoose = require("mongoose");
const Claim = require("../models/Claim");
const ClaimVerification = require("../models/ClaimVerification");
const ClaimDecision = require("../models/ClaimDecision");
const ClaimHistory = require("../models/ClaimHistory");
const ClaimDocument = require("../models/ClaimDocument");
const { createAuditLog } = require("../utils/auditLogger");

// Valid workflow transitions
const VALID_TRANSITIONS = {
    GRAM_SABHA: "FRC_VERIFICATION",
    FRC_VERIFICATION: "GRAM_SABHA_DECISION",
    GRAM_SABHA_DECISION: "SDLC_REVIEW",
    SDLC_REVIEW: "DLC_REVIEW",
    DLC_REVIEW: "COMPLETED"
};

// Helper to create history entry
const addHistory = async ({ claimId, fromStage, toStage, action, performedBy, authorityId, remarks }) => {
    await ClaimHistory.create({ claimId, fromStage, toStage, action, performedBy, authorityId: authorityId || null, remarks: remarks || "" });
};

// ── POST /api/claims ──────────────────────────────────────────────────────────
const createClaim = async (req, res, next) => {
    try {
        const { claimType, beneficiaryId, administrativeUnitId, claimDetails, evidenceSummary, remarks } = req.body;

        if (!claimType || !beneficiaryId || !administrativeUnitId) {
            return res.status(400).json({ message: "claimType, beneficiaryId, and administrativeUnitId are required" });
        }

        const claim = await Claim.create({
            claimType,
            beneficiaryId,
            administrativeUnitId,
            submittedBy: req.user._id,
            claimDetails: claimDetails || {},
            evidenceSummary: evidenceSummary || "",
            remarks: remarks || "",
            currentStage: "GRAM_SABHA",
            overallStatus: "SUBMITTED"
        });

        await addHistory({
            claimId: claim._id,
            fromStage: "CREATED",
            toStage: "GRAM_SABHA",
            action: "CLAIM_SUBMITTED",
            performedBy: req.user._id,
            remarks: "Claim submitted and assigned to Gram Sabha"
        });

        await createAuditLog({
            userId: req.user._id,
            action: "CREATE",
            entityType: "Claim",
            entityId: claim._id,
            description: `Claim ${claim.claimNumber} created`
        });

        res.status(201).json(claim);
    } catch (error) {
        next(error);
    }
};

// ── GET /api/claims ───────────────────────────────────────────────────────────
const getClaims = async (req, res, next) => {
    try {
        const {
            search, claimType, currentStage, overallStatus,
            administrativeUnitId, beneficiaryId,
            page = 1, limit = 20
        } = req.query;

        const filter = {};
        if (claimType) filter.claimType = claimType;
        if (currentStage) filter.currentStage = currentStage;
        if (overallStatus) filter.overallStatus = overallStatus;
        if (administrativeUnitId) filter.administrativeUnitId = administrativeUnitId;
        if (beneficiaryId) filter.beneficiaryId = beneficiaryId;
        if (search) filter.claimNumber = { $regex: search, $options: "i" };

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [claims, total] = await Promise.all([
            Claim.find(filter)
                .populate("beneficiaryId", "name category gender")
                .populate("administrativeUnitId", "name type")
                .populate("submittedBy", "name email role")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Claim.countDocuments(filter)
        ]);

        res.json({ claims, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
    } catch (error) {
        next(error);
    }
};

// ── GET /api/claims/stats ─────────────────────────────────────────────────────
const getClaimStats = async (req, res, next) => {
    try {
        const [total, byStage, byStatus, byType] = await Promise.all([
            Claim.countDocuments(),
            Claim.aggregate([{ $group: { _id: "$currentStage", count: { $sum: 1 } } }]),
            Claim.aggregate([{ $group: { _id: "$overallStatus", count: { $sum: 1 } } }]),
            Claim.aggregate([{ $group: { _id: "$claimType", count: { $sum: 1 } } }])
        ]);

        const toMap = (arr) => arr.reduce((acc, { _id, count }) => { acc[_id] = count; return acc; }, {});

        res.json({
            total,
            byStage: toMap(byStage),
            byStatus: toMap(byStatus),
            byType: toMap(byType)
        });
    } catch (error) {
        next(error);
    }
};

// ── GET /api/claims/:id ───────────────────────────────────────────────────────
const getClaimById = async (req, res, next) => {
    try {
        const claim = await Claim.findById(req.params.id)
            .populate("beneficiaryId")
            .populate("administrativeUnitId")
            .populate("submittedBy", "name email role");

        if (!claim) return res.status(404).json({ message: "Claim not found" });
        res.json(claim);
    } catch (error) {
        next(error);
    }
};

// ── PUT /api/claims/:id ───────────────────────────────────────────────────────
const updateClaim = async (req, res, next) => {
    try {
        const claim = await Claim.findById(req.params.id);
        if (!claim) return res.status(404).json({ message: "Claim not found" });

        if (["APPROVED", "REJECTED"].includes(claim.overallStatus)) {
            return res.status(400).json({ message: "Cannot modify a completed claim" });
        }

        const { claimDetails, evidenceSummary, remarks } = req.body;
        if (claimDetails) claim.claimDetails = { ...claim.claimDetails.toObject?.() || claim.claimDetails, ...claimDetails };
        if (evidenceSummary !== undefined) claim.evidenceSummary = evidenceSummary;
        if (remarks !== undefined) claim.remarks = remarks;

        await claim.save();
        res.json(claim);
    } catch (error) {
        next(error);
    }
};

// ── POST /api/claims/:id/forward ────────────────────────────────────────────
// Move claim from GRAM_SABHA → FRC_VERIFICATION
const forwardToFRC = async (req, res, next) => {
    try {
        const claim = await Claim.findById(req.params.id);
        if (!claim) return res.status(404).json({ message: "Claim not found" });

        if (claim.currentStage !== "GRAM_SABHA") {
            return res.status(400).json({ message: `Claim must be in GRAM_SABHA stage. Current: ${claim.currentStage}` });
        }

        claim.currentStage = "FRC_VERIFICATION";
        claim.overallStatus = "IN_PROCESS";
        await claim.save();

        await addHistory({
            claimId: claim._id,
            fromStage: "GRAM_SABHA",
            toStage: "FRC_VERIFICATION",
            action: "FORWARDED_TO_FRC",
            performedBy: req.user._id,
            authorityId: req.user.authorityId?._id,
            remarks: req.body.remarks || "Forwarded to FRC for physical verification"
        });

        res.json({ message: "Claim forwarded to FRC", claim });
    } catch (error) {
        next(error);
    }
};

// ── POST /api/claims/:id/verification ────────────────────────────────────────
const submitVerification = async (req, res, next) => {
    try {
        const claim = await Claim.findById(req.params.id);
        if (!claim) return res.status(404).json({ message: "Claim not found" });

        if (claim.currentStage !== "FRC_VERIFICATION") {
            return res.status(400).json({ message: `Claim must be in FRC_VERIFICATION stage. Current: ${claim.currentStage}` });
        }

        // User must belong to an FRC authority
        const userAuthority = req.user.authorityId;
        if (req.user.role !== "ADMIN" && (!userAuthority || userAuthority.type !== "FRC")) {
            return res.status(403).json({ message: "Only FRC members can submit verification" });
        }

        const { siteVisited, landVerified, claimedArea, verifiedArea, findings, remarks } = req.body;

        const verification = await ClaimVerification.create({
            claimId: claim._id,
            authorityId: userAuthority?._id || req.body.authorityId,
            verifiedBy: req.user._id,
            siteVisited: siteVisited ?? false,
            landVerified: landVerified ?? false,
            claimedArea: claimedArea || null,
            verifiedArea: verifiedArea || null,
            findings: findings || "",
            verificationStatus: "COMPLETED",
            remarks: remarks || ""
        });

        // Advance to next stage
        claim.currentStage = "GRAM_SABHA_DECISION";
        await claim.save();

        await addHistory({
            claimId: claim._id,
            fromStage: "FRC_VERIFICATION",
            toStage: "GRAM_SABHA_DECISION",
            action: "FRC_VERIFICATION_COMPLETED",
            performedBy: req.user._id,
            authorityId: userAuthority?._id,
            remarks: "FRC verification completed, forwarded to Gram Sabha for resolution"
        });

        await createAuditLog({
            userId: req.user._id,
            action: "FRC_VERIFICATION",
            entityType: "Claim",
            entityId: claim._id,
            description: `FRC verification completed for claim ${claim.claimNumber}`
        });

        res.status(201).json({ message: "Verification submitted", verification, claim });
    } catch (error) {
        next(error);
    }
};

// ── POST /api/claims/:id/decisions ───────────────────────────────────────────
const submitDecision = async (req, res, next) => {
    try {
        const claim = await Claim.findById(req.params.id);
        if (!claim) return res.status(404).json({ message: "Claim not found" });

        const { decisionLevel, decision, resolutionNumber, remarks, authorityId } = req.body;

        if (!decisionLevel || !decision) {
            return res.status(400).json({ message: "decisionLevel and decision are required" });
        }

        // Validate stage matches decision level
        const stageMap = {
            GRAM_SABHA: "GRAM_SABHA_DECISION",
            SDLC: "SDLC_REVIEW",
            DLC: "DLC_REVIEW"
        };
        const expectedStage = stageMap[decisionLevel];
        if (claim.currentStage !== expectedStage) {
            return res.status(400).json({
                message: `For ${decisionLevel} decision, claim must be in ${expectedStage}. Current: ${claim.currentStage}`
            });
        }

        // Authority type check
        const authorityTypeMap = { GRAM_SABHA: "GRAM_SABHA", SDLC: "SDLC", DLC: "DLC" };
        const userAuthority = req.user.authorityId;
        if (req.user.role !== "ADMIN" && (!userAuthority || userAuthority.type !== authorityTypeMap[decisionLevel])) {
            return res.status(403).json({ message: `Only ${decisionLevel} members can submit this decision` });
        }

        const decisionDoc = await ClaimDecision.create({
            claimId: claim._id,
            authorityId: userAuthority?._id || authorityId,
            decisionLevel,
            decision,
            decidedBy: req.user._id,
            resolutionNumber: resolutionNumber || "",
            remarks: remarks || ""
        });

        // Determine next stage based on decision
        let nextStage, nextStatus;

        if (decision === "RETURNED") {
            nextStage = "GRAM_SABHA";
            nextStatus = "RETURNED";
        } else if (decision === "NOT_RECOMMENDED") {
            nextStage = claim.currentStage; // stays / may be sent back
            nextStatus = "RETURNED";
        } else if (decisionLevel === "GRAM_SABHA") {
            nextStage = "SDLC_REVIEW";
            nextStatus = "IN_PROCESS";
        } else if (decisionLevel === "SDLC") {
            nextStage = "DLC_REVIEW";
            nextStatus = "IN_PROCESS";
        } else if (decisionLevel === "DLC") {
            nextStage = "COMPLETED";
            nextStatus = decision === "APPROVED" ? "APPROVED" : "REJECTED";
        }

        claim.currentStage = nextStage;
        claim.overallStatus = nextStatus;
        await claim.save();

        const actionName = `${decisionLevel}_DECISION_${decision}`;
        await addHistory({
            claimId: claim._id,
            fromStage: expectedStage,
            toStage: nextStage,
            action: actionName,
            performedBy: req.user._id,
            authorityId: userAuthority?._id || authorityId,
            remarks: remarks || `${decisionLevel} decision: ${decision}`
        });

        await createAuditLog({
            userId: req.user._id,
            action: actionName,
            entityType: "Claim",
            entityId: claim._id,
            description: `${decisionLevel} decision '${decision}' for claim ${claim.claimNumber}`
        });

        res.status(201).json({ message: "Decision recorded", decision: decisionDoc, claim });
    } catch (error) {
        next(error);
    }
};

// ── GET /api/claims/:id/history ───────────────────────────────────────────────
const getClaimHistory = async (req, res, next) => {
    try {
        const history = await ClaimHistory.find({ claimId: req.params.id })
            .populate("performedBy", "name email role")
            .populate("authorityId", "name type")
            .sort({ createdAt: 1 });
        res.json(history);
    } catch (error) {
        next(error);
    }
};

// ── GET /api/claims/:id/verifications ─────────────────────────────────────────
const getClaimVerifications = async (req, res, next) => {
    try {
        const verifications = await ClaimVerification.find({ claimId: req.params.id })
            .populate("verifiedBy", "name email")
            .populate("authorityId", "name type")
            .sort({ createdAt: -1 });
        res.json(verifications);
    } catch (error) {
        next(error);
    }
};

// ── GET /api/claims/:id/decisions ─────────────────────────────────────────────
const getClaimDecisions = async (req, res, next) => {
    try {
        const decisions = await ClaimDecision.find({ claimId: req.params.id })
            .populate("decidedBy", "name email")
            .populate("authorityId", "name type")
            .sort({ createdAt: 1 });
        res.json(decisions);
    } catch (error) {
        next(error);
    }
};

// ── GET /api/claims/:id/documents ─────────────────────────────────────────────
const getClaimDocuments = async (req, res, next) => {
    try {
        const docs = await ClaimDocument.find({ claimId: req.params.id })
            .populate("uploadedBy", "name email")
            .sort({ createdAt: -1 });
        res.json(docs);
    } catch (error) {
        next(error);
    }
};

// ── POST /api/claims/:id/documents ────────────────────────────────────────────
const addDocument = async (req, res, next) => {
    try {
        const claim = await Claim.findById(req.params.id);
        if (!claim) return res.status(404).json({ message: "Claim not found" });

        const { documentType, documentName, documentUrl } = req.body;
        if (!documentType || !documentName || !documentUrl) {
            return res.status(400).json({ message: "documentType, documentName, and documentUrl are required" });
        }

        const doc = await ClaimDocument.create({
            claimId: claim._id,
            documentType,
            documentName,
            documentUrl,
            uploadedBy: req.user._id
        });

        res.status(201).json(doc);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createClaim, getClaims, getClaimStats, getClaimById, updateClaim,
    forwardToFRC, submitVerification, submitDecision,
    getClaimHistory, getClaimVerifications, getClaimDecisions,
    getClaimDocuments, addDocument
};
