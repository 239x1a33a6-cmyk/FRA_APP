const mongoose = require("mongoose");

const claimDecisionSchema = new mongoose.Schema(
    {
        claimId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Claim",
            required: true
        },

        // Which committee made this decision
        authorityId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Authority",
            required: true
        },

        // Which stage/level made this decision
        decisionLevel: {
            type: String,
            enum: ["GRAM_SABHA", "SDLC", "DLC"],
            required: true
        },

        decision: {
            type: String,
            enum: [
                "RECOMMENDED",
                "NOT_RECOMMENDED",
                "RETURNED",
                "APPROVED",
                "REJECTED"
            ],
            required: true
        },

        // The user who recorded/made the decision
        decidedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        decisionDate: {
            type: Date,
            default: Date.now
        },

        // For Gram Sabha resolutions
        resolutionNumber: {
            type: String,
            trim: true,
            default: ""
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

module.exports = mongoose.model("ClaimDecision", claimDecisionSchema);
