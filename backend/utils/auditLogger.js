const AuditLog = require("../models/AuditLog");

const createAuditLog = async ({ userId, action, entityType, entityId, description }) => {
    try {
        await AuditLog.create({ userId, action, entityType, entityId, description });
    } catch (err) {
        console.error("Audit log error:", err.message);
    }
};

module.exports = { createAuditLog };
