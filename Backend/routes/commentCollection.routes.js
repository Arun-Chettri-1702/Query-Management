import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js";
import {
    createComment,
    getCommentsForParent,
} from "../controllers/comment.controller.js";

const commentCollectionRouter = Router({ mergeParams: true });

// Create a new comment (for either question or answer)
commentCollectionRouter.post("/createComment", verifyJWT, createComment);

// Get all comments for a specific parent (question or answer)
commentCollectionRouter.get("/getComments", getCommentsForParent);

export { commentCollectionRouter };
