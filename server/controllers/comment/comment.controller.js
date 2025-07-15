import { validationResult } from "express-validator";
import { PrismaClient } from "@prisma/client";
import CustomError from "../../config/errors/CustomError.js";

const prisma = new PrismaClient();

/*
  1. GET ALL COMMENTS FOR A POST
*/
const getPostComments = async (req, res, next) => {
  try {
    const { postId } = req.params;

    // Check if post exists and is published (unless user is admin or author)
    const post = await prisma.post.findUnique({
      where: { id: parseInt(postId) },
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

    const comments = await prisma.comment.findMany({
      where: { postId: parseInt(postId) },
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
    });

    res.json({
      success: true,
      comments,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/*
  2. CREATE COMMENT (Authenticated users only)
*/
const createComment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new CustomError(errors.array(), 422, errors.array()[0]?.msg);
    }

    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    // Additional content check
    if (
      !content ||
      typeof content !== "string" ||
      content.trim().length === 0
    ) {
      throw new CustomError(
        "Invalid content",
        400,
        "Comment content is required and cannot be empty"
      );
    }

    // Check if post exists and is published
    const post = await prisma.post.findUnique({
      where: { id: parseInt(postId) },
    });

    if (!post) {
      throw new CustomError(
        "Post not found",
        404,
        "The requested post does not exist"
      );
    }

    if (!post.isPosted) {
      throw new CustomError(
        "Post not available",
        400,
        "Cannot comment on unpublished posts"
      );
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        userId,
        postId: parseInt(postId),
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
      comment,
    });
  } catch (error) {
    console.log(`Create comment error: ${error}`);
    next(error);
  }
};

/*
  3. UPDATE COMMENT (Comment author or Admin only)
*/
const updateComment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new CustomError(errors.array(), 422, errors.array()[0]?.msg);
    }

    const { id } = req.params;
    const { content } = req.body;
    const userId = req.userId;
    const isAdmin = req.isAdmin;

    // Find the comment
    const existingComment = await prisma.comment.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingComment) {
      throw new CustomError(
        "Comment not found",
        404,
        "The requested comment does not exist"
      );
    }

    // Check if user can update this comment
    if (existingComment.userId !== userId && !isAdmin) {
      throw new CustomError(
        "Unauthorized",
        403,
        "You can only update your own comments"
      );
    }

    const updatedComment = await prisma.comment.update({
      where: { id: parseInt(id) },
      data: { content: content.trim() },
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
      comment: updatedComment,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/*
  4. DELETE COMMENT (Comment author, Post author, or Admin only)
*/
const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const isAdmin = req.isAdmin;

    // Find the comment with post info
    const existingComment = await prisma.comment.findUnique({
      where: { id: parseInt(id) },
      include: {
        post: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!existingComment) {
      throw new CustomError(
        "Comment not found",
        404,
        "The requested comment does not exist"
      );
    }

    // Check if user can delete this comment
    // Can delete if: comment author, post author, or admin
    const canDelete =
      existingComment.userId === userId || // Comment author
      existingComment.post.userId === userId || // Post author
      isAdmin; // Admin

    if (!canDelete) {
      throw new CustomError(
        "Unauthorized",
        403,
        "You don't have permission to delete this comment"
      );
    }

    await prisma.comment.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/*
  5. GET ALL COMMENTS (Admin only - for moderation)
*/
const getAllComments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const comments = await prisma.comment.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: parseInt(skip),
      take: parseInt(limit),
    });

    const totalComments = await prisma.comment.count();

    res.json({
      success: true,
      comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalComments,
        pages: Math.ceil(totalComments / limit),
      },
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export {
  getPostComments,
  createComment,
  updateComment,
  deleteComment,
  getAllComments,
};