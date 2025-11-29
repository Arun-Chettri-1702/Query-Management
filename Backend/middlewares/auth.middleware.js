import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/user.model.js";

dotenv.config({
    path: "./.env",
});

const verifyJWT = asyncHandler(async (req, res, next) => {
    console.log("req.cookies:", req.cookies);

    const accessToken =
        req.cookies["accessToken"] ||
        req.headers["authorization"]?.split(" ")[1];

    if (!accessToken) {
        res.status(401);
        throw new Error("Access token is missing");
    }

    console.log("Access Token in Middleware:", accessToken);
    try {
        const decodedToken = jwt.verify(
            accessToken,
            process.env.ACCESS_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken._id).select(
            "-password -refreshToken"
        );

        if (!user) {
            res.status(401);
            throw new Error("Unauthorized access - user not found");
        }

        req.user = user;
        next();
    } catch (err) {
        res.status(401);
        throw new Error("Unauthorized access - invalid token");
    }
});

// Add this new function to auth.middleware.js
const verifyRefreshToken = asyncHandler(async (req, res, next) => {
    const token = req.cookies.refreshToken; // Only look for the refresh token

    if (!token) {
        res.status(401);
        throw new Error("Refresh token is missing, not authorized");
    }

    try {
        // 1. Verify the token
        const decodedToken = jwt.verify(
            token,
            process.env.REFRESH_TOKEN_SECRET
        );

        // 2. Find the user in the DB
        const user = await User.findById(decodedToken._id);

        // 3. Check that the token in the DB matches the token from the cookie
        if (!user || user.refreshToken !== token) {
            res.status(401);
            throw new Error("Invalid refresh token");
        }

        req.user = user; // Attach user to the request
        next();
    } catch (err) {
        res.status(401);
        throw new Error("Refresh token is expired or invalid");
    }
});

export { verifyJWT, verifyRefreshToken };
