const API_URL = import.meta.env.VITE_API_URL;
import { AUTH_CONFIG } from "../config/auth.js";

class AuthAPI {
  // Helper method for getting cookies
  getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  }

  // Helper method for setting cookies
  setCookie(name, value, days = 1) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    const cookieString = `${name}=${value};expires=${expires.toUTCString()};path=${
      AUTH_CONFIG.COOKIE_SETTINGS.path
    };SameSite=${AUTH_CONFIG.COOKIE_SETTINGS.sameSite};${
      AUTH_CONFIG.COOKIE_SETTINGS.secure ? "Secure" : ""
    }`;
    document.cookie = cookieString;
  }

  // Helper method for deleting cookies
  deleteCookie(name) {
    const cookieString = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=${
      AUTH_CONFIG.COOKIE_SETTINGS.path
    };SameSite=${AUTH_CONFIG.COOKIE_SETTINGS.sameSite};${
      AUTH_CONFIG.COOKIE_SETTINGS.secure ? "Secure" : ""
    }`;
    document.cookie = cookieString;
  }

  // Helper method for making requests
  async makeRequest(endpoint, options = {}) {
    try {
      // Properly merge headers with defaults
      const headers = {
        "Content-Type": "application/json",
        ...options.headers,
      };

      const response = await fetch(`${API_URL}${endpoint}`, {
        credentials: "include", // Include cookies for refresh tokens
        headers,
        ...options,
      });

      // Check if response is ok first
      if (!response.ok) {
        // Try to parse error response, but handle if it's not JSON
        let errorData;
        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
          try {
            errorData = await response.json();
          } catch (parseError) {
            console.error(
              `Failed to parse error response as JSON: ${parseError}`
            );
            errorData = {
              error: `HTTP ${response.status}: ${response.statusText}`,
            };
          }
        } else {
          // Not JSON response, probably HTML error page
          const textResponse = await response.text();
          console.error(`Non-JSON error response: ${textResponse}`);
          errorData = {
            error: `HTTP ${response.status}: ${response.statusText}`,
            details: textResponse.substring(0, 200),
          };
        }

        return {
          success: false,
          error:
            errorData.feedback || errorData.error || `HTTP ${response.status}`,
          status: response.status,
        };
      }

      // Try to parse successful response
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        return {
          success: true,
          data,
        };
      } else {
        // Successful but not JSON
        const textResponse = await response.text();
        console.warn(`Non-JSON successful response: ${textResponse}`);
        return {
          success: true,
          data: { message: textResponse },
        };
      }
    } catch (error) {
      console.error(`API Error: ${error}`);
      return {
        success: false,
        error: "Network error occurred",
      };
    }
  }

  // Get access token from cookies
  getAccessToken() {
    return this.getCookie("accessToken");
  }

  // Set access token in cookies
  setAccessToken(token) {
    if (token) {
      // Use config for expiry time
      this.setCookie(
        "accessToken",
        token,
        AUTH_CONFIG.getAccessTokenExpiryInDays()
      );
    } else {
      this.deleteCookie("accessToken");
    }
  }

  // Make authenticated request with automatic token refresh
  async makeAuthenticatedRequest(endpoint, options = {}) {
    const token = this.getAccessToken();

    // Properly merge headers
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    // First attempt
    let result = await this.makeRequest(endpoint, {
      ...options,
      headers,
    });

    // If unauthorized (401) and we have a refresh token cookie, try to refresh
    if (result.status === 401 && !options._isRetry) {
      console.log("Token expired, attempting refresh...");

      const refreshResult = await this.refreshToken();

      if (refreshResult.success) {
        console.log("Token refreshed successfully, retrying request...");

        // Update headers with new token
        const newHeaders = {
          ...headers,
          Authorization: `Bearer ${refreshResult.data.accessToken}`,
        };

        // Retry the original request with new token
        result = await this.makeRequest(endpoint, {
          ...options,
          headers: newHeaders,
          _isRetry: true, // Prevent infinite retry loop
        });
      } else {
        console.log("Token refresh failed, user needs to log in again");
        this.setAccessToken(null);
      }
    }

    return result;
  }

  // Register user
  async register(username, email, password) {
    const result = await this.makeRequest("/users/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });

    if (result.success && result.data.accessToken) {
      this.setAccessToken(result.data.accessToken);
    }

    return result;
  }

  // Login user
  async login(username, password) {
    const result = await this.makeRequest("/users/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    if (result.success && result.data.accessToken) {
      this.setAccessToken(result.data.accessToken);
    }

    return result;
  }

  // Logout user
  async logout() {
    const result = await this.makeAuthenticatedRequest("/users/logout", {
      method: "POST",
    });

    // Clear token regardless of result
    this.setAccessToken(null);

    return result;
  }

  // Refresh access token
  async refreshToken() {
    const result = await this.makeRequest("/users/reauth", {
      method: "POST",
    });

    if (result.success && result.data.accessToken) {
      this.setAccessToken(result.data.accessToken);
    }

    return result;
  }

  // Forgot password - request reset link
  async forgotPassword(email) {
    return this.makeRequest("/users/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  // Reset password with token
  async resetPassword(token, password, confirmPassword) {
    return this.makeRequest("/users/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password, confirmPassword }),
    });
  }

  // Get current user profile
  async getCurrentUser() {
    return this.makeAuthenticatedRequest("/users/me");
  }

  // Get all published posts (public)
  async getPublishedPosts() {
    return this.makeRequest("/posts");
  }

  // Get all posts (admin only)
  async getAllPosts() {
    return this.makeAuthenticatedRequest("/posts/admin/all");
  }

  // Get single post
  async getPost(postId) {
    // Try authenticated request first if user is logged in
    const token = this.getAccessToken();
    if (token) {
      return this.makeAuthenticatedRequest(`/posts/${postId}`);
    }
    // Otherwise make public request
    return this.makeRequest(`/posts/${postId}`);
  }

  // Get current user's posts (including drafts)
  async getMyPosts() {
    return this.makeAuthenticatedRequest("/posts/my/posts");
  }

  // Get specific user's posts
  async getUserPosts(userId) {
    return this.makeAuthenticatedRequest(`/posts/user/${userId}/posts`);
  }

  // Create post
  async createPost(postData) {
    return this.makeAuthenticatedRequest("/posts", {
      method: "POST",
      body: JSON.stringify(postData),
    });
  }

  // Update post
  async updatePost(postId, postData) {
    return this.makeAuthenticatedRequest(`/posts/${postId}`, {
      method: "PUT",
      body: JSON.stringify(postData),
    });
  }

  // Delete post
  async deletePost(postId) {
    return this.makeAuthenticatedRequest(`/posts/${postId}`, {
      method: "DELETE",
    });
  }

  // Toggle post status
  async togglePostStatus(postId) {
    return this.makeAuthenticatedRequest(`/posts/${postId}/toggle`, {
      method: "PATCH",
    });
  }

  // Get comments for a post
  async getPostComments(postId) {
    return this.makeRequest(`/comments/post/${postId}`);
  }

  // Create comment
  async createComment(postId, content) {
    return this.makeAuthenticatedRequest(`/comments/post/${postId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });
  }

  // Update comment
  async updateComment(commentId, content) {
    return this.makeAuthenticatedRequest(`/comments/${commentId}`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    });
  }

  // Delete comment
  async deleteComment(commentId) {
    return this.makeAuthenticatedRequest(`/comments/${commentId}`, {
      method: "DELETE",
    });
  }

  // Get all comments (admin only)
  async getAllComments(page = 1, limit = 20) {
    return this.makeAuthenticatedRequest(
      `/comments/admin/all?page=${page}&limit=${limit}`
    );
  }
}

const authAPI = new AuthAPI();
export default authAPI;