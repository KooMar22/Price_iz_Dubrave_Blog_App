import { Router } from "express";
import { requireAuthentication } from "../middlewares/authCheck.js";
import {
  loginValidator,
  registerValidator,
  fetchUserProfileValidator,
} from "../validators/index.js";
import {
  login,
  register,
  logout,
  logoutAllDevices,
  refreshAccessToken,
  fetchUserProfile,
  fetchAuthUserProfile,
} from "../controllers/user/index.js";

const router = Router();

// Auth routes
router.post("/login", loginValidator, login);
router.post("/register", registerValidator, register);
router.post("/logout", requireAuthentication, logout);
router.post("/master-logout", requireAuthentication, logoutAllDevices);
router.post("/reauth", refreshAccessToken);

// User profile routes
router.get("/me", requireAuthentication, fetchAuthUserProfile);
router.get(
  "/:id",
  requireAuthentication,
  fetchUserProfileValidator,
  fetchUserProfile
);

export default router;