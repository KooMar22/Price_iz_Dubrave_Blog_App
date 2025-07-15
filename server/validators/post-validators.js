import { body, param } from "express-validator";

// Validation rules for post creation
const createPostValidator = [
  body("title")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Title is required and must be between 1 and 200 characters"),

  body("content")
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage(
      "Content is required and must be between 1 and 5000 characters"
    ),

  body("isPosted")
    .optional()
    .isBoolean()
    .withMessage("isPosted must be a boolean value"),
];

// Validation rules for post update
const updatePostValidator = [
  param("id").isInt({ min: 1 }).withMessage("Valid post ID is required"),

  body("title")
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Title must be between 1 and 200 characters"),

  body("content")
    .optional()
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage("Content must be between 1 and 5000 characters"),

  body("isPosted")
    .optional()
    .isBoolean()
    .withMessage("isPosted must be a boolean value"),
];

// Validation for post ID parameter
const postIdValidator = [
  param("id").isInt({ min: 1 }).withMessage("Valid post ID is required"),
];

export { createPostValidator, updatePostValidator, postIdValidator };