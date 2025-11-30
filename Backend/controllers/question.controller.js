import asyncHandler from "express-async-handler";
import {
    findOrCreateTags,
    createQuestion,
    addTagsToQuestion,
    removeTagsFromQuestion,
    getAllQuestionsSQL,
    getQuestionByIdFull,
    getQuestionsByUserId,
    updateQuestionSQL,
    deleteQuestionSQL,
    getTagsForQuestionSQL,
} from "../models/question.model.js";

import { query } from "../db/index.js";

/* -------------------------------------------------------
   CREATE QUESTION
------------------------------------------------------- */
export const createQuestionController = asyncHandler(async (req, res) => {
    const { title, body, tags } = req.body;

    if (!title?.trim() || !body?.trim()) {
        res.status(400);
        throw new Error("Title and body are required");
    }

    const tagIds = await findOrCreateTags(tags || []);

    const questionId = await createQuestion({
        title: title.trim(),
        body: body.trim(),
        askedBy: req.user.id,
    });

    await addTagsToQuestion(questionId, tagIds);

    const question = await getQuestionByIdFull(questionId);

    res.status(201).json({
        question,
        message: "Question created successfully",
    });
});

/* -------------------------------------------------------
   GET ALL QUESTIONS
------------------------------------------------------- */
export const getAllQuestions = asyncHandler(async (req, res) => {
    const { sort, unanswered, search } = req.query;

    const page = parseInt(req.query.page || "1");
    const limit = parseInt(req.query.limit || "10");
    const skip = (page - 1) * limit;

    const { questions, total } = await getAllQuestionsSQL({
        search,
        unanswered,
        sort,
        skip,
        limit,
    });

    res.status(200).json({
        questions,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
    });
});

/* -------------------------------------------------------
   GET USER QUESTIONS (FULLY FIXED)
------------------------------------------------------- */
export const getUserQuestions = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const rows = await getQuestionsByUserId(userId);

    const userRows = await query(
        `SELECT id, name FROM users WHERE id = ? LIMIT 1`,
        [userId]
    );

    const user = userRows[0] || { id: userId, name: "Unknown" };

    for (const q of rows) {
        const tags = await getTagsForQuestionSQL(q.id);

        const answers = await query(
            `SELECT COUNT(*) AS answerCount FROM answers WHERE question_id = ?`,
            [q.id]
        );

        q.tags = tags.map((t) => ({ id: t.id, name: t.name }));
        q.answerCount = answers[0]?.answerCount || 0;

        // Normalized shape
        q.askedBy = {
            id: user.id,
            _id: user.id,
            name: user.name,
        };

        q._id = q.id;
        q.createdAt = q.created_at;
        q.updatedAt = q.updated_at;
    }

    res.status(200).json({
        questions: rows,
        message: "User questions fetched successfully",
    });
});

/* -------------------------------------------------------
   GET QUESTION BY ID
------------------------------------------------------- */
export const getQuestionById = asyncHandler(async (req, res) => {
    const { questionId } = req.params;

    const question = await getQuestionByIdFull(questionId);

    if (!question) {
        res.status(404);
        throw new Error("Question with this id not found");
    }

    res.status(200).json(question);
});

/* -------------------------------------------------------
   UPDATE QUESTION — FINAL FIX
------------------------------------------------------- */
export const updateQuestion = asyncHandler(async (req, res) => {
    const { questionId } = req.params;
    const { title, body, tags } = req.body;

    const question = await getQuestionByIdFull(questionId);

    if (!question) {
        res.status(404);
        throw new Error("Question not found");
    }

    const askedId = question.askedBy.id || question.askedBy._id;

    if (askedId !== req.user.id) {
        res.status(403);
        throw new Error("Not authorized");
    }

    const updateFields = {};
    if (title?.trim()) updateFields.title = title.trim();
    if (body?.trim()) updateFields.body = body.trim();

    await updateQuestionSQL(questionId, updateFields);

    // Update tags ONLY if explicitly provided
    if (Array.isArray(tags)) {
        const tagIds = await findOrCreateTags(tags);
        await removeTagsFromQuestion(questionId);
        await addTagsToQuestion(questionId, tagIds);
    }

    const updated = await getQuestionByIdFull(questionId);

    res.status(200).json({
        updatedQuestion: updated,
        message: "Question updated successfully",
    });
});

/* -------------------------------------------------------
   DELETE QUESTION
------------------------------------------------------- */
export const deleteQuestion = asyncHandler(async (req, res) => {
    const { questionId } = req.params;

    const question = await getQuestionByIdFull(questionId);

    if (!question) {
        res.status(404);
        throw new Error("Question not found");
    }

    const askedId = question.askedBy.id || question.askedBy._id;

    if (askedId !== req.user.id) {
        res.status(403);
        throw new Error("Not authorized");
    }

    await deleteQuestionSQL(questionId);

    res.status(200).json({
        message: "Question deleted successfully",
    });
});
