import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { findUserById } from "../models/user.model.js";

dotenv.config({ path: "./.env" });

// -------------------- VERIFY ACCESS TOKEN --------------------
export const verifyJWT = asyncHandler(async (req, res, next) => {
    const accessToken =
        req.cookies["accessToken"] ||
        req.headers["authorization"]?.split(" ")[1];

    if (!accessToken) {
        res.status(401);
        throw new Error("Access token is missing");
    }

    try {
        const decoded = jwt.verify(
            accessToken,
            process.env.ACCESS_TOKEN_SECRET
        );

        const user = await findUserById(decoded.id);

        if (!user) {
            res.status(401);
            throw new Error("Unauthorized - user not found");
        }

        delete user.password;
        delete user.refresh_token;

        req.user = user;
        next();
    } catch (err) {
        res.status(401);
        throw new Error("Unauthorized - invalid token");
    }
});

// -------------------- VERIFY REFRESH TOKEN --------------------
export const verifyRefreshToken = asyncHandler(async (req, res, next) => {
    const token = req.cookies.refreshToken;

    if (!token) {
        res.status(401);
        throw new Error("Refresh token is missing");
    }

    try {
        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

        const user = await findUserById(decoded.id);

        if (!user) {
            res.status(401);
            throw new Error("Invalid refresh token - user not found");
        }

        if (user.refresh_token !== token) {
            res.status(401);
            throw new Error("Refresh token mismatch");
        }

        delete user.password;

        req.user = user;
        next();
    } catch (err) {
        res.status(401);
        throw new Error("Invalid or expired refresh token");
    }
});
