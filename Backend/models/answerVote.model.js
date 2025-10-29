import mongoose from "mongoose";

const answerVoteSchema = new mongoose.Schema(
    {
        answerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Answer", // Reference to the Answer model
            required: true,
        },
        votedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", // Reference to the User model
            required: true,
        },
        voteType: {
            type: Number,
            enum: [1, -1], // +1 = upvote, -1 = downvote
            required: true,
        },
    },
    { timestamps: true }
);

// ✅ Fix: use votedBy instead of userId in index
answerVoteSchema.index({ answerId: 1, votedBy: 1 }, { unique: true });

const AnswerVote = mongoose.model("AnswerVote", answerVoteSchema);
export default AnswerVote;
