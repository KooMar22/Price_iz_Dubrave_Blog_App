import { body, param } from "express-validator";

// Validation for creating a comment
const createCommentValidator = [
  param("postId").isInt({ min: 1 }).withMessage("Valid post ID is required"),

  body("content")
    .exists()
    .withMessage("Content is required")
    .isString()
    .withMessage("Content must be a string")
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage("Comment content must be between 1 and 1000 characters"),
];

// Validation for updating a comment
const updateCommentValidator = [
  param("id").isInt({ min: 1 }).withMessage("Valid comment ID is required"),

  body("content")
    .exists()
    .withMessage("Content is required")
    .isString()
    .withMessage("Content must be a string")
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage("Comment content must be between 1 and 1000 characters"),
];

// Validation for comment ID parameter
const commentIdValidator = [
  param("id").isInt({ min: 1 }).withMessage("Valid comment ID is required"),
];

// Validation for post ID parameter
const postIdValidator = [
  param("postId").isInt({ min: 1 }).withMessage("Valid post ID is required"),
];

export {
  createCommentValidator,
  updateCommentValidator,
  commentIdValidator,
  postIdValidator,
};