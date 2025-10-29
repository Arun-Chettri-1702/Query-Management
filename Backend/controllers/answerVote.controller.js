import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import AnswerVote from "../models/answerVote.model.js";
import Answer from "../models/answer.model.js";

const toggleVote = asyncHandler(async (req, res) => {
    const { answerId } = req.params;
    const { voteType } = req.body; // +1 for upvote, -1 for downvote
    const userId = req.user._id;

    if (![1, -1].includes(voteType)) {
        return res.status(400).json({ message: "Invalid vote type" });
    }

    if (!mongoose.isValidObjectId(answerId)) {
        return res.status(400).json({ message: "Invalid answer id" });
    }

    const answer = await Answer.findById(answerId);
    if (!answer) {
        return res.status(404).json({ message: "Answer not found" });
    }

    let message;
    const existingVote = await AnswerVote.findOne({ userId, answerId });

    // 🟢 CASE 1: First time vote
    if (!existingVote) {
        await AnswerVote.create({ userId, answerId, voteType });
        message = `You ${
            voteType === 1 ? "upvoted" : "downvoted"
        } this answer.`;
    }
    // 🟠 CASE 2: Same vote → cancel
    else if (existingVote.voteType === voteType) {
        await AnswerVote.findByIdAndDelete(existingVote._id);
        message = "Your vote has been removed.";
    }
    // 🔵 CASE 3: Switch vote
    else {
        existingVote.voteType = voteType;
        await existingVote.save();
        message = `Your vote changed to ${
            voteType === 1 ? "upvote" : "downvote"
        }.`;
    }

    // ✅ Recalculate vote stats
    const stats = await AnswerVote.aggregate([
        { $match: { answerId: new mongoose.Types.ObjectId(answerId) } },
        {
            $group: {
                _id: "$answerId",
                upvotes: { $sum: { $cond: [{ $eq: ["$voteType", 1] }, 1, 0] } },
                downvotes: {
                    $sum: { $cond: [{ $eq: ["$voteType", -1] }, 1, 0] },
                },
                score: { $sum: "$voteType" },
            },
        },
    ]);

    const { upvotes = 0, downvotes = 0, score = 0 } = stats[0] || {};

    // ✅ Find user's current vote state
    const userVote = await AnswerVote.findOne({ userId, answerId });
    
    return res.status(200).json({
        message,
        votes: {
            upvotes,
            downvotes,
            score,
        },
        userVote: userVote ? userVote.voteType : 0, // +1, -1, or 0 if no vote
    });
});

export {toggleVote}