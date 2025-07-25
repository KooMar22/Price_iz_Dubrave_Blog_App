class CustomError extends Error {
  /**
   * Custom Error Constructor
   * @param {any} [message] - Optional error payload
   * @param {number} [statusCode] - Optional error http status code
   * @param {string} [feedback=""] - Optional feedback message
   */
  constructor(message, statusCode, feedback = "") {
    super(message);
    this.name = "CustomError";
    this.status = statusCode;
    this.cause = message;
    this.feedback = String(feedback);
  }
}

export default CustomError;