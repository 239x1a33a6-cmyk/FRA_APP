const mongoose = require("mongoose");

const claimVerificationSchema = new mongoose.Schema(
    {
        claimId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Claim",
            required: true
        },

        // The FRC authority performing the verification
        authorityId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Authority",
            required: true
        },

        // The user (FRC member) who recorded the verification
        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        verificationDate: {
            type: Date,
            default: Date.now
        },

        siteVisited: {
            type: Boolean,
            default: false
        },

        landVerified: {
            type: Boolean,
            default: false
        },

        claimedArea: {
            type: Number // in acres
        },

        verifiedArea: {
            type: Number // in acres
        },

        findings: {
            type: String,
            trim: true,
            default: ""
        },

        verificationStatus: {
            type: String,
            enum: ["PENDING", "UNDER_VERIFICATION", "COMPLETED"],
            default: "COMPLETED"
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

module.exports = mongoose.model("ClaimVerification", claimVerificationSchema);
