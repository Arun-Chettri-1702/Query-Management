import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { User } from "../models/user.model.js";

dotenv.config({
    path: "../.env",
});

const verifyJWT = asyncHandler(async (req, _, next) => {
    const accessToken =
        req.cookies.accessToken || req.headers["authorization"]?.split(" ")[1];

    if (!accessToken) {
        throw new Error("Access token is missing");
    }

    try {
        const decodedToken = jwt.verify(
            accessToken,
            process.env.ACCESS_TOKEN_SECRET
        );
        if (!decodedToken) {
            throw new Error("Invalid access token");
        }

        const user = await User.findById(decodedToken._id).select(
            "-password -refreshToken"
        );

        if (!user) {
            throw new Error("Unauthorized access - user not found");
        }

        req.user = user;
        next();
    } catch (err) {
        throw new Error("Unauthorized access - invalid token");
    }
});


export default verifyJWT;