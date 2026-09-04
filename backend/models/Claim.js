const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema(
    {
        claimNumber: {
            type: String,
            unique: true,
            trim: true
        },

        claimType: {
            type: String,
            enum: ["IFR", "CR", "CFR"],
            required: true
        },

        beneficiaryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Beneficiary",
            required: true
        },

        administrativeUnitId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AdministrativeUnit",
            required: true
        },

        submittedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // Tracks position in the workflow
        currentStage: {
            type: String,
            enum: [
                "GRAM_SABHA",
                "FRC_VERIFICATION",
                "GRAM_SABHA_DECISION",
                "SDLC_REVIEW",
                "DLC_REVIEW",
                "COMPLETED"
            ],
            default: "GRAM_SABHA"
        },

        // Overall outcome
        overallStatus: {
            type: String,
            enum: [
                "SUBMITTED",
                "IN_PROCESS",
                "RETURNED",
                "APPROVED",
                "REJECTED"
            ],
            default: "SUBMITTED"
        },

        // Claim-type specific details
        claimDetails: {
            // IFR fields
            landArea: { type: Number },
            landPurpose: { type: String, trim: true },
            disputedLand: { type: Boolean, default: false },
            pattaDetails: { type: String, trim: true },
            rehabilitationDetails: { type: String, trim: true },

            // CR fields
            nistar: { type: String, trim: true },
            minorForestProduce: { type: String, trim: true },
            waterBodies: { type: String, trim: true },
            grazing: { type: String, trim: true },
            traditionalResourceAccess: { type: String, trim: true },

            // CFR fields
            forestResourceDetails: { type: String, trim: true },
            communityForestArea: { type: Number },
            biodiversityDetails: { type: String, trim: true },
            traditionalKnowledge: { type: String, trim: true }
        },

        evidenceSummary: {
            type: String,
            trim: true,
            default: ""
        },

        remarks: {
            type: String,
            trim: true,
            default: ""
        },

        // Placeholder for future GIS integration
        location: {
            type: {
                type: String,
                enum: ["Point", "Polygon"],
                default: null
            },
            coordinates: {
                type: mongoose.Schema.Types.Mixed,
                default: null
            }
        }
    },
    {
        timestamps: true
    }
);

// Auto-generate claimNumber before saving
claimSchema.pre("save", async function () {
    if (!this.claimNumber) {
        const count = await mongoose.model("Claim").countDocuments();
        this.claimNumber = `FRA-${String(count + 1).padStart(4, "0")}`;
    }
});

module.exports = mongoose.model("Claim", claimSchema);