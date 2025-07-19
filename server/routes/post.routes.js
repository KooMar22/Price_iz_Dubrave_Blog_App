import { Router } from "express";
import {
  requireAuthentication,
  requireAdmin,
} from "../middlewares/authCheck.js";
import {
  createPostValidator,
  updatePostValidator,
  postIdValidator,
} from "../validators/index.js";
import {
  getAllPublishedPosts,
  getAllPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  togglePostStatus,
  getUserPosts,
  getMyPosts,
} from "../controllers/post/index.js";

const router = Router();

// Public routes
router.get("/", getAllPublishedPosts);
router.get("/:id", postIdValidator, getPost);

// Protected routes (require authentication)
router.get("/my/posts", requireAuthentication, getMyPosts);
router.get("/user/:userId/posts", requireAuthentication, getUserPosts); 
router.post("/", requireAuthentication, createPostValidator, createPost);
router.put("/:id", requireAuthentication, updatePostValidator, updatePost);
router.delete("/:id", requireAuthentication, postIdValidator, deletePost);
router.patch(
  "/:id/toggle",
  requireAuthentication,
  postIdValidator,
  togglePostStatus
);

// Admin only routes
router.get("/admin/all", requireAuthentication, requireAdmin, getAllPosts);

export default router;