import { Router } from "express";
import { requireAuthentication } from "../middlewares/authCheck.js";
import {
  loginValidator,
  registerValidator,
  fetchUserProfileValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from "../validators/index.js";
import {
  login,
  register,
  logout,
  logoutAllDevices,
  refreshAccessToken,
  fetchUserProfile,
  fetchAuthUserProfile,
  forgotPassword,
  resetPassword,
} from "../controllers/user/index.js";

const router = Router();

// Auth routes
router.post("/login", loginValidator, login);
router.post("/register", registerValidator, register);
router.post("/logout", requireAuthentication, logout);
router.post("/master-logout", requireAuthentication, logoutAllDevices);
router.post("/reauth", refreshAccessToken);

// Password reset routes
router.post("/forgot-password", forgotPasswordValidator, forgotPassword);
router.post("/reset-password", resetPasswordValidator, resetPassword);

// User profile routes
router.get("/me", requireAuthentication, fetchAuthUserProfile);
router.get(
  "/:id",
  requireAuthentication,
  fetchUserProfileValidator,
  fetchUserProfile
);

export default router;