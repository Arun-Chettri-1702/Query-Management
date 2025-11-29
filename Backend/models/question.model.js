import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        body: { type: String, required: true },
        askedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        tags: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Tag",
            },
        ],
        // --- FIX: ADDED THIS FIELD ---
        voteCount: {
            type: Number,
            default: 0,
        },

        // --- FIX: ADDED THIS FIELD ---
        answers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Answer",
            },
        ],
    },
    {
        timestamps: true,
    }
);

const Question = mongoose.model("Question", questionSchema);

export default Question;
