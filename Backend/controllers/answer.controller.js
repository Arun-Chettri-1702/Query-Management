// controllers/answer.controller.js
import asyncHandler from "express-async-handler";
import {
    createAnswer,
    getAnswersByQuestionId,
    getAnswersByUserId,
    findAnswerById,
    findAnswerByIdFull,
    updateAnswerSQL,
    deleteAnswerSQL,
} from "../models/answer.model.js";
import { getQuestionByIdFull } from "../models/question.model.js";

/* POST ANSWER */
export const postAnswer = asyncHandler(async (req, res) => {
    const { questionId } = req.params;
    const { body } = req.body;

    if (!body?.trim()) {
        res.status(400);
        throw new Error("Answer body cannot be empty");
    }

    const question = await getQuestionByIdFull(questionId);
    if (!question) {
        res.status(404);
        throw new Error("Question not found");
    }

    const answerId = await createAnswer({
        body: body.trim(),
        authorId: req.user.id,
        questionId,
    });

    // fetch the newly created answer by id (safe and populated)
    const createdAnswer = await findAnswerByIdFull(answerId, req.user.id);

    res.status(201).json({
        answer: createdAnswer,
        message: "Answer posted successfully",
    });
});

/* GET ANSWERS FOR QUESTION */
export const getAnswersForQuestion = asyncHandler(async (req, res) => {
    const { questionId } = req.params;
    const userId = req.user?.id ?? null;

    const question = await getQuestionByIdFull(questionId);
    if (!question) {
        res.status(404);
        throw new Error("Question not found");
    }

    const answers = await getAnswersByQuestionId(questionId, userId);

    res.status(200).json({
        question,
        totalAnswers: answers.length,
        answers,
        message: "Answers fetched successfully",
    });
});

/* GET ANSWERS FOR LOGGED-IN USER */
export const getAnswersForUser = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const answers = await getAnswersByUserId(userId);

    res.status(200).json({
        totalAnswers: answers.length,
        answers,
        message: "User answers fetched successfully",
    });
});

/* UPDATE ANSWER */
export const updateAnswer = asyncHandler(async (req, res) => {
    const { answerId } = req.params;
    const { body } = req.body;

    if (!body?.trim()) {
        res.status(400);
        throw new Error("Answer body cannot be empty");
    }

    const answer = await findAnswerById(answerId);
    if (!answer) {
        res.status(404);
        throw new Error("Answer not found");
    }

    if (answer.author_id !== req.user.id) {
        res.status(403);
        throw new Error("Not authorized to update this answer");
    }

    await updateAnswerSQL(answerId, body.trim());

    const updated = await findAnswerByIdFull(answerId, req.user.id);

    res.status(200).json({
        updatedAnswer: updated,
        message: "Answer updated successfully",
    });
});

/* DELETE ANSWER */
export const deleteAnswer = asyncHandler(async (req, res) => {
    const { answerId } = req.params;

    const answer = await findAnswerById(answerId);
    if (!answer) {
        res.status(404);
        throw new Error("Answer not found");
    }

    if (answer.author_id !== req.user.id) {
        res.status(403);
        throw new Error("Not authorized to delete this answer");
    }

    await deleteAnswerSQL(answerId);

    res.status(200).json({
        message: "Answer deleted successfully",
    });
});
