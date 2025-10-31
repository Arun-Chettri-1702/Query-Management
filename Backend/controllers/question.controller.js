import Question from "../models/question.model.js";
import Tag from "../models/tag.model.js";
import asyncHandler from "express-async-handler";
import dotenv from "dotenv";
import mongoose from "mongoose";

const createQuestion = asyncHandler(async (req, res) => {
    const { title, body, tags } = req.body;

    if ([title, body].some((f) => f?.trim() === "")) {
        throw new Error("Required fields cannot be empty");
    }

    // Validate that each tag ID is valid (if provided)
    if (tags && !tags.every((tagId) => mongoose.isValidObjectId(tagId))) {
        throw new Error("One or more tag IDs are invalid");
    }

    const tagIds = [];
    for (const tagName of tags) {
        // Normalize
        const lowerName = tagName.toLowerCase().trim();

        // Check if tag exists
        let tag = await Tag.findOne({ name: lowerName });
        if (!tag) {
            // Create if it doesn’t
            tag = await Tag.create({ name: lowerName });
        }

        // Push its ObjectId
        tagIds.push(tag._id);
    }

    const question = await Question.create({
        title: title.trim(),
        body: body.trim(),
        askedBy: req.user._id,
        tags: tagIds || [],
    });

    return res.status(201).json({
        question,
        message: "Question created successfully",
    });
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
            $match: { askedBy: mongoose.ObjectId.createFromHexString(userId) },
        },
        {
            $lookup: {
                from: "tags", // Mongo collection name (lowercase plural)
                localField: "tags",
                foreignField: "_id",
                as: "tags",
            },
        },
        {
            $project: {
                _id: 1,
                title: 1,
                body: 1,
                tags: { name: 1, _id: 1 },
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
        const question = await Question.findById(questionId)
            .populate("askedBy", "name email")
            .populate("tags", "name description");

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
        if (!tags.every((tagId) => mongoose.isValidObjectId(tagId))) {
            throw new Error("Invalid tag IDs in request");
        }

        // Optional: append new tags without duplicates
        const uniqueTags = Array.from(
            new Set([...question.tags.map(String), ...tags.map(String)])
        );
        updateFields.tags = uniqueTags;
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
