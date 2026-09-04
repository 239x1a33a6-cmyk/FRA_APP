const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        role: {
            type: String,
            enum: ["ADMIN", "OFFICER", "VIEWER"],
            default: "VIEWER"
        },

        // Link to an authority/committee this user belongs to
        authorityId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Authority",
            default: null
        },

        isActive: {
            type: Boolean,
            default: true
        },

        isApproved: {
            type: Boolean,
            default: false  // new registrations require admin approval
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);