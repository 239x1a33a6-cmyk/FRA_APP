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

// CORS — allow local dev + any CLIENT_URL values (comma-separated) + hardcoded Vercel URL
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://fra-app.vercel.app',  // hardcoded production frontend
    // Also support any CLIENT_URL env var (comma-separated for multiple URLs)
    ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(u => u.trim()) : [])
].filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, Postman, Render shell)
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                // In production, log but don't crash — deny gracefully
                console.warn(`CORS blocked: ${origin}`);
                callback(null, false);
            }
        },
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