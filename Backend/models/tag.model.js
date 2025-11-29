import mongoose from "mongoose";

const tagSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        }, // --- FIX: 'createdBy' and 'description' have been removed ---
    },
    { timestamps: true }
);

const Tag = mongoose.model("Tag", tagSchema);
export default Tag;
