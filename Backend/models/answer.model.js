// models/answer.model.js
import { query } from "../db/index.js";

/**
 * Create answer and return insertId
 */
export const createAnswer = async ({ body, authorId, questionId }) => {
    const result = await query(
        `INSERT INTO answers (body, author_id, question_id) VALUES (?, ?, ?)`,
        [body, authorId, questionId]
    );
    return result.insertId;
};

/**
 * findAnswerById (raw row)
 */
export const findAnswerById = async (answerId) => {
    const rows = await query(`SELECT * FROM answers WHERE id = ? LIMIT 1`, [
        answerId,
    ]);
    return rows[0] || null;
};

/**
 * Internal helper: map DB row -> normalized answer object (Option 3)
 */
const mapRowToAnswer = (r) => {
    if (!r) return null;

    // canonical ids
    const id = r.id;
    const _id = r.id;

    // vote counts
    const vote_count = r.vote_count ?? 0;
    const voteCount = vote_count;

    // question id
    const question_id = r.question_id ?? r.questionId ?? null;
    const questionId = question_id;

    // author shapes
    const author_id_number = r.author_id ?? r.authorId ?? null;
    const author_name = r.author_name ?? r.authorName ?? r.name ?? null;

    const authorObj = {
        id: author_id_number,
        _id: author_id_number,
        name: author_name,
    };

    // user vote placeholder (will be number 1/-1/0 or null depending on query)
    const user_vote =
        typeof r.user_vote !== "undefined"
            ? r.user_vote
            : typeof r.userVote !== "undefined"
            ? r.userVote
            : 0;
    const userVote = user_vote ?? 0;

    // votes aggregated
    const upvotes = r.upvotes ?? 0;
    const downvotes = r.downvotes ?? 0;
    const score = r.score ?? vote_count;

    return {
        // both id shapes
        id,
        _id,

        // body + timestamps
        body: r.body,
        createdAt: r.created_at,
        updatedAt: r.updated_at,

        // both vote shapes
        vote_count,
        voteCount,

        // question link (both shapes)
        question_id,
        questionId,

        // author (both object + simple id)
        author: { ...authorObj },
        author_id: author_id_number,

        // author compatibility fields some components expect
        author_id_obj: { ...authorObj }, // fallback
        author_name: author_name,

        // votes summary and user vote
        votes: { upvotes, downvotes, score },
        upvotes,
        downvotes,
        score,
        user_vote,
        userVote,
    };
};

/**
 * findAnswerByIdFull (populated)
 * - includes votes aggregated and user's vote (if userId provided)
 */
export const findAnswerByIdFull = async (answerId, userId = null) => {
    const uid = userId ?? -1; // -1 will never match any real user_id

    const rows = await query(
        `
    SELECT
      a.id,
      a.body,
      a.vote_count,
      a.created_at,
      a.updated_at,
      a.question_id,
      u.id AS author_id,
      u.name AS author_name,
      COALESCE(av_stats.upvotes, 0) AS upvotes,
      COALESCE(av_stats.downvotes, 0) AS downvotes,
      COALESCE(av_stats.score, 0) AS score,
      (
         SELECT vote_type FROM answer_votes av2
         WHERE av2.answer_id = a.id AND av2.user_id = ?
         LIMIT 1
      ) AS user_vote
    FROM answers a
    JOIN users u ON u.id = a.author_id
    LEFT JOIN (
      SELECT
        answer_id,
        SUM(CASE WHEN vote_type = 1 THEN 1 ELSE 0 END) AS upvotes,
        SUM(CASE WHEN vote_type = -1 THEN 1 ELSE 0 END) AS downvotes,
        COALESCE(SUM(vote_type),0) AS score
      FROM answer_votes
      GROUP BY answer_id
    ) av_stats ON av_stats.answer_id = a.id
    WHERE a.id = ?
    LIMIT 1
    `,
        [uid, answerId]
    );

    const r = rows[0];
    if (!r) return null;

    return mapRowToAnswer(r);
};

/**
 * getAnswersByQuestionId(questionId, userId = null)
 * returns answers with author, votes and userVote (if userId provided)
 */
export const getAnswersByQuestionId = async (questionId, userId = null) => {
    const uid = userId ?? -1;

    const rows = await query(
        `
    SELECT
      a.id,
      a.body,
      a.vote_count,
      a.created_at,
      a.updated_at,
      a.question_id,
      u.id AS author_id,
      u.name AS author_name,
      COALESCE(av_stats.upvotes, 0) AS upvotes,
      COALESCE(av_stats.downvotes, 0) AS downvotes,
      COALESCE(av_stats.score, 0) AS score,
      (
         SELECT vote_type FROM answer_votes av2
         WHERE av2.answer_id = a.id AND av2.user_id = ?
         LIMIT 1
      ) AS user_vote
    FROM answers a
    JOIN users u ON u.id = a.author_id
    LEFT JOIN (
      SELECT
        answer_id,
        SUM(CASE WHEN vote_type = 1 THEN 1 ELSE 0 END) AS upvotes,
        SUM(CASE WHEN vote_type = -1 THEN 1 ELSE 0 END) AS downvotes,
        COALESCE(SUM(vote_type),0) AS score
      FROM answer_votes
      GROUP BY answer_id
    ) av_stats ON av_stats.answer_id = a.id
    WHERE a.question_id = ?
    ORDER BY a.created_at DESC
    `,
        [uid, questionId]
    );

    return rows.map(mapRowToAnswer);
};

/**
 * getAnswersByUserId
 */
export const getAnswersByUserId = async (userId) => {
    const rows = await query(
        `
    SELECT a.id, a.body, a.vote_count, a.created_at, a.updated_at,
           q.id AS question_id, q.title AS question_title,
           u.id AS author_id, u.name AS author_name
    FROM answers a
    JOIN questions q ON q.id = a.question_id
    JOIN users u ON u.id = a.author_id
    WHERE a.author_id = ?
    ORDER BY a.created_at DESC
    `,
        [userId]
    );

    return rows.map((r) => {
        const mapped = mapRowToAnswer(r);
        // attach question summary
        mapped.question = { id: r.question_id, title: r.question_title };
        return mapped;
    });
};

/**
 * updateAnswerSQL
 */
export const updateAnswerSQL = async (answerId, body) => {
    await query(
        `UPDATE answers SET body = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [body, answerId]
    );
};

/**
 * deleteAnswerSQL
 */
export const deleteAnswerSQL = async (answerId) => {
    await query(`DELETE FROM answers WHERE id = ?`, [answerId]);
};

/**
 * updateAnswerVoteCount(answerId)
 * Recomputes the vote score and persists into answers.vote_count.
 * Returns stats object.
 */
export const updateAnswerVoteCount = async (answerId) => {
    const rows = await query(
        `
    SELECT
      SUM(CASE WHEN vote_type = 1 THEN 1 ELSE 0 END) AS upvotes,
      SUM(CASE WHEN vote_type = -1 THEN 1 ELSE 0 END) AS downvotes,
      COALESCE(SUM(vote_type),0) AS score
    FROM answer_votes
    WHERE answer_id = ?
    `,
        [answerId]
    );

    const r = rows[0] || { upvotes: 0, downvotes: 0, score: 0 };
    const upvotes = r.upvotes || 0;
    const downvotes = r.downvotes || 0;
    const score = r.score || 0;

    // persist into answers.vote_count
    await query(`UPDATE answers SET vote_count = ? WHERE id = ?`, [
        score,
        answerId,
    ]);

    return { upvotes, downvotes, score };
};
