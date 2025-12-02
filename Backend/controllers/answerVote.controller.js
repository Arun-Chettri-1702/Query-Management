// controllers/answerVote.controller.js
import asyncHandler from "express-async-handler";
import {
    findVote,
    createVote,
    deleteVoteById,
    updateVoteById,
} from "../models/answerVote.model.js";
import {
    findAnswerById,
    updateAnswerVoteCount,
} from "../models/answer.model.js";

/**
 * toggleVote
 * Body: { voteType: 1 | -1 }
 */
export const toggleVote = asyncHandler(async (req, res) => {
    const { answerId } = req.params;
    const { voteType } = req.body;
    const userId = req.user.id;

    if (![1, -1].includes(voteType)) {
        return res.status(400).json({ message: "Invalid vote type" });
    }

    // ensure answer exists
    const answer = await findAnswerById(answerId);
    if (!answer) {
        return res.status(404).json({ message: "Answer not found" });
    }

    // find existing vote
    const existingVote = await findVote(answerId, userId);

    let message = "";
    if (!existingVote) {
        // first-time vote
        await createVote(answerId, userId, voteType);
        message =
            voteType === 1
                ? "You upvoted this answer."
                : "You downvoted this answer.";
    } else if (existingVote.vote_type === voteType) {
        // user clicked same vote => remove it
        await deleteVoteById(existingVote.id);
        message = "Your vote has been removed.";
    } else {
        // user switches vote
        await updateVoteById(existingVote.id, voteType);
        message =
            voteType === 1
                ? "Your vote changed to upvote."
                : "Your vote changed to downvote.";
    }

    // recalc stats & persist to answers.vote_count
    const stats = await updateAnswerVoteCount(answerId);

    // find user's current vote state
    const afterVote = await findVote(answerId, userId);
    const userVote = afterVote ? afterVote.vote_type : 0;

    // return both naming styles
    return res.status(200).json({
        message,
        votes: {
            upvotes: stats.upvotes,
            downvotes: stats.downvotes,
            score: stats.score,
        },
        userVote,
        user_vote: userVote,
    });
});
