import {
  login,
  register,
  logout,
  logoutAllDevices,
  refreshAccessToken,
} from "./auth.controller.js";
import { fetchUserProfile, fetchAuthUserProfile } from "./user.controller.js";

export {
  login,
  register,
  logout,
  logoutAllDevices,
  refreshAccessToken,
  fetchUserProfile,
  fetchAuthUserProfile,
};