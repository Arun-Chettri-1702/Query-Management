import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
dotenv.config({
    path: "./.env",
});
const app = express();

console.log(process.env.CORS_ORIGIN, "hbsjd");

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);

app.use(express.json({ limit: "16kb" }));
app.use(
    express.urlencoded({
        extended: true,
        limit: "16kb",
    })
);
app.use(express.json());
app.use(cookieParser());

import { userRouter } from "./routes/user.route.js";
import { questionRouter } from "./routes/question.route.js";
import { answerRouter } from "./routes/answer.route.js";
import { voteRouter } from "./routes/answerVote.route.js";

app.use("/api/users", userRouter);
app.use("/api/questions",questionRouter)
app.use("/api/answers", answerRouter)
app.use("/api/answerVote",voteRouter)

export { app };
