import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import dotenv from "dotenv";
import Question from "../models/question.model.js";
import Answer from "../models/answer.model.js";
import User from "../models/user.model.js"; // Import User for population

dotenv.config({
    path: "../.env",
});

// --- CREATE ANSWER ---
const postAnswer = asyncHandler(async (req, res) => {
    // FIX: Use 'questionId' to match your route
    const { questionId } = req.params;
    const { body } = req.body;
    const author_id = req.user._id;

    if (!body?.trim()) {
        res.status(400);
        throw new Error("Answer body cannot be empty");
    }
    if (!mongoose.isValidObjectId(questionId)) {
        res.status(400);
        throw new Error("Invalid question id");
    }
    const questionInstance = await Question.findById(questionId);
    if (!questionInstance) {
        res.status(404);
        throw new Error("Question not found");
    }

    const answer = await Answer.create({
        body: body.trim(),
        author_id: author_id,
        question_id: questionId,
    }); // FIX: Add this answer's ID to the parent question's 'answers' array

    questionInstance.answers.push(answer._id);
    await questionInstance.save(); // FIX: Populate the answer *before* sending it to the frontend

    const populatedAnswer = await Answer.findById(answer._id).populate(
        "author_id",
        "name"
    );

    return res.status(201).json({
        // Use 201 for "Created"
        answer: populatedAnswer, // FIX: Use 'answer' key
        message: "Answer posted successfully",
    });
});

// --- GET ANSWERS FOR A QUESTION ---
const getAnswersForQuestion = asyncHandler(async (req, res) => {
    const { questionId } = req.params;
    if (!mongoose.isValidObjectId(questionId)) {
        res.status(400);
        throw new Error("Invalid question id");
    }

    const questionInstance = await Question.findById(questionId)
        .populate("askedBy", "name") // FIX: Populate 'askedBy' (from your model)
        .select("title body tags createdAt askedBy"); // FIX: Select 'askedBy'
    if (!questionInstance) {
        res.status(404);
        throw new Error("Question not found");
    } // FIX: Replaced aggregation with simpler, more correct .find()

    const answers = await Answer.find({ question_id: questionId })
        .populate("author_id", "name") // Populates the author
        .sort({ createdAt: -1 });

    return res.status(200).json({
        question: questionInstance,
        totalAnswers: answers.length,
        answers: answers,
        message: "Answers fetched successfully",
    });
});

// --- GET ANSWERS FOR A (LOGGED IN) USER ---
const getAnswersForUser = asyncHandler(async (req, res) => {
    const userId = req.user._id; // FIX: Replaced aggregation with .find() to get the correct data shape

    const userAnswers = await Answer.find({ author_id: userId })
        .sort({ createdAt: -1 })
        .populate("question_id", "title"); // Populates 'question_id' and selects only 'title'

    return res.status(200).json({
        totalAnswers: userAnswers.length,
        answers: userAnswers, // FIX: Use 'answers' key
        message: "User answers fetched successfully",
    });
});

// --- UPDATE ANSWER ---
const updateAnswer = asyncHandler(async (req, res) => {
    const { answerId } = req.params;
    const { body } = req.body;
    if (!body?.trim()) {
        res.status(400);
        throw new Error("Answer body cannot be empty");
        A;
    }
    if (!mongoose.isValidObjectId(answerId)) {
        res.status(400);
        throw new Error("Invalid answer id");
    }

    const answerInstance = await Answer.findById(answerId);
    if (!answerInstance) {
        res.status(404);
        throw new Error("Answer not found");
    }

    if (answerInstance.author_id.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error("Not authorized to update this answer");
    } // Update the answer

    answerInstance.body = body.trim();
    await answerInstance.save(); // FIX: Must populate the answer *after* saving

    const populatedAnswer = await Answer.findById(answerInstance._id).populate(
        "author_id",
        "name"
    );

    return res.status(200).json({
        updatedAnswer: populatedAnswer, // Send populated answer
        message: "Answer updated successfully",
    });
});

// --- DELETE ANSWER ---
const deleteAnswer = asyncHandler(async (req, res) => {
    const { answerId } = req.params;

    if (!mongoose.isValidObjectId(answerId)) {
        res.status(400);
        throw new Error("Invalid answer id");
    }

    const answerInstance = await Answer.findById(answerId);
    if (!answerInstance) {
        res.status(404);
        throw new Error("Answer not found");
    }

    if (answerInstance.author_id.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error("Not authorized to delete this answer");
    } // FIX: Remove the answer's ID from the parent question's 'answers' array

    await Question.findByIdAndUpdate(answerInstance.question_id, {
        $pull: { answers: answerInstance._id },
    });

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
