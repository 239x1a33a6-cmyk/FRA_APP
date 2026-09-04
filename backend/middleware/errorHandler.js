const errorHandler = (err, req, res, next) => {
    console.error(err.stack || err.message);

    const statusCode = err.statusCode || 500;

    // Mongoose validation errors
    if (err.name === "ValidationError") {
        const messages = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({ message: messages.join(", ") });
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0];
        return res.status(400).json({ message: `${field} already exists` });
    }

    // Mongoose bad ObjectId
    if (err.name === "CastError") {
        return res.status(400).json({ message: "Invalid ID format" });
    }

    // JWT errors
    if (err.name === "JsonWebTokenError") {
        return res.status(401).json({ message: "Invalid token" });
    }

    res.status(statusCode).json({
        message: err.message || "Internal Server Error"
    });
};

module.exports = errorHandler;
