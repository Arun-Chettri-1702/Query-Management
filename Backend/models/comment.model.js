// models/comment.model.js
import { query } from "../db/index.js";

/* -------------------------------------------------------
   Helper: normalize comment rows (Option C-1)
------------------------------------------------------- */
const mapRowToComment = (r, parentType) => {
    if (!r) return null;

    const id = r.id;
    const _id = r.id;

    const authorId = r.author_id;
    const authorName = r.author_name;

    return {
        id,
        _id,
        body: r.body,
        createdAt: r.created_at,
        updatedAt: r.updated_at,

        // Full consistent author object
        author: {
            id: authorId,
            _id: authorId,
            name: authorName,
        },

        // Compatibility fields
        author_id: authorId,
        author_name: authorName,

        parentType, // "question" or "answer"
    };
};

/* -------------------------------------------------------
   CREATE QUESTION COMMENT
------------------------------------------------------- */
export const createQuestionComment = async ({ body, authorId, questionId }) => {
    const result = await query(
        `INSERT INTO question_comments (body, author_id, question_id)
         VALUES (?, ?, ?)`,
        [body, authorId, questionId]
    );
    return result.insertId;
};

/* -------------------------------------------------------
   CREATE ANSWER COMMENT
------------------------------------------------------- */
export const createAnswerComment = async ({ body, authorId, answerId }) => {
    const result = await query(
        `INSERT INTO answer_comments (body, author_id, answer_id)
         VALUES (?, ?, ?)`,
        [body, authorId, answerId]
    );
    return result.insertId;
};

/* -------------------------------------------------------
   GET COMMENTS FOR QUESTION — normalized
------------------------------------------------------- */
export const getQuestionComments = async (questionId) => {
    const rows = await query(
        `
        SELECT qc.*, u.name AS author_name
        FROM question_comments qc
        JOIN users u ON u.id = qc.author_id
        WHERE qc.question_id = ?
        ORDER BY qc.created_at DESC
        `,
        [questionId]
    );

    return rows.map((r) => mapRowToComment(r, "question"));
};

/* -------------------------------------------------------
   GET COMMENTS FOR ANSWER — normalized
------------------------------------------------------- */
export const getAnswerComments = async (answerId) => {
    const rows = await query(
        `
        SELECT ac.*, u.name AS author_name
        FROM answer_comments ac
        JOIN users u ON u.id = ac.author_id
        WHERE ac.answer_id = ?
        ORDER BY ac.created_at DESC
        `,
        [answerId]
    );

    return rows.map((r) => mapRowToComment(r, "answer"));
};

/* -------------------------------------------------------
   FIND COMMENT BY ID (search both tables)
------------------------------------------------------- */
export const findCommentById = async (commentId) => {
    let rows = await query(
        `SELECT qc.*, u.name AS author_name, 'question' AS type
         FROM question_comments qc
         JOIN users u ON u.id = qc.author_id
         WHERE qc.id = ?
         LIMIT 1`,
        [commentId]
    );

    if (rows.length > 0) return mapRowToComment(rows[0], "question");

    rows = await query(
        `SELECT ac.*, u.name AS author_name, 'answer' AS type
         FROM answer_comments ac
         JOIN users u ON u.id = ac.author_id
         WHERE ac.id = ?
         LIMIT 1`,
        [commentId]
    );

    return rows.length ? mapRowToComment(rows[0], "answer") : null;
};

/* -------------------------------------------------------
   UPDATE COMMENT
------------------------------------------------------- */
export const updateCommentSQL = async (type, commentId, body) => {
    const table = type === "question" ? "question_comments" : "answer_comments";
    await query(
        `UPDATE ${table} SET body = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [body, commentId]
    );
};

/* -------------------------------------------------------
   DELETE COMMENT
------------------------------------------------------- */
export const deleteCommentSQL = async (type, commentId) => {
    const table = type === "question" ? "question_comments" : "answer_comments";
    await query(`DELETE FROM ${table} WHERE id = ?`, [commentId]);
};
