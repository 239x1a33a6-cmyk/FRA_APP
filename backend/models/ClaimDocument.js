const mongoose = require("mongoose");

const claimDocumentSchema = new mongoose.Schema(
    {
        claimId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Claim",
            required: true
        },

        documentType: {
            type: String,
            required: true,
            trim: true
        },

        documentName: {
            type: String,
            required: true,
            trim: true
        },

        documentUrl: {
            type: String,
            required: true,
            trim: true
        },

        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "ClaimDocument",
    claimDocumentSchema
);