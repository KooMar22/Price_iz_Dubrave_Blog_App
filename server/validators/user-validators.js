import { param } from "express-validator";

const fetchUserProfileValidator = [
  param("id").isInt({ min: 1 }).withMessage("Valid user ID is required"),
];

export { fetchUserProfileValidator };