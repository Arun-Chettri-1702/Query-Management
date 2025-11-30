import { Router } from "express";
import {
    createQuestionController,
    getUserQuestions,
    getQuestionById,
    updateQuestion,
    deleteQuestion,
    getAllQuestions,
} from "../controllers/question.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
const questionRouter = Router();

questionRouter.route("/").get(getAllQuestions);
questionRouter.post("/createQuestion", verifyJWT, createQuestionController);
questionRouter.get("/getUserQuestions/:userId", getUserQuestions);
questionRouter.get("/getQuestionById/:questionId", getQuestionById);
questionRouter.patch("/updateQuestion/:questionId", verifyJWT, updateQuestion);
questionRouter.delete("/deleteQuestion/:questionId", verifyJWT, deleteQuestion);

export { questionRouter };
