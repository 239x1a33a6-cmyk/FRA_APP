const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminUnitRoutes = require("./routes/adminUnitRoutes");
const authorityRoutes = require("./routes/authorityRoutes");
const beneficiaryRoutes = require("./routes/beneficiaryRoutes");
const claimRoutes = require("./routes/claimRoutes");
const auditLogRoutes = require("./routes/auditLogRoutes");

dotenv.config();

const app = express();

connectDB();

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true
    })
);

app.use(express.json());
app.use(cookieParser());

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/administrative-units", adminUnitRoutes);
app.use("/api/authorities", authorityRoutes);
app.use("/api/beneficiaries", beneficiaryRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/audit-logs", auditLogRoutes);

// Health check
app.get("/", (req, res) => {
    res.json({ message: "FRA Atlas Backend is running", version: "1.0.0" });
});

// Global error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 8100;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});