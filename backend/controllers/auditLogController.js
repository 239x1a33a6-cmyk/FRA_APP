const AuditLog = require("../models/AuditLog");

// GET /api/audit-logs (ADMIN only)
const getAuditLogs = async (req, res, next) => {
    try {
        const { entityType, userId, page = 1, limit = 50 } = req.query;
        const filter = {};
        if (entityType) filter.entityType = entityType;
        if (userId) filter.userId = userId;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [logs, total] = await Promise.all([
            AuditLog.find(filter)
                .populate("userId", "name email role")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            AuditLog.countDocuments(filter)
        ]);

        res.json({ logs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
    } catch (error) {
        next(error);
    }
};

module.exports = { getAuditLogs };
