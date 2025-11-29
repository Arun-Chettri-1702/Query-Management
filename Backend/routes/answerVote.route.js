import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js";
import { check } from "express-validator";
import { toggleVote } from "../controllers/answerVote.controller.js";

// This router MUST have mergeParams to see :answerId from the parent
const voteRouter = Router({ mergeParams: true });

const voteValidation = [
    check("voteType", "Vote type must be 1 or -1").isIn([1, -1]),
];

// The route is now just "/" because it's nested.
// Middleware is chained correctly as separate arguments.
voteRouter.route("/").post(verifyJWT, voteValidation, toggleVote);

export { voteRouter };
