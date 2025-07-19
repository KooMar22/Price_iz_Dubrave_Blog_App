import { createContext, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import authAPI from "../api/authAPI";
import { AUTH_CONFIG } from "../config/auth.js";

const AuthContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider!");
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Helper function to get cookie value
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  };

  // Helper function to set cookie
  const setCookie = (name, value, days = 1) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    const cookieString = `${name}=${value};expires=${expires.toUTCString()};path=${
      AUTH_CONFIG.COOKIE_SETTINGS.path
    };SameSite=${AUTH_CONFIG.COOKIE_SETTINGS.sameSite};${
      AUTH_CONFIG.COOKIE_SETTINGS.secure ? "Secure" : ""
    }`;
    document.cookie = cookieString;
  };

  // Helper function to delete cookie
  const deleteCookie = (name) => {
    const cookieString = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=${
      AUTH_CONFIG.COOKIE_SETTINGS.path
    };SameSite=${AUTH_CONFIG.COOKIE_SETTINGS.sameSite};${
      AUTH_CONFIG.COOKIE_SETTINGS.secure ? "Secure" : ""
    }`;
    document.cookie = cookieString;
  };

  // Check if user is authenticated on app start
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedUser = getCookie("user");
        const accessToken = authAPI.getAccessToken();

        if (!savedUser && !accessToken) {
          // No saved auth data, user is not logged in
          setLoading(false);
          return;
        }

        // First, try to refresh the token to ensure we have a valid one
        const refreshResult = await authAPI.refreshToken();

        if (refreshResult.success) {
          // Token refreshed successfully, now get current user data
          const userResult = await authAPI.getCurrentUser();

          if (userResult.success) {
            const userData = userResult.data.user;
            // Update the user cookie with fresh data
            setCookie(
              "user",
              encodeURIComponent(JSON.stringify(userData)),
              AUTH_CONFIG.getUserCookieExpiryInDays()
            );
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            // Couldn't get user data despite valid token
            console.error("Failed to fetch user data");
            deleteCookie("user");
            authAPI.setAccessToken(null);
          }
        } else {
          // Refresh token is invalid or expired
          console.log("Session expired, please log in again");
          deleteCookie("user");
          authAPI.setAccessToken(null);
        }
      } catch (error) {
        console.error(`Auth check error: ${error}`);
        deleteCookie("user");
        authAPI.setAccessToken(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Register
  const register = async (username, email, password) => {
    try {
      const result = await authAPI.register(username, email, password);

      if (result.success) {
        const { user } = result.data;

        // Save user data in cookie
        setCookie(
          "user",
          encodeURIComponent(JSON.stringify(user)),
          AUTH_CONFIG.getUserCookieExpiryInDays()
        );
        setUser(user);
        setIsAuthenticated(true);

        return {
          success: true,
          message: "Registration successful",
        };
      }

      return {
        success: false,
        message: result.error,
      };
    } catch (error) {
      console.error(`Registration error: ${error}`);
      return {
        success: false,
        message: "Registration failed. Please try again.",
      };
    }
  };

  // Login
  const login = async (username, password) => {
    try {
      const result = await authAPI.login(username, password);

      if (result.success) {
        const { user } = result.data;

        // Save user data in cookie
        setCookie(
          "user",
          encodeURIComponent(JSON.stringify(user)),
          AUTH_CONFIG.getUserCookieExpiryInDays()
        );
        setUser(user);
        setIsAuthenticated(true);

        return { success: true };
      }

      return {
        success: false,
        message: result.error,
      };
    } catch (error) {
      console.error(`Login error: ${error}`);
      return {
        success: false,
        message: "Login failed. Please try again.",
      };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error(`Logout error: ${error}`);
    } finally {
      // Clear data regardless of API result
      deleteCookie("user");
      authAPI.setAccessToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Refresh user data (useful for updating user info after profile changes)
  const refreshUserData = async () => {
    try {
      const result = await authAPI.getCurrentUser();
      if (result.success) {
        const userData = result.data.user;
        setCookie(
          "user",
          encodeURIComponent(JSON.stringify(userData)),
          AUTH_CONFIG.getUserCookieExpiryInDays()
        );
        setUser(userData);
        return { success: true };
      }
      return { success: false, message: result.error };
    } catch (error) {
      console.error(`Refresh user data error: ${error}`);
      return { success: false, message: "Failed to refresh user data" };
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    register,
    login,
    logout,
    refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export { useAuth, AuthProvider };