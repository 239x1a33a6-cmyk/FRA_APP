const mongoose = require("mongoose");

const authoritySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        type: {
            type: String,
            enum: ["FRC", "GRAM_SABHA", "SDLC", "DLC"],
            required: true
        },

        // The administrative area this authority covers
        administrativeUnitId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AdministrativeUnit",
            required: true
        },

        description: {
            type: String,
            trim: true,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Authority", authoritySchema);
