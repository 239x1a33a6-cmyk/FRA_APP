// Middleware factory: authorize by role
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Role '${req.user.role}' is not authorized for this action`
            });
        }
        next();
    };
};

// Middleware factory: authorize by authority type
const authorizeAuthority = (...authorityTypes) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        // ADMINs bypass authority checks
        if (req.user.role === "ADMIN") return next();

        const userAuthority = req.user.authorityId;
        if (!userAuthority || !authorityTypes.includes(userAuthority.type)) {
            return res.status(403).json({
                message: `Authority '${userAuthority?.type || "None"}' is not allowed for this action`
            });
        }
        next();
    };
};

module.exports = { authorizeRoles, authorizeAuthority };
