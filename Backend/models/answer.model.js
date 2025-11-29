import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
    {
        body: { type: String, required: true },
        author_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        question_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Question",
            required: true,
        },
        voteCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

const Answer = mongoose.model("Answer", answerSchema);

export default Answer;
