import CustomError from "../config/errors/CustomError.js";
import AuthorizationError from "../config/errors/AuthorizationError.js";

const errorHandler = (err, req, res, next) => {
  console.error(`Error: ${err}`);

  // Handle custom errors
  if (err instanceof AuthorizationError) {
    return res
      .status(err.status || 401)
      .set(err.authHeaders)
      .json({
        success: false,
        error: err.message,
        feedback: err.feedback,
      });
  }

  if (err instanceof CustomError) {
    return res.status(err.status || 500).json({
      success: false,
      error: err.message,
      feedback: err.feedback,
    });
  }

  // Handle Prisma errors
  if (err.code) {
    switch (err.code) {
      case "P2002":
        return res.status(400).json({
          success: false,
          error: "Duplicate entry",
          feedback: "A record with this information already exists",
        });
      case "P2025":
        return res.status(404).json({
          success: false,
          error: "Record not found",
          feedback: "The requested resource does not exist",
        });
      default:
        return res.status(500).json({
          success: false,
          error: "Database error",
          feedback: "An error occurred while processing your request",
        });
    }
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      error: "Invalid token",
      feedback: "Your authentication token is invalid",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      error: "Token expired",
      feedback: "Your authentication token has expired",
    });
  }

  // Handle validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      error: "Validation error",
      feedback: err.message,
    });
  }

  // Default error
  res.status(500).json({
    success: false,
    error: "Internal server error",
    feedback: "Something went wrong on our end",
  });
};

// 404 handler for undefined routes
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    feedback: `The endpoint ${req.method} ${req.path} does not exist`,
  });
};

export { errorHandler, notFoundHandler };