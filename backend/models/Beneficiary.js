const mongoose = require("mongoose");

const beneficiarySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        fatherOrMotherName: {
            type: String,
            trim: true,
            default: ""
        },

        gender: {
            type: String,
            enum: ["Male", "Female", "Other"],
            required: true
        },

        dateOfBirth: {
            type: Date
        },

        category: {
            type: String,
            enum: ["ST", "OBC", "SC", "General", "Other"],
            required: true
        },

        contactNumber: {
            type: String,
            trim: true,
            default: ""
        },

        address: {
            type: String,
            trim: true,
            default: ""
        },

        // Village/Gram Panchayat level administrative unit
        administrativeUnitId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AdministrativeUnit",
            required: true
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Beneficiary", beneficiarySchema);