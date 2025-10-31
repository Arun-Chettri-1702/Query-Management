import asyncHandler from "express-async-handler";
import Tag from "../models/tag.model.js";
import Question from "../models/question.model.js";
import mongoose from "mongoose";

/**
 * @desc    Create a new tag
 * @route   POST /api/tags
 * @access  Private (Authenticated users)
 */
const createTag = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name || name.trim() === "") {
        res.status(400);
        throw new Error("Tag name is required");
    }

    const normalizedTagName = name.toLowerCase().trim();

    // Check if tag already exists
    const existingTag = await Tag.findOne({ name: normalizedTagName });
    if (existingTag) {
        res.status(400);
        throw new Error("Tag already exists");
    }

    // Create new tag
    const tag = await Tag.create({
        name: normalizedTagName,
        description: description?.trim() || "",
        createdBy: req.user._id,
    });

    return res.status(201).json({
        message: "Tag created successfully",
        tag,
    });
});

/**
 * @desc    Get all tags
 * @route   GET /api/tags
 * @access  Public
 */
const getAllTags = asyncHandler(async (req, res) => {
    const tags = await Tag.find({})
        .select("name description createdAt")
        .sort({ name: 1 }); // Sort alphabetically

    if (!tags.length) {
        return res.status(200).json({ message: "No tags found", tags: [] });
    }

    return res.status(200).json({
        message: "Tags fetched successfully",
        tags,
    });
});

/**
 * @desc    Get all questions for a specific tag
 * @route   GET /api/tags/:tagName/questions
 * @access  Public
 */
const getQuestionsByTag = asyncHandler(async (req, res) => {
    const { tagName } = req.params;

    if (!tagName) {
        res.status(400);
        throw new Error("Tag name is required");
    }

    const normalizedTagName = tagName.toLowerCase().trim();

    // Step 1: Find the tag by name
    const tag = await Tag.findOne({ name: normalizedTagName });
    if (!tag) {
        res.status(404);
        throw new Error("Tag not found");
    }

    // Step 2: Find all questions linked with this tag’s ObjectId
    const questions = await Question.find({ tags: tag._id })
        .populate("askedBy", "name email")
        .populate("tags", "name");

    if (!questions.length) {
        return res.status(200).json({
            message: `No questions found for tag: ${normalizedTagName}`,
            questions: [],
        });
    }

    return res.status(200).json({
        message: `Questions for tag: ${normalizedTagName}`,
        tag,
        questions,
    });
});

export { createTag, getAllTags, getQuestionsByTag };
