import { Router } from "express";
import {
    createQuestion,
    getUserQuestions,
    getQuestionById,
    updateQuestion,
    deleteQuestion,
} from "../controllers/question.controller.js";

import verifyJWT from "../middlewares/auth.middleware.js";
const questionRouter = Router();

questionRouter.post("/createQuestion", verifyJWT, createQuestion);
questionRouter.get("/getUserQuestions/:userId", getUserQuestions);
questionRouter.get("/getQuestionById/:questionId", getQuestionById);
questionRouter.patch("/updateQuestion/:questionId", verifyJWT, updateQuestion);
questionRouter.delete("/deleteQuestion/:questionId", verifyJWT, deleteQuestion);

export { questionRouter };
