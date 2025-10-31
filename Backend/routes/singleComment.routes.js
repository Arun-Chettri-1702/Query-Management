import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import {
    updateComment,
    deleteComment,
} from "../controllers/comment.controller.js";

const singleCommentRouter = Router();

// Update a specific comment
singleCommentRouter.patch(
    "/updateComment/:commentId",
    verifyJWT,
    updateComment
);

// Delete a specific comment
singleCommentRouter.delete(
    "/deleteComment/:commentId",
    verifyJWT,
    deleteComment
);

export { singleCommentRouter };
