const mongoose = require("mongoose");

const claimHistorySchema = new mongoose.Schema(
    {
        claimId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Claim",
            required: true
        },

        fromStage: {
            type: String,
            enum: [
                "GRAM_SABHA",
                "FRC_VERIFICATION",
                "GRAM_SABHA_DECISION",
                "SDLC_REVIEW",
                "DLC_REVIEW",
                "COMPLETED",
                "CREATED"
            ],
            default: "CREATED"
        },

        toStage: {
            type: String,
            enum: [
                "GRAM_SABHA",
                "FRC_VERIFICATION",
                "GRAM_SABHA_DECISION",
                "SDLC_REVIEW",
                "DLC_REVIEW",
                "COMPLETED"
            ],
            required: true
        },

        action: {
            type: String,
            required: true,
            trim: true
        },

        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        authorityId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Authority",
            default: null
        },

        remarks: {
            type: String,
            trim: true,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("ClaimHistory", claimHistorySchema);