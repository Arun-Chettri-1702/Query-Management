// controllers/comment.controller.js
import asyncHandler from "express-async-handler";
import {
    createQuestionComment,
    createAnswerComment,
    getQuestionComments,
    getAnswerComments,
    findCommentById,
    updateCommentSQL,
    deleteCommentSQL,
} from "../models/comment.model.js";

/* -------------------------------------------------------
   CREATE COMMENT
------------------------------------------------------- */
export const createComment = asyncHandler(async (req, res) => {
    const { body } = req.body;
    const { questionId, answerId } = req.params;

    if (!body?.trim()) {
        res.status(400);
        throw new Error("Comment body cannot be empty");
    }

    let commentId;

    if (questionId) {
        commentId = await createQuestionComment({
            body: body.trim(),
            authorId: req.user.id,
            questionId,
        });
    } else if (answerId) {
        commentId = await createAnswerComment({
            body: body.trim(),
            authorId: req.user.id,
            answerId,
        });
    } else {
        res.status(400);
        throw new Error("Invalid route: no parent specified.");
    }

    // fetch normalized comment
    const comment = await findCommentById(commentId);

    res.status(201).json({
        message: "Comment created successfully",
        comment,
    });
});

/* -------------------------------------------------------
   GET COMMENTS (Question or Answer)
------------------------------------------------------- */
export const getCommentsForParent = asyncHandler(async (req, res) => {
    const { questionId, answerId } = req.params;

    let comments;

    if (questionId) {
        comments = await getQuestionComments(questionId);
    } else if (answerId) {
        comments = await getAnswerComments(answerId);
    } else {
        res.status(400);
        throw new Error("No questionId or answerId provided.");
    }

    res.status(200).json({
        count: comments.length,
        comments,
    });
});

/* -------------------------------------------------------
   UPDATE COMMENT
------------------------------------------------------- */
export const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { body } = req.body;

    if (!body?.trim()) {
        res.status(400);
        throw new Error("Comment body cannot be empty");
    }

    const comment = await findCommentById(commentId);

    if (!comment) {
        res.status(404);
        throw new Error("Comment not found");
    }

    if (comment.author_id !== req.user.id) {
        res.status(403);
        throw new Error("Not authorized");
    }

    await updateCommentSQL(comment.parentType, commentId, body.trim());

    const updated = await findCommentById(commentId);

    res.status(200).json({
        message: "Comment updated successfully",
        comment: updated,
    });
});

/* -------------------------------------------------------
   DELETE COMMENT
------------------------------------------------------- */
export const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    const comment = await findCommentById(commentId);

    if (!comment) {
        res.status(404);
        throw new Error("Comment not found");
    }

    if (comment.author_id !== req.user.id) {
        res.status(403);
        throw new Error("Not authorized");
    }

    await deleteCommentSQL(comment.parentType, commentId);

    res.status(200).json({
        message: "Comment deleted successfully",
    });
});
