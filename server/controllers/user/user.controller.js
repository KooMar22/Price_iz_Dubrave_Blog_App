import { validationResult } from "express-validator";
import CustomError from "../../config/errors/CustomError.js";
import User from "../../models/User.js";

/* 
  1. FETCH USER PROFILE BY ID
*/
const fetchUserProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new CustomError(errors.array(), 422, errors.array()[0]?.msg);
    }

    const userId = req.params.id;
    const retrievedUser = await User.findById(userId);

    if (!retrievedUser) {
      throw new CustomError(
        "User not found",
        404,
        "The requested user does not exist"
      );
    }

    res.json({
      success: true,
      user: retrievedUser.toJSON(),
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/* 
  2. FETCH PROFILE OF AUTHENTICATED USER
*/
const fetchAuthUserProfile = async (req, res, next) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user) {
      throw new CustomError(
        "User not found",
        404,
        "Your user account was not found"
      );
    }

    res.json({
      success: true,
      user: user.toJSON(),
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export { fetchUserProfile, fetchAuthUserProfile };