import {
  login,
  register,
  logout,
  logoutAllDevices,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
} from "./auth.controller.js";
import { fetchUserProfile, fetchAuthUserProfile } from "./user.controller.js";

export {
  login,
  register,
  logout,
  logoutAllDevices,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  fetchUserProfile,
  fetchAuthUserProfile,
};