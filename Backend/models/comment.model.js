import { query } from "../db/index.js";

// --------------------------------------------
// CREATE QUESTION COMMENT
// --------------------------------------------
export const createQuestionComment = async ({ body, authorId, questionId }) => {
    const result = await query(
        `
        INSERT INTO question_comments (body, author_id, question_id)
        VALUES (?, ?, ?)
        `,
        [body, authorId, questionId]
    );
    return result.insertId;
};

// --------------------------------------------
// CREATE ANSWER COMMENT
// --------------------------------------------
export const createAnswerComment = async ({ body, authorId, answerId }) => {
    const result = await query(
        `
        INSERT INTO answer_comments (body, author_id, answer_id)
        VALUES (?, ?, ?)
        `,
        [body, authorId, answerId]
    );
    return result.insertId;
};

// --------------------------------------------
// GET COMMENTS FOR QUESTION
// --------------------------------------------
export const getQuestionComments = async (questionId) => {
    return await query(
        `
        SELECT qc.*, u.name AS author_name, u.email AS author_email
        FROM question_comments qc
        JOIN users u ON u.id = qc.author_id
        WHERE qc.question_id = ?
        ORDER BY qc.created_at DESC
        `,
        [questionId]
    );
};

// --------------------------------------------
// GET COMMENTS FOR ANSWER
// --------------------------------------------
export const getAnswerComments = async (answerId) => {
    return await query(
        `
        SELECT ac.*, u.name AS author_name, u.email AS author_email
        FROM answer_comments ac
        JOIN users u ON u.id = ac.author_id
        WHERE ac.answer_id = ?
        ORDER BY ac.created_at DESC
        `,
        [answerId]
    );
};

// --------------------------------------------
// FIND COMMENT BY ID (SEARCH BOTH TABLES)
// --------------------------------------------
export const findCommentById = async (commentId) => {
    let rows = await query(
        "SELECT *, 'question' AS type FROM question_comments WHERE id = ? LIMIT 1",
        [commentId]
    );
    if (rows.length > 0) return rows[0];

    rows = await query(
        "SELECT *, 'answer' AS type FROM answer_comments WHERE id = ? LIMIT 1",
        [commentId]
    );
    return rows[0] || null;
};

// --------------------------------------------
// UPDATE COMMENT (KNOWING WHICH TABLE IT CAME FROM)
// --------------------------------------------
export const updateCommentSQL = async (type, commentId, body) => {
    const table = type === "question" ? "question_comments" : "answer_comments";

    await query(`UPDATE ${table} SET body = ? WHERE id = ?`, [body, commentId]);
};

// --------------------------------------------
// DELETE COMMENT
// --------------------------------------------
export const deleteCommentSQL = async (type, commentId) => {
    const table = type === "question" ? "question_comments" : "answer_comments";

    await query(`DELETE FROM ${table} WHERE id = ?`, [commentId]);
};
