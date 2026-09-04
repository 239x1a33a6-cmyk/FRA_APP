const mongoose = require("mongoose");

const administrativeUnitSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        type: {
            type: String,
            enum: [
                "STATE",
                "DISTRICT",
                "SUB_DIVISION",
                "MANDAL",
                "GRAM_PANCHAYAT",
                "VILLAGE"
            ],
            required: true
        },

        code: {
            type: String,
            trim: true,
            default: ""
        },

        parentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AdministrativeUnit",
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "AdministrativeUnit",
    administrativeUnitSchema
);