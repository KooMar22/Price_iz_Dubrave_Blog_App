import { validationResult } from "express-validator";
import { PrismaClient } from "@prisma/client";
import CustomError from "../../config/errors/CustomError.js";

const prisma = new PrismaClient();

/*
  1. GET ALL PUBLISHED POSTS (Public)
*/
const getAllPublishedPosts = async (req, res, next) => {
  try {
    const posts = await prisma.post.findMany({
      where: { isPosted: true },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      posts,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/*
  2. GET ALL POSTS (Admin only - includes unpublished)
*/
const getAllPosts = async (req, res, next) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      posts,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/*
  3. GET SINGLE POST
*/
const getPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const post = await prisma.post.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!post) {
      throw new CustomError(
        "Post not found",
        404,
        "The requested post does not exist"
      );
    }

    // If post is not published, only allow access to author or admin
    if (!post.isPosted && req.userId !== post.userId && !req.isAdmin) {
      throw new CustomError(
        "Post not found",
        404,
        "The requested post does not exist"
      );
    }

    res.json({
      success: true,
      post,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/*
  4. CREATE POST (Authenticated users only)
*/
const createPost = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new CustomError(errors.array(), 422, errors.array()[0]?.msg);
    }

    const { title, content, isPosted = false } = req.body;
    const userId = req.userId;

    const post = await prisma.post.create({
      data: {
        title,
        content,
        isPosted,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      post,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/*
  5. UPDATE POST (Author or Admin only)
*/
const updatePost = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new CustomError(errors.array(), 422, errors.array()[0]?.msg);
    }

    const { id } = req.params;
    const userId = req.userId;
    const isAdmin = req.isAdmin;

    // Find the post
    const existingPost = await prisma.post.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingPost) {
      throw new CustomError(
        "Post not found",
        404,
        "The requested post does not exist"
      );
    }

    // Check if user can update this post
    if (existingPost.userId !== userId && !isAdmin) {
      throw new CustomError(
        "Unauthorized",
        403,
        "You can only update your own posts"
      );
    }

    const { title, content, isPosted } = req.body;
    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (isPosted !== undefined) updateData.isPosted = isPosted;

    const updatedPost = await prisma.post.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    res.json({
      success: true,
      post: updatedPost,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/*
  6. DELETE POST (Author or Admin only)
*/
const deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const isAdmin = req.isAdmin;

    // Find the post
    const existingPost = await prisma.post.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingPost) {
      throw new CustomError(
        "Post not found",
        404,
        "The requested post does not exist"
      );
    }

    // Check if user can delete this post
    if (existingPost.userId !== userId && !isAdmin) {
      throw new CustomError(
        "Unauthorized",
        403,
        "You can only delete your own posts"
      );
    }

    await prisma.post.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/*
  7. TOGGLE POST PUBLICATION STATUS (Author or Admin only)
*/
const togglePostStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const isAdmin = req.isAdmin;

    // Find the post
    const existingPost = await prisma.post.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingPost) {
      throw new CustomError(
        "Post not found",
        404,
        "The requested post does not exist"
      );
    }

    // Check if user can update this post
    if (existingPost.userId !== userId && !isAdmin) {
      throw new CustomError(
        "Unauthorized",
        403,
        "You can only update your own posts"
      );
    }

    const updatedPost = await prisma.post.update({
      where: { id: parseInt(id) },
      data: { isPosted: !existingPost.isPosted },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    res.json({
      success: true,
      post: updatedPost,
      message: `Post ${
        updatedPost.isPosted ? "published" : "unpublished"
      } successfully`,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export {
  getAllPublishedPosts,
  getAllPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  togglePostStatus,
};