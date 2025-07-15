import { body } from "express-validator";
import User from "../models/User.js";

const loginValidator = [
  body("username").trim().notEmpty().withMessage("Username can't be empty"),

  body("password").notEmpty().withMessage("Password can't be empty"),
];

const registerValidator = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username can't be empty")
    .bail()
    .isAlphanumeric()
    .withMessage("Username may contain only letters and numbers")
    .bail()
    .custom(async (username) => {
      // Finding if user exists in database
      const userExists = await User.findByUsername(username);
      if (userExists) {
        throw new Error("Sorry, this username already exists");
      }
    }),

  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password can't be empty")
    .bail()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .bail()
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage("Password must contain at least one letter and one number"),
];

export { loginValidator, registerValidator };