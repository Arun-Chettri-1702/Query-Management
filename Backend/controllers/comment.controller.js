import mongoose from "mongoose";
import Comment from "../models/comment.model.js";
import asyncHandler from "express-async-handler";

const createComment = asyncHandler(async (req, res) => {
    const { body } = req.body;
    const { questionId, answerId } = req.params;
    const author_id = req.user._id;
    if (!body?.trim()) {
        res.status(400);
        throw new Error("Comment body cannot be empty");
    }
    let commentData = {
        body: body?.trim(),
        author_id,
    };
    if (questionId) {
        commentData.question_id = questionId;
    } else if (answerId) {
        commentData.answer_id = answerId;
    } else {
        res.status(500);
        throw new Error("Server routing error: No parent ID found.");
    }

    const comment = await Comment.create(commentData);
    return res
        .status(200)
        .json({ message: "Commented successfully ", comment });
});

const getCommentsForParent = asyncHandler(async (req, res) => {
    const { questionId, answerId } = req.params;

    let matchStage = {};
    if (questionId) {
        matchStage.question_id =
            mongoose.ObjectId.createFromHexString(questionId);
    } else if (answerId) {
        matchStage.answer_id = mongoose.Types.createFromHexString(answerId);
    } else {
        res.status(400);
        throw new Error("No parent ID provided.");
    }

    const comments = await Comment.aggregate([
        { $match: matchStage },
        {
            $lookup: {
                from: "users", // collection name in MongoDB (not model name)
                localField: "author_id",
                foreignField: "_id",
                as: "author",
            },
        },
        {
            $unwind: "$author", // convert array result from $lookup into an object
        },
        {
            $project: {
                _id: 1,
                body: 1,
                createdAt: 1,
                updatedAt: 1,
                "author._id": 1,
                "author.username": 1,
                "author.email": 1,
            },
        },
        { $sort: { createdAt: -1 } },
    ]);

    return res.status(200).json({
        count: comments.length,
        comments,
    });
});

const updateComment = asyncHandler(async (req, res) => {
    // --- 1. Get Inputs ---
    const { commentId } = req.params;
    const { body } = req.body;

    // --- 2. Validation ---
    if (!mongoose.isValidObjectId(commentId)) {
        res.status(400); // Bad Request
        throw new Error("Invalid Comment ID format");
    }

    if (!body || body.trim() === "") {
        res.status(400);
        throw new Error("Comment body cannot be empty");
    }

    // --- 3. Find the Resource ---
    const comment = await Comment.findById(commentId);
    if (!comment) {
        res.status(404); // Not Found
        throw new Error("Comment not found");
    }

    // --- 4. Authorization ---
    if (comment.author_id.toString() !== req.user._id.toString()) {
        res.status(403); // Forbidden
        throw new Error("User not authorized to update this comment");
    }

    // --- 5. Update and Save ---
    comment.body = body.trim();
    // CRITICAL FIX: Await the save operation to ensure it completes and to catch errors.
    const updatedComment = await comment.save();

    // --- 6. Send Response ---
    return res.status(200).json({
        comment: updatedComment,
        message: "Comment has been updated successfully",
    });
});

const deleteComment = asyncHandler(async (req, res) => {
    // --- 1. Get Inputs & Validate ---
    const { commentId } = req.params;

    if (!mongoose.isValidObjectId(commentId)) {
        res.status(400); // Bad Request
        throw new Error("Invalid Comment ID format");
    }

    // --- 2. Find the Resource ---
    const comment = await Comment.findById(commentId);
    if (!comment) {
        res.status(404); // Not Found
        throw new Error("Comment not found");
    }

    // --- 3. Authorization ---
    // A user can delete a comment if:
    //  a) They are the author of the comment.
    //  b) They are an admin or a moderator.
    const isAuthor = comment.author_id.toString() === req.user._id.toString();

    if (!isAuthor) {
        res.status(403); // Forbidden
        throw new Error("User not authorized to delete this comment");
    }

    // --- 4. Delete the Resource ---
    // .remove() is a good choice as it triggers any 'pre remove' Mongoose middleware.
    await Comment.findByIdAndDelete(commentId);

    // --- 5. Send Response ---
    return res.status(200).json({
        message: "Comment has been deleted successfully",
    });
});

export { getCommentsForParent, createComment };
