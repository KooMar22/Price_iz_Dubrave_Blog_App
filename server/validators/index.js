import { loginValidator, registerValidator } from "./auth-validators.js";
import { fetchUserProfileValidator } from "./user-validators.js";
import {
  createPostValidator,
  updatePostValidator,
  postIdValidator,
} from "./post-validators.js";
import {
  createCommentValidator,
  updateCommentValidator,
  commentIdValidator,
  postIdValidator as commentPostIdValidator,
} from "./comment-validators.js";

export {
  loginValidator,
  registerValidator,
  fetchUserProfileValidator,
  createPostValidator,
  updatePostValidator,
  postIdValidator,
  createCommentValidator,
  updateCommentValidator,
  commentIdValidator,
  commentPostIdValidator,
};
