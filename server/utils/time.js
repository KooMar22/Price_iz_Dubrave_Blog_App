/**
 * Parse JWT expiry string in milliseconds
 * @param {string} expiryString 
 * @returns {number} 
 */
export function parseJWTExpiry(expiryString) {
  if (!expiryString) {
    throw new Error("Expiry string is required");
  }

  const value = parseInt(expiryString.slice(0, -1));
  const unit = expiryString.slice(-1);

  switch (unit) {
    case "s": // seconds
      return value * 1000;
    case "m": // minutes
      return value * 60 * 1000;
    case "h": // hours
      return value * 60 * 60 * 1000;
    case "d": // days
      return value * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Unknown time unit: ${unit}. Use 's', 'm', 'h', or 'd'`);
  }
}

/**
 * Parse JWT expiry string in seconds
 * @param {string} expiryString 
 * @returns {number} 
 */
export function parseJWTExpiryToSeconds(expiryString) {
  return parseJWTExpiry(expiryString) / 1000;
}
