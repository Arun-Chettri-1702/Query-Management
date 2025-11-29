import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
dotenv.config({ path: "./.env" });

const app = express();

console.log("CORS ORIGIN:", process.env.CORS_ORIGIN);
app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

app.use((err, req, res, next) => {
    // Use the status code from the error, or default to 500
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        // Send the error message from your controller (e.g., "Access token is missing")
        message: err.message,
        // Only show the stack trace if you are in development
        stack: process.env.NODE_ENV === "production" ? null : err.stack,
    });
});
// --- END OF FIX ---

// --- ROUTES IMPORTS ---
import { userRouter } from "./routes/user.route.js";
import { questionRouter } from "./routes/question.route.js";
import { answerRouter } from "./routes/answer.route.js";
import { voteRouter } from "./routes/answerVote.route.js";
import { commentCollectionRouter } from "./routes/commentCollection.routes.js";
import { singleCommentRouter } from "./routes/singleComment.routes.js";
import { tagRouter } from "./routes/tag.route.js";

// --- ROUTES MOUNTING ---
app.use("/api/users", userRouter);
app.use("/api/questions", questionRouter);
app.use("/api/answers", answerRouter);
app.use("/api/answers/:answerId/vote", voteRouter);

// --- COMMENTS ---
app.use("/api/questions/:questionId/comments", commentCollectionRouter);
app.use("/api/answers/:answerId/comments", commentCollectionRouter);
app.use("/api/comments", singleCommentRouter);

// --- Tags ---
app.use("/api/tags", tagRouter);

export { app };
