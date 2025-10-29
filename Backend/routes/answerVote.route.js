import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import { check } from "express-validator";
import { toggleVote } from "../controllers/answerVote.controller.js";

const voteRouter = Router();

voteRouter.post(
    "/vote/:answerId",
    verifyJWT[
        (check("voteType").isIn([-1, 1].withMessage("Wrong vote type")),
        check("answerId").isMongoId().withMessage("Invalid answer id"))
    ],
    toggleVote
);


export {voteRouter}