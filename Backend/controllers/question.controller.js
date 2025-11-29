import Question from "../models/question.model.js";
import Tag from "../models/tag.model.js";
import User from "../models/user.model.js";
import asyncHandler from "express-async-handler";
import mongoose from "mongoose";

const findOrCreateTags = async (tagNames = []) => {
    const tagIds = [];
    if (tagNames.length === 0) return tagIds;

    for (const tagName of tagNames) {
        const lowerName = tagName.toLowerCase().trim();
        if (!lowerName) continue;

        let tag = await Tag.findOne({ name: lowerName });

        if (!tag) {
            tag = await Tag.create({ name: lowerName });
        }
        tagIds.push(tag._id);
    }
    return tagIds;
};

const createQuestion = asyncHandler(async (req, res) => {
    const { title, body, tags } = req.body;

    if (!title?.trim() || !body?.trim()) {
        res.status(400);
        throw new Error("Title and body are required");
    }

    const tagIds = await findOrCreateTags(tags);

    const question = await Question.create({
        title: title.trim(),
        body: body.trim(),
        askedBy: req.user._id,
        tags: tagIds,
    });

    // Populate before sending back
    const populatedQuestion = await Question.findById(question._id)
        .populate("askedBy", "name")
        .populate("tags", "name");

    return res.status(201).json({
        question: populatedQuestion,
        message: "Question created successfully",
    });
});

const getAllQuestions = asyncHandler(async (req, res) => {
    // 1. Get all parameters from the frontend (with defaults)
    const { sort, unanswered, search } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit; // 2. Create the base query object

    const query = {}; // 3. Add 'unanswered' filter if present

    if (unanswered === "true") {
        query.answers = { $size: 0 };
    } // 4. --- THIS IS THE UPDATED SEARCH LOGIC ---

    if (search) {
        // Create a case-insensitive regex from the search term
        const searchRegex = { $regex: search, $options: "i" };

        // Find all tag IDs that match the search
        const matchingTags = await Tag.find({ name: searchRegex }).select(
            "_id"
        );
        const tagIds = matchingTags.map((tag) => tag._id);

        query.$or = [
            { title: searchRegex },
            { body: searchRegex },
            { tags: { $in: tagIds } }, // <-- Search if the question's 'tags' array contains any matching tag ID
        ];
    } // 5. Set sorting options
    // --- END OF UPDATE ---

    const sortOptions = {};
    if (sort === "votes") {
        sortOptions.voteCount = -1; // Descending
    } else {
        sortOptions.createdAt = -1; // Default
    } // 6. Run two queries at the same time

    const [questions, totalQuestions] = await Promise.all([
        Question.find(query) // 'query' now includes the search logic
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)
            .populate("askedBy", "name")
            .populate("tags", "name"),
        Question.countDocuments(query), // 'query' now includes the search logic
    ]); // 7. Send the complete response object

    res.status(200).json({
        questions: questions,
        total: totalQuestions,
        currentPage: page,
        totalPages: Math.ceil(totalQuestions / limit),
    });
});

// ... (your other controller functions and exports) ...

const getUserQuestions = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId)) {
        res.status(400);
        throw new Error("Invalid user id");
    }

    const userInstance = await User.findById(userId);
    if (!userInstance) {
        res.status(404);
        throw new Error("User not found");
    }

    const userQuestions = await Question.find({ askedBy: userId })
        .populate("tags", "name")
        .sort({ createdAt: -1 });

    return res.status(200).json({
        questions: userQuestions,
        message: "User questions fetched successfully",
    });
});

const getQuestionById = asyncHandler(async (req, res) => {
    const { questionId } = req.params;
    if (!mongoose.isValidObjectId(questionId)) {
        res.status(400);
        throw new Error("Invalid question id");
    }

    const question = await Question.findById(questionId)
        .populate("askedBy", "name")
        .populate("tags", "name");

    if (!question) {
        res.status(404);
        throw new Error("Question with this id not found");
    }

    return res.status(200).json(question);
});

const updateQuestion = asyncHandler(async (req, res) => {
    const { questionId } = req.params;
    const { title, body, tags } = req.body;

    if (!mongoose.isValidObjectId(questionId)) {
        res.status(400);
        throw new Error("Invalid question id");
    }

    const question = await Question.findById(questionId);
    if (!question) {
        res.status(404);
        throw new Error("Question with this id not found");
    }

    if (question.askedBy.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error("Not authorized to update this question");
    }

    const updateFields = {};
    if (title?.trim()) updateFields.title = title.trim();
    if (body?.trim()) updateFields.body = body.trim();

    if (tags) {
        const tagIds = await findOrCreateTags(tags);
        updateFields.tags = tagIds;
    }

    const updatedQuestion = await Question.findByIdAndUpdate(
        questionId,
        { $set: updateFields },
        { new: true }
    )
        .populate("askedBy", "name")
        .populate("tags", "name");

    return res.status(200).json({
        updatedQuestion,
        message: "Question updated successfully",
    });
});

const deleteQuestion = asyncHandler(async (req, res) => {
    const { questionId } = req.params;

    if (!mongoose.isValidObjectId(questionId)) {
        res.status(400);
        throw new Error("Invalid question id");
    }

    const question = await Question.findById(questionId);
    if (!question) {
        res.status(404);
        throw new Error("Question with this id not found");
    }

    if (question.askedBy.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error("Not authorized to delete this question");
    }

    await Question.findByIdAndDelete(questionId);

    // NOTE: You should also delete related answers and comments
    // await Answer.deleteMany({ question_id: questionId });
    // await Comment.deleteMany({ question_id: questionId });

    return res.status(200).json({
        message: "Question deleted successfully",
    });
});

export {
    createQuestion,
    getUserQuestions,
    getQuestionById,
    updateQuestion,
    deleteQuestion,
    getAllQuestions,
};
