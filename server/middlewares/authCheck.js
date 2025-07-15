import jwt from "jsonwebtoken";
import AuthorizationError from "../config/errors/AuthorizationError.js";

const requireAuthentication = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AuthorizationError(
        "Authentication Error",
        undefined,
        "You are unauthenticated!",
        {
          error: "invalid_access_token",
          error_description: "unknown authentication scheme",
        }
      );
    }

    const accessTokenParts = authHeader.split(" ");
    const token = accessTokenParts[1];

    const decoded = jwt.verify(token, process.env.AUTH_ACCESS_TOKEN_SECRET);

    // Attach authenticated user info to request object
    req.userId = decoded.id;
    req.isAdmin = decoded.isAdmin;
    req.token = token;
    next();
  } catch (err) {
    console.log(err);

    if (err.name === "TokenExpiredError") {
      return next(
        new AuthorizationError(
          "Authentication Error",
          undefined,
          "Token lifetime exceeded!",
          {
            error: "expired_access_token",
            error_description: "access token is expired",
          }
        )
      );
    }

    next(err);
  }
};

// Optional middleware for admin-only routes
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.isAdmin) {
      throw new AuthorizationError(
        "Authorization Error",
        403,
        "You need admin privileges to access this resource",
        {
          error: "insufficient_privileges",
          error_description: "admin access required",
        }
      );
    }
    next();
  } catch (error) {
    next(error);
  }
};

export { requireAuthentication, requireAdmin };