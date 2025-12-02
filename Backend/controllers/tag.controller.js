// controllers/tag.controller.js
import asyncHandler from "express-async-handler";
import {
    getAllTagsSQL,
    getTagQuestionsSQL,
    getTagsForQuestion,
} from "../models/tag.model.js";


/* -------------------------------------------------------
   GET ALL TAGS
------------------------------------------------------- */
export const getAllTags = asyncHandler(async (req, res) => {
    const tags = await getAllTagsSQL();
    res.status(200).json({ tags });
});

/* -------------------------------------------------------
   GET QUESTIONS FOR TAG (FULL NORMALIZED)
------------------------------------------------------- */
export const getTagQuestions = asyncHandler(async (req, res) => {
    const { tagName } = req.params;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { tag, total, questions } = await getTagQuestionsSQL({
        tagName,
        skip,
        limit,
    });

    if (!tag) {
        res.status(404);
        throw new Error("Tag not found");
    }

    // Attach full tag list to each question
    for (const q of questions) {
        const tags = await getTagsForQuestion(q.id);
        q.tags = tags.map((t) => ({
            id: t.id,
            _id: t.id,
            name: t.name,
        }));
    }

    res.status(200).json({
        tag: { id: tag.id, _id: tag.id, name: tag.name },
        questions,
        total,
        totalPages: Math.ceil(total / limit),
    });
});
