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
        commentData.questionId = questionId;
    } else if (answerId) {
        commentData.answerId = answerId;
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
        matchStage.question_id = new mongoose.Types.ObjectId(questionId);
    } else if (answerId) {
        matchStage.answer_id = new mongoose.Types.ObjectId(answerId);
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
                content: 1,
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

export { getCommentsForParent, createComment };
