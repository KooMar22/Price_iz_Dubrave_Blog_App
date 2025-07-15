import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import CustomError from "../config/errors/CustomError.js";
import { parseJWTExpiry } from "../utils/time.js";

const prisma = new PrismaClient();

// Pull in Environment variables
const ACCESS_TOKEN = {
  secret: process.env.AUTH_ACCESS_TOKEN_SECRET,
  expiry: process.env.AUTH_ACCESS_TOKEN_EXPIRY,
};

const REFRESH_TOKEN = {
  secret: process.env.AUTH_REFRESH_TOKEN_SECRET,
  expiry: process.env.AUTH_REFRESH_TOKEN_EXPIRY,
};

class User {
  constructor(userData) {
    Object.assign(this, userData);
  }

  /*
  STATIC METHODS
  */

  // Create a new user
  static async create(userData) {
    try {
      const { username, password } = userData;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUser) {
        throw new CustomError(
          "User already exists",
          409,
          "Username is already taken"
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
        },
      });

      return new User(user);
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        "Failed to create user",
        500,
        "Database error occurred"
      );
    }
  }

  // Find user by username
  static async findByUsername(username) {
    try {
      const user = await prisma.user.findUnique({
        where: { username },
      });

      return user ? new User(user) : null;
    } catch (error) {
      throw new CustomError(
        "Failed to find user",
        500,
        "Database error occurred"
      );
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(id) },
        include: {
          refreshTokens: true,
          posts: true,
          comments: true,
        },
      });

      return user ? new User(user) : null;
    } catch (error) {
      throw new CustomError(
        "Failed to find user",
        500,
        "Database error occurred"
      );
    }
  }

  // Find user by credentials
  static async findByCredentials(username, password) {
    try {
      const user = await prisma.user.findUnique({
        where: { username },
      });

      if (!user) {
        throw new CustomError(
          "Wrong credentials!",
          400,
          "Username or password is wrong!"
        );
      }

      const passwdMatch = await bcrypt.compare(password, user.password);
      if (!passwdMatch) {
        throw new CustomError(
          "Wrong credentials!",
          400,
          "Username or password is wrong!"
        );
      }

      return new User(user);
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        "Failed to authenticate user",
        500,
        "Database error occurred"
      );
    }
  }

  // Remove refresh token
  static async removeRefreshToken(tokenHash) {
    try {
      await prisma.refreshToken.delete({
        where: { token: tokenHash },
      });
    } catch (error) {
      // Token might not exist
      console.log(`Token removal failed: ${error.message}`);
    }
  }

  // Verify refresh token
  static async verifyRefreshToken(token) {
    try {
      // Verify JWT first
      const decoded = jwt.verify(token, REFRESH_TOKEN.secret);

      // Create hash to check in database
      const tokenHash = crypto
        .createHmac("sha256", REFRESH_TOKEN.secret)
        .update(token)
        .digest("hex");

      // Check if token exists and is not expired
      const refreshToken = await prisma.refreshToken.findUnique({
        where: { token: tokenHash },
        include: { user: true },
      });

      if (!refreshToken || refreshToken.expiresAt < new Date()) {
        throw new CustomError(
          "Invalid refresh token",
          401,
          "Token is invalid or expired"
        );
      }

      if (decoded.id !== refreshToken.user.id) {
        throw new CustomError("Invalid refresh token", 401, "Token mismatch");
      }

      return new User(refreshToken.user);
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      if (
        error.name === "JsonWebTokenError" ||
        error.name === "TokenExpiredError"
      ) {
        throw new CustomError(
          "Invalid refresh token",
          401,
          "Token is malformed or expired"
        );
      }
      throw new CustomError(
        "Token verification failed",
        500,
        "Database error occurred"
      );
    }
  }

  /*
  INSTANCE METHODS
  */

  // Generate access token
  generateAccessToken() {
    return jwt.sign(
      {
        id: this.id,
        username: this.username,
        isAdmin: this.isAdmin,
      },
      ACCESS_TOKEN.secret,
      { expiresIn: ACCESS_TOKEN.expiry }
    );
  }

  // Generate refresh token
  generateRefreshToken() {
    return jwt.sign({ id: this.id }, REFRESH_TOKEN.secret, {
      expiresIn: REFRESH_TOKEN.expiry,
    });
  }

  // Save refresh token to database
  async saveRefreshToken(token) {
    try {
      // Create refresh token hash
      const rTknHash = crypto
        .createHmac("sha256", REFRESH_TOKEN.secret)
        .update(token)
        .digest("hex");

      // Calculate expiry based on env variable
      const expiresAt = new Date(
        Date.now() + parseJWTExpiry(process.env.AUTH_REFRESH_TOKEN_EXPIRY)
      );

      await prisma.refreshToken.create({
        data: {
          token: rTknHash,
          userId: this.id,
          expiresAt,
        },
      });
    } catch (error) {
      throw new CustomError(
        "Failed to save refresh token",
        500,
        "Database error occurred"
      );
    }
  }

  // Convert to JSON (exclude sensitive data)
  toJSON() {
    return {
      id: this.id,
      username: this.username,
      isAdmin: this.isAdmin,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export default User;