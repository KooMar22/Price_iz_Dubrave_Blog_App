const AUTH_CONFIG = {
  // Token expiry times 
  ACCESS_TOKEN_EXPIRY_MINUTES: 20,
  REFRESH_TOKEN_EXPIRY_DAYS: 1,
  USER_COOKIE_EXPIRY_DAYS: 1,

  // Cookie settings
  COOKIE_SETTINGS: {
    sameSite: "None",
    secure: true,
    path: "/",
  },

  // Helper functions
  getAccessTokenExpiryInDays() {
    return this.ACCESS_TOKEN_EXPIRY_MINUTES / (24 * 60);
  },

  getRefreshTokenExpiryInDays() {
    return this.REFRESH_TOKEN_EXPIRY_DAYS;
  },

  getUserCookieExpiryInDays() {
    return this.USER_COOKIE_EXPIRY_DAYS;
  },
};

export { AUTH_CONFIG };