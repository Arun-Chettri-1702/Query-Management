import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
dotenv.config({ path: "./.env" });

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// --- ROUTES IMPORTS ---
import { userRouter } from "./routes/user.route.js";
import { questionRouter } from "./routes/question.route.js";
import { answerRouter } from "./routes/answer.route.js";
import { voteRouter } from "./routes/answerVote.route.js";
import {commentCollectionRouter} from "./routes/commentCollection.routes.js";
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
app.use('/api/tags',tagRouter)



export { app };
