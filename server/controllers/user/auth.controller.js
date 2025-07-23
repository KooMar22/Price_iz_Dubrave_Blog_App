import { validationResult } from "express-validator";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import User from "../../models/User.js";
import CustomError from "../../config/errors/CustomError.js";
import AuthorizationError from "../../config/errors/AuthorizationError.js";
import { parseJWTExpiry } from "../../utils/time.js";
import {
  sendPasswordResetEmail,
  sendPasswordResetConfirmationEmail,
} from "../../services/email.service.js";

const prisma = new PrismaClient();

// Top-level constants
const REFRESH_TOKEN = {
  secret: process.env.AUTH_REFRESH_TOKEN_SECRET,
  cookie: {
    name: "refreshTkn",
    options: {
      sameSite: "None",
      secure: true,
      httpOnly: true,
      maxAge: parseJWTExpiry(process.env.AUTH_REFRESH_TOKEN_EXPIRY),
      partitioned: true,
    },
  },
};

const ACCESS_TOKEN = {
  secret: process.env.AUTH_ACCESS_TOKEN_SECRET,
  cookie: {
    name: "accessToken",
    options: {
      sameSite: "None",
      secure: true,
      httpOnly: true,
      maxAge: parseJWTExpiry(process.env.AUTH_ACCESS_TOKEN_EXPIRY),
      partitioned: true,
    },
  },
};

/*
  1. LOGIN USER
*/
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new CustomError(errors.array(), 422, errors.array()[0]?.msg);
    }

    const { username, password } = req.body;
    const user = await User.findByCredentials(username, password);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Save refresh token to database
    await user.saveRefreshToken(refreshToken);

    // Set refresh token cookie
    res.cookie(
      REFRESH_TOKEN.cookie.name,
      refreshToken,
      REFRESH_TOKEN.cookie.options
    );

    // Set access token cookie
    res.cookie(
      ACCESS_TOKEN.cookie.name,
      accessToken,
      ACCESS_TOKEN.cookie.options
    );

    // Send response on successful login
    res.json({
      success: true,
      user: user.toJSON(),
      accessToken,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/*
  2. REGISTER USER 
*/
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new CustomError(errors.array(), 422, errors.array()[0].msg);
    }

    const { username, email, password } = req.body;
    const newUser = await User.create({ username, email, password });
    const accessToken = newUser.generateAccessToken();
    const refreshToken = newUser.generateRefreshToken();

    // Save refresh token to database
    await newUser.saveRefreshToken(refreshToken);

    // Set refresh token cookie
    res.cookie(
      REFRESH_TOKEN.cookie.name,
      refreshToken,
      REFRESH_TOKEN.cookie.options
    );

    // Set access token cookie
    res.cookie(
      ACCESS_TOKEN.cookie.name,
      accessToken,
      ACCESS_TOKEN.cookie.options
    );

    // Send response on successful register
    res.status(201).json({
      success: true,
      user: newUser.toJSON(),
      accessToken,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/*
  3. LOGOUT USER
*/
const logout = async (req, res, next) => {
  try {
    const cookies = req.cookies;
    const refreshToken = cookies[REFRESH_TOKEN.cookie.name];

    if (refreshToken) {
      // Create a refresh token hash
      const rTknHash = crypto
        .createHmac("sha256", REFRESH_TOKEN.secret)
        .update(refreshToken)
        .digest("hex");

      // Remove the specific refresh token
      await User.removeRefreshToken(rTknHash);
    }

    // Set cookie expiry option to past date so it is destroyed
    const expireCookieOptions = {
      expires: new Date(1),
      sameSite: "None",
      secure: true,
      httpOnly: true,
    };

    // Destroy both cookies
    res.cookie(REFRESH_TOKEN.cookie.name, "", expireCookieOptions);
    res.cookie(ACCESS_TOKEN.cookie.name, "", expireCookieOptions);

    res.status(205).json({
      success: true,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/*
  4. LOGOUT USER FROM ALL DEVICES
*/
const logoutAllDevices = async (req, res, next) => {
  try {
    const userId = req.userId;

    // Remove all refresh tokens for this user
    await prisma.refreshToken.deleteMany({
      where: { userId: parseInt(userId) },
    });

    // Set cookie expiry to past date to mark for destruction
    const expireCookieOptions = {
      expires: new Date(1),
      sameSite: "None",
      secure: true,
      httpOnly: true,
    };

    // Destroy both cookies
    res.cookie(REFRESH_TOKEN.cookie.name, "", expireCookieOptions);
    res.cookie(ACCESS_TOKEN.cookie.name, "", expireCookieOptions);

    res.status(205).json({
      success: true,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/*
  5. REGENERATE NEW ACCESS TOKEN
*/
const refreshAccessToken = async (req, res, next) => {
  try {
    const cookies = req.cookies;
    const refreshToken = cookies[REFRESH_TOKEN.cookie.name];

    if (!refreshToken) {
      throw new AuthorizationError(
        "Authentication error!",
        undefined,
        "You are unauthenticated",
        {
          realm: "Obtain new Access Token",
          error: "no_rft",
          error_description: "Refresh Token is missing!",
        }
      );
    }

    // Verify and find user with this refresh token
    const user = await User.verifyRefreshToken(refreshToken);

    // GENERATE NEW ACCESS TOKEN
    const newAccessToken = user.generateAccessToken();

    // Set new access token cookie
    res.cookie(
      ACCESS_TOKEN.cookie.name,
      newAccessToken,
      ACCESS_TOKEN.cookie.options
    );

    res.status(201);
    res.set({ "Cache-Control": "no-store", Pragma: "no-cache" });

    // Send response with NEW accessToken
    res.json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    if (error?.name === "JsonWebTokenError") {
      next(
        new AuthorizationError(error, undefined, "You are unauthenticated", {
          realm: "Obtain new Access Token",
          error_description: "token error",
        })
      );
      return;
    }
    next(error);
  }
};

/*
  6. FORGOT PASSWORD - Request Reset
*/
const forgotPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new CustomError(errors.array(), 422, errors.array()[0]?.msg);
    }

    const { email } = req.body;

    // Generate reset token
    const result = await User.generateResetToken(email);

    // Always return success to prevent email enumeration
    if (result) {
      // Send reset email
      try {
        await sendPasswordResetEmail(
          result.user.email,
          result.token,
          result.user.username
        );
      } catch (emailError) {
        console.error("Failed to send reset email:", emailError);
      }
    }

    // Always return the same response
    res.json({
      success: true,
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/*
  7. RESET PASSWORD - Confirm Reset
*/
const resetPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new CustomError(errors.array(), 422, errors.array()[0]?.msg);
    }

    const { token, password } = req.body;

    // Reset password
    const user = await User.resetPassword(token, password);

    // Send confirmation email
    try {
      await sendPasswordResetConfirmationEmail(user.email, user.username);
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      message:
        "Your password has been successfully reset. You can now log in with your new password.",
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export {
  login,
  register,
  logout,
  logoutAllDevices,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
};