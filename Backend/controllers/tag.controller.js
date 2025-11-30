import asyncHandler from "express-async-handler";
import {
    getTagByName,
    getAllTagsSQL,
    getQuestionsForTagSQL,
    countQuestionsForTagSQL,
} from "../models/tag.model.js";

import { query } from "../db/index.js";

// --------------------------------------------------
// GET ALL TAGS
// --------------------------------------------------
export const getAllTags = asyncHandler(async (req, res) => {
    const tags = await getAllTagsSQL();

    res.status(200).json({
        message: "Tags fetched successfully",
        tags,
    });
});

// --------------------------------------------------
// GET QUESTIONS FOR A TAG (FULLY POPULATED)
// --------------------------------------------------
export const getQuestionsByTag = asyncHandler(async (req, res) => {
    const { tagName } = req.params;

    const page = parseInt(req.query.page || 1);
    const limit = parseInt(req.query.limit || 10);
    const offset = (page - 1) * limit;

    const tag = await getTagByName(tagName);
    if (!tag) {
        res.status(404);
        throw new Error("Tag not found");
    }

    // Fetch questions for this tag
    const questions = await getQuestionsForTagSQL(tag.id, limit, offset);

    // Attach askedBy, tags, answerCount
    for (const q of questions) {
        // askedBy
        const userRows = await query(
            `SELECT id, name FROM users WHERE id = ? LIMIT 1`,
            [q.asked_by]
        );
        const user = userRows[0];

        q.askedBy = {
            _id: user.id,
            name: user.name,
        };

        // tags for this question
        const tagRows = await query(
            `
            SELECT t.id, t.name
            FROM tags t
            JOIN question_tags qt ON qt.tag_id = t.id
            WHERE qt.question_id = ?
            `,
            [q.id]
        );
        q.tags = tagRows;

        // answer count
        const answerRows = await query(
            `SELECT COUNT(*) AS answerCount FROM answers WHERE question_id = ?`,
            [q.id]
        );
        q.answerCount = answerRows[0].answerCount;

        // camelCase timestamps
        q.createdAt = q.created_at;
        q.updatedAt = q.updated_at;
    }

    const total = await countQuestionsForTagSQL(tag.id);

    res.status(200).json({
        message: `Questions for tag: ${tag.name}`,
        tag,
        questions,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
    });
});
