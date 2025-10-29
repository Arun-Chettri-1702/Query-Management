import Question from "../models/question.model.js";
import asyncHandler from "express-async-handler";
import dotenv from "dotenv";
import mongoose from "mongoose";

const createQuestion = asyncHandler(async (req, res) => {
    const { title, body, tags } = req.body;

    if ([title, body].some((eachField) => eachField?.trim() === "")) {
        throw new Error("Required fields cannot be empty");
    }

    try {
        const questionInstance = await Question.create({
            title: title,
            body: body,
            askedBy: req.user._id,
            tags: tags || [],
        });

        return res.status(200).json({
            questionInstance,
            message: "Question created successfully",
        });
    } catch (err) {
        throw new Error("Question creation failed");
    }
});

const getUserQuestions = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const validUserId = mongoose.isValidObjectId(userId);
    if (!validUserId) {
        throw new Error("Invalid user id");
    }
    const userInstance = await User.findById(userId).select(
        "-password -refreshToken"
    );
    if (!userInstance) {
        throw new Error("User not found");
    }

    const userQuestion = await Question.aggregate([
        {
            $match: { askedBy: new mongoose.Types.ObjectId(userId) },
        },
        {
            $project: {
                _id: 1,
                title: 1,
                body: 1,
                createdAt: 1,
                updatedAt: 1,
            },
        },
    ]);

    if (!userQuestion?.length) {
        throw new ApiError(400, "Questions not found");
    }

    return res
        .status(200)
        .json({ userQuestion, message: "User questions fetched successfully" });
});

const getQuestionById = asyncHandler(async (req, res) => {
    const { questionId } = req.params;

    if (!questionId) {
        throw new Error("Question id is required");
    }

    const validQuestionId = mongoose.isValidObjectId(questionId);
    if (!validQuestionId) {
        throw new Error("Invalid question id");
    }


    try {
        const question = await Question.findById(questionId).populate(
            "askedBy",
            "name"
        );
        if (!question) {
            throw new Error("Question with this id not found");
        }
        return res.status(200).json({
            question,
            message: "Question fetched successfully",
        });
    } catch (err) {
        throw new Error("Failed to fetch question", err);
    }
});

const updateQuestion = asyncHandler(async (req, res) => {
    const { questionId } = req.params;
    const { title, body, tags } = req.body;
    if (!questionId) {
        throw new Error("Question id is required");
    }

    const validQuestionId = mongoose.isValidObjectId(questionId);

    if (!validQuestionId) {
        throw new Error("Invalid question id");
    }

    const question = await Question.findById(questionId);
    if (!question) {
        throw new Error("Question with this id not found");
    }

    if (question.askedBy.toString() !== req.user._id.toString()) {
        return res
            .status(403)
            .json({ message: "Not authorized to update this question" });
    }

    const updateFields = {};

    if (title?.trim()) {
        updateFields.title = title?.trim();
    }

    if (body?.trim()) {
        updateFields.body = body?.trim();
    }

    if (tags?.length > 0) {
        
        const newTags = tags?.filter((tag) => !question.tags.includes(tag));
        if (newTags.length > 0) {
            updateFields.tags = [...question.tags, ...newTags];
        }
    }

    try {


        const updatedQuestion = await Question.findByIdAndUpdate(
            questionId,
            {
                $set: updateFields,
                updatedAt: Date.now(),
            },
            {
                new: true,
            }
        );

        return res.status(200).json({
            updatedQuestion,
            message: "Question updated successfully",
        });
    } catch (error) {
        throw new Error("Question update failed");
    }
});

const deleteQuestion = asyncHandler(async (req, res) => {
    const { questionId } = req.params;

    if (!questionId) {
        throw new Error("Question id is required");
    }

    const isValidQuestionId = mongoose.isValidObjectId(questionId);
    if (!isValidQuestionId) {
        throw new Error("Invalid question id");
    }

    const question = await Question.findById(questionId);
    if (!question) {
        throw new Error("Question with this id not found");
    }

    if (question.askedBy.toString() !== req.user._id.toString()) {
        return res
            .status(403)
            .json({ message: "Not authorized to delete this question" });
    }

    try {
        await Question.findByIdAndDelete(questionId);
        return res.status(200).json({
            message: "Question deleted successfully",
        });
    } catch (error) {
        throw new Error("Failed to delete question");
    }
});

export {
    createQuestion,
    getUserQuestions,
    getQuestionById,
    updateQuestion,
    deleteQuestion,
};
