import asyncHandler from "express-async-handler";
import Tag from "../models/tag.model.js";
import Question from "../models/question.model.js";
import mongoose from "mongoose";

/**
 * @desc    Get all tags with their question counts
 * @route   GET /api/tags
 * @access  Public
 */
const getAllTags = asyncHandler(async (req, res) => {
    const tags = await Tag.aggregate([
        {
            $lookup: {
                from: "questions", // Your MongoDB collection name
                localField: "_id",
                foreignField: "tags",
                as: "questions",
            },
        },
        {
            $addFields: {
                questionCount: { $size: "$questions" }, // Calculate count
            },
        },
        {
            $project: {
                name: 1,
                questionCount: 1,
                // 'description' is removed
            },
        },
        { $sort: { questionCount: -1 } }, // Sort by most popular
    ]);

    return res.status(200).json({
        message: "Tags fetched successfully",
        tags: tags,
    });
});

/**
 * @desc    Get all questions for a specific tag
 * @route   GET /api/tags/:tagName/questions
 * @access  Public
 */
const getQuestionsByTag = asyncHandler(async (req, res) => {
    const { tagName } = req.params;

    // 1. Get pagination params from query
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    if (!tagName) {
        res.status(400);
        throw new Error("Tag name is required");
    }
    const normalizedTagName = tagName.toLowerCase().trim();

    const tag = await Tag.findOne({ name: normalizedTagName }).select("name");
    if (!tag) {
        res.status(404);
        throw new Error("Tag not found");
    }

    // 2. Create the base query
    const query = { tags: tag._id };

    // 3. Run queries in parallel for paginated results and total count
    const [questions, totalQuestions] = await Promise.all([
        Question.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("askedBy", "name")
            .populate("tags", "name"),
        Question.countDocuments(query),
    ]);

    // 4. Return the new response shape with pagination data
    return res.status(200).json({
        message: `Questions for tag: ${normalizedTagName}`,
        tag: tag,
        questions: questions,
        total: totalQuestions,
        currentPage: page,
        totalPages: Math.ceil(totalQuestions / limit),
    });
});

export { getAllTags, getQuestionsByTag };
