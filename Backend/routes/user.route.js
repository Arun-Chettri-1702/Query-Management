import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    getUserById,
    refreshAccessToken,
} from "../controllers/user.controller.js";
import {
    verifyJWT,
    verifyRefreshToken,
} from "../middlewares/auth.middleware.js";

const userRouter = Router();

userRouter.post("/registerUser", registerUser);
userRouter.post("/loginUser", loginUser);
userRouter.post("/logoutUser", verifyJWT, logoutUser);

userRouter.post("/refresh-token", verifyRefreshToken, refreshAccessToken);

userRouter.get("/:userId", getUserById);

export { userRouter };
