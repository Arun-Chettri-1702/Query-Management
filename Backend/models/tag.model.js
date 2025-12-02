// models/tag.model.js
import { query } from "../db/index.js";

/* -------------------------------------------------------
   Shared mapper — SAME as question.model.js
------------------------------------------------------- */
const mapQuestionRow = (r) => {
    if (!r) return null;

    const id = r.id;
    const _id = r.id;

    const askedBy = {
        id: r.askedBy_id,
        _id: r.askedBy_id,
        name: r.askedBy_name,
    };

    return {
        id,
        _id,
        title: r.title,
        body: r.body,

        createdAt: r.created_at,
        updatedAt: r.updated_at,

        voteCount: r.vote_count ?? 0,

        // Tag-level controllers must attach actual tags list
        tags: [],

        askedBy,

        // Normalized answer fields
        answers: [], // empty list for listing pages
        answerCount: r.answerCount ?? 0,
    };
};

/* -------------------------------------------------------
   Get all tags with question counts
------------------------------------------------------- */
export const getAllTagsSQL = async () => {
    const rows = await query(`
        SELECT 
            t.id,
            t.name,
            COUNT(qt.question_id) AS questionCount
        FROM tags t
        LEFT JOIN question_tags qt ON qt.tag_id = t.id
        GROUP BY t.id
        ORDER BY t.name ASC
    `);

    return rows.map((t) => ({
        id: t.id,
        _id: t.id,
        name: t.name,
        questionCount: t.questionCount,
    }));
};

/* -------------------------------------------------------
   Get questions for a tag (paginated)
------------------------------------------------------- */
export const getTagQuestionsSQL = async ({ tagName, skip, limit }) => {
    // 1. Fetch tag details
    const tagRows = await query(
        `SELECT id, name FROM tags WHERE name = ? LIMIT 1`,
        [tagName]
    );

    const tag = tagRows[0];
    if (!tag) return { tag: null, total: 0, questions: [] };

    // 2. Count total questions
    const countRows = await query(
        `
        SELECT COUNT(*) AS total
        FROM question_tags qt
        JOIN questions q ON q.id = qt.question_id
        WHERE qt.tag_id = ?
        `,
        [tag.id]
    );

    const total = countRows[0].total;

    // 3. Get paginated questions
    const rows = await query(
        `
        SELECT 
            q.id,
            q.title,
            q.body,
            q.vote_count,
            q.created_at,
            q.updated_at,
            u.id AS askedBy_id,
            u.name AS askedBy_name,
            (
                SELECT COUNT(*) FROM answers a 
                WHERE a.question_id = q.id
            ) AS answerCount
        FROM question_tags qt
        JOIN questions q ON q.id = qt.question_id
        JOIN users u ON u.id = q.asked_by
        WHERE qt.tag_id = ?
        ORDER BY q.created_at DESC
        LIMIT ? OFFSET ?
        `,
        [tag.id, limit, skip]
    );

    const questions = rows.map(mapQuestionRow);

    return { tag, total, questions };
};

/* -------------------------------------------------------
   Get tags for a question (used by controller)
------------------------------------------------------- */
export const getTagsForQuestion = async (questionId) => {
    return await query(
        `
        SELECT t.id, t.name 
        FROM tags t
        JOIN question_tags qt ON qt.tag_id = t.id
        WHERE qt.question_id = ?
        `,
        [questionId]
    );
};
