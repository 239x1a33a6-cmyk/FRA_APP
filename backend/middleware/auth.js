const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
    try {
        // Accept token from cookie (local dev) OR Authorization header (cross-domain production)
        let token = req.cookies.token;
        if (!token && req.headers.authorization?.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({ message: "Not authorized, no token" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password").populate("authorityId");

        if (!user || !user.isActive) {
            return res.status(401).json({ message: "Not authorized, user not found" });
        }

        if (!user.isApproved) {
            return res.status(403).json({ message: "Account pending admin approval" });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Not authorized, invalid token" });
    }
};

module.exports = { protect };
