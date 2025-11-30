// models/answerVote.model.js
import { query } from "../db/index.js";

/**
 * findVote(answerId, userId)
 */
export const findVote = async (answerId, userId) => {
    const rows = await query(
        `SELECT * FROM answer_votes WHERE answer_id = ? AND user_id = ? LIMIT 1`,
        [answerId, userId]
    );
    return rows[0] || null;
};

/**
 * createVote(answerId, userId, voteType)
 */
export const createVote = async (answerId, userId, voteType) => {
    const result = await query(
        `INSERT INTO answer_votes (answer_id, user_id, vote_type) VALUES (?, ?, ?)`,
        [answerId, userId, voteType]
    );
    return result.insertId;
};

/**
 * deleteVoteById(voteId)
 */
export const deleteVoteById = async (voteId) => {
    await query(`DELETE FROM answer_votes WHERE id = ?`, [voteId]);
};

/**
 * updateVoteById(voteId, voteType)
 */
export const updateVoteById = async (voteId, voteType) => {
    await query(
        `UPDATE answer_votes SET vote_type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [voteType, voteId]
    );
};

/**
 * getVoteStats(answerId)
 * (Used rarely — updateAnswerVoteCount persists stats)
 */
export const getVoteStats = async (answerId) => {
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
    return {
        upvotes: r.upvotes || 0,
        downvotes: r.downvotes || 0,
        score: r.score || 0,
    };
};
