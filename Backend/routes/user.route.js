import {Router} from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
} from "../controllers/user.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const userRouter = Router();

userRouter.post("/registerUser", registerUser);
userRouter.post("/loginUser", loginUser);
userRouter.post("/logoutUser", verifyJWT, logoutUser);

export { userRouter };
