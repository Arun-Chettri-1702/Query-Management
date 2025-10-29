import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
    {
        body: {
            type: String,
            required: true
        },
        author_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        question_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Question",
        },
        answer_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Answer",
        },
    },
    {
        timestamps: true,
    }
);

// XOR Rule: exactly one of question_id or answer_id must be non-NULL
commentSchema.pre("save", async function (next) {
    if (!this.question_id && !this.answer_id) {
        next(new Error("Comment must be on a question or an answer."));
    }
    if (this.question_id && this.answer_id) {
        next(new Error("Comment cannot be on both a question and an answer."));
    }
    next();
});

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;
