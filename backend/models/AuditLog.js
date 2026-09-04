const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        action: {
            type: String,
            required: true,
            trim: true
        },

        entityType: {
            type: String,
            required: true,
            trim: true
        },

        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },

        description: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "AuditLog",
    auditLogSchema
);