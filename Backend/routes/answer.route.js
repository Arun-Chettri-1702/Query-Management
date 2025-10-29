import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import {
    postAnswer,
    getAnswersForQuestion,
    getAnswersForUser,
    updateAnswer,
    deleteAnswer,
} from "../controllers/answer.controller.js";

const answerRouter = Router();

answerRouter.post("/postAnswer", verifyJWT, postAnswer);
answerRouter.get(
    "/getAnswersForQuestion/:questionId",
    verifyJWT,
    getAnswersForQuestion
);
answerRouter.get("/getAnswersForUser", verifyJWT, getAnswersForUser);
answerRouter.patch("/updateAnswer/:answerId", verifyJWT, updateAnswer);
answerRouter.delete("/deleteAnswer/:answerId", verifyJWT, deleteAnswer);

export { answerRouter };
