import { Router } from "express";
import {
  requireAuthentication,
  requireAdmin,
} from "../middlewares/authCheck.js";
import {
  createCommentValidator,
  updateCommentValidator,
  commentIdValidator,
  commentPostIdValidator,
} from "../validators/index.js";
import {
  getPostComments,
  createComment,
  updateComment,
  deleteComment,
  getAllComments,
} from "../controllers/comment/index.js";

const router = Router();

// Get all comments for a specific post (public for published posts)
router.get("/post/:postId", commentPostIdValidator, getPostComments);

// Protected routes (require authentication)
router.post(
  "/post/:postId",
  requireAuthentication,
  createCommentValidator,
  createComment
);
router.put(
  "/:id",
  requireAuthentication,
  updateCommentValidator,
  updateComment
);
router.delete("/:id", requireAuthentication, commentIdValidator, deleteComment);

// Admin only routes
router.get("/admin/all", requireAuthentication, requireAdmin, getAllComments);

export default router;