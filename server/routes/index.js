import { Router } from "express";
import userRoutes from "./user.routes.js";
import postRoutes from "./post.routes.js";
import commentRoutes from "./comment.routes.js";

const router = Router();

// All main routes
router.use("/users", userRoutes);
router.use("/posts", postRoutes);
router.use("/comments", commentRoutes);


export default router;