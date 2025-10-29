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
        tags: {
            type: [String],
            required: false,
        },
        // You can add other fields like status, tags, etc. here
    },
    {
        timestamps: true, // This will automatically handle createdAt and updatedAt
    }
);

const Question = mongoose.model("Question", questionSchema);

export default Question;
