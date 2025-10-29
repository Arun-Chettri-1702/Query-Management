import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import dotenv from "dotenv";
import Question from "../models/question.model.js";
import Answer from "../models/answer.model.js";

dotenv.config({
    path: "../.env",
});

const postAnswer = asyncHandler(async (req, res) => {
    const { question_id } = req.params;
    const { body } = req.body;
    const user_id = req.user._id;

    if (!body?.trim()) {
        throw new Error("Answer body cannot be empty");
    }
    const isValidQuestionId = mongoose.isValidObjectId(question_id);
    if (!isValidQuestionId) {
        res.status(400)
        throw new Error("Invalid question id");
    }
    try {
        const questionInstance = await Question.findById(question_id);
        if (!questionInstance) {
            res.status(404);
            throw new Error("Question not found");
        }

        const answerInstance = await Answer.create({
            body: body.trim(),
            author_id: user_id,
            question_id: question_id,
        });

        return res.status(200).json({
            answerInstance,
            message: "Answer posted successfully",
        });
    } catch (error) {
        throw new Error("Failed to post answer");
    }
});

const getAnswersForQuestion = asyncHandler(async (req, res) => {
    const { questionId } = req.params;
    const isValidQuestionId = mongoose.isValidObjectId(questionId);
    if (!isValidQuestionId) {
        throw new Error("Invalid question id");
    }

    const userId = req.user._id;

    const questionInstance = await Question.findById(questionId)
        .populate("author_id", "name")
        .select("title body tags createdAt");
    if (!questionInstance) {
        throw new Error("Question not found");
    }

    const answerInstance = await Answer.aggregate([
        {
            $match: { question_id: mongoose.Types.ObjectId(questionId) },
        },
        {
            $lookup: {
                from: "users",
                localField: "author_id",
                foreignField: "_id",
                as: "answeredBy",
            },
        },
        {
            $unwind: "$answeredBy",
        },
        {
            $project: {
                "answeredBy.password": 0,
                "answeredBy.refreshToken": 0,
            },
        },
        {
            $sort: { createdAt: -1 },
        },
    ]);

    return res.status(200).json({
        question: questionInstance,
        totalAnswers: answerInstance.length,
        answers: answerInstance,
        message: "Answers fetched successfully",
    });
});

const getAnswersForUser = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const userAnswers = await Answer.aggregate([
        {
            $match: { author_id: mongoose.Types.ObjectId(userId) },
        },
        {
            $lookup: {
                from: "questions",
                localField: "question_id",
                foreignField: "_id",
                as: "questionDetails",
            },
        },
        {
            $unwind: "$questionDetails",
        },
        {
            $project: {
                answerText: "$body", // answer content
                createdAt: 1, // answer creation time
                updatedAt: 1, // answer update time
                "questionDetails._id": 1, // question id
                "questionDetails.title": 1, // question title
                "questionDetails.tags": 1, // question tags
            },
        },
        {
            $sort: { createdAt: -1 },
        },
    ]);

    return res.status(200).json({
        totalAnswers: userAnswers.length,
        userAnswers,
        message: "User answers fetched successfully",
    });
});

const updateAnswer = asyncHandler(async (req, res) => {
    const { answerId } = req.params;
    const { body } = req.body;
    if (!body?.trim()) {
        throw new Error("Answer body cannot be empty");
    }
    const isValidAnswerId = mongoose.isValidObjectId(answerId);
    if (!isValidAnswerId) {
        throw new Error("Invalid answer id");
    }

    const answerInstance = await Answer.findById(answerId);
    if (!answerInstance) {
        throw new Error("Answer not found");
    }

    if (answerInstance.author_id.toString() !== req.user._id.toString()) {
        return res
            .status(403)
            .json({ message: "Not authorized to update this answer" });
    }

    const updatedAnswer = await Answer.findByIdAndUpdate(
        answerId,
        {
            $set: {
                body: body.trim(),
                updatedAt: Date.now(),
            },
        },
        {
            new: true,
        }
    );

    return res.status(200).json({
        updatedAnswer,
        message: "Answer updated successfully",
    });
});

const deleteAnswer = asyncHandler(async (req, res) => {
    const { answerId } = req.params;

    if (!mongoose.isValidObjectId(answerId)) {
        throw new Error("Invalid answer id");
    }

    const answerInstance = await Answer.findById(answerId);
    if (!answerInstance) {
        throw new Error("Answer not found");
    }

    if (answerInstance.author_id.toString() !== req.user._id.toString()) {
        return res
            .status(403)
            .json({ message: "Not authorized to delete this answer" });
    }

    const deletedAnswer = await Answer.findByIdAndDelete(answerId);

    return res.status(200).json({
        deletedAnswer,
        message: "Answer deleted successfully",
    });
});

export {
    postAnswer,
    getAnswersForQuestion,
    getAnswersForUser,
    updateAnswer,
    deleteAnswer,
};
