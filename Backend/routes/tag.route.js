import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js";
import {
    getAllTags,
    getQuestionsByTag,
} from "../controllers/tag.controller.js";

const tagRouter = Router();

tagRouter.route("/").get(getAllTags);

tagRouter.route("/:tagName/questions").get(getQuestionsByTag);

export { tagRouter};
