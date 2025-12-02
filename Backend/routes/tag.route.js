import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getAllTags, getTagQuestions } from "../controllers/tag.controller.js";

const tagRouter = Router();

tagRouter.route("/").get(getAllTags);

tagRouter.route("/:tagName/questions").get(getTagQuestions);

export { tagRouter };
