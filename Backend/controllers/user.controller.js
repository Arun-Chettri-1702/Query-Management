// controllers/user.controller.js
import asyncHandler from "express-async-handler";
import {
    createUser,
    findUserByEmail,
    findUserById,
    isValidPassword,
    generateAccessToken,
    generateRefreshToken,
    saveRefreshToken,
} from "../models/user.model.js";

import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

/* -------------------------------------------------------
   USER NORMALIZER (same structure everywhere)
------------------------------------------------------- */
const mapUser = (user) => ({
    id: user.id,
    _id: user.id,
    name: user.name,
    email: user.email,
    bio: user.bio || null,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
});

/* -------------------------------------------------------
   Generate Access + Refresh Token pair
------------------------------------------------------- */
const generateTokensForUser = async (userId) => {
    const user = await findUserById(userId);

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await saveRefreshToken(userId, refreshToken);

    return {
        accessToken,
        refreshToken,
        user: mapUser(user),
    };
};

/* -------------------------------------------------------
   REGISTER
------------------------------------------------------- */
export const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, bio } = req.body;

    if ([name, email, password].some((f) => f?.trim() === "")) {
        throw new Error("Required fields cannot be empty");
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) throw new Error("User already exists");

    const userId = await createUser({ name, email, password, bio });

    const { accessToken, refreshToken, user } = await generateTokensForUser(
        userId
    );

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
    };

    return res
        .status(200)
        .cookie("refreshToken", refreshToken, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        .cookie("accessToken", accessToken, {
            ...cookieOptions,
            maxAge: 15 * 60 * 1000,
        })
        .json({
            user,
            message: "User registered successfully",
        });
});

/* -------------------------------------------------------
   LOGIN
------------------------------------------------------- */
export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const rawUser = await findUserByEmail(email);
    if (!rawUser) throw new Error("User not found");

    const valid = await isValidPassword(password, rawUser.password);
    if (!valid) throw new Error("Wrong password");

    const { accessToken, refreshToken, user } = await generateTokensForUser(
        rawUser.id
    );

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
    };

    return res
        .status(200)
        .cookie("refreshToken", refreshToken, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        .cookie("accessToken", accessToken, {
            ...cookieOptions,
            maxAge: 15 * 60 * 1000,
        })
        .json({
            user,
            message: "Login successful",
        });
});

/* -------------------------------------------------------
   LOGOUT
------------------------------------------------------- */
export const logoutUser = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    await saveRefreshToken(userId, null);

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
    };

    return res
        .clearCookie("refreshToken", cookieOptions)
        .clearCookie("accessToken", cookieOptions)
        .status(200)
        .json({ message: "Logged out successfully" });
});

/* -------------------------------------------------------
   GET USER BY ID (normalized)
------------------------------------------------------- */
export const getUserById = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await findUserById(userId);
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    return res.status(200).json(mapUser(user));
});

/* -------------------------------------------------------
   REFRESH ACCESS TOKEN
------------------------------------------------------- */
export const refreshAccessToken = asyncHandler(async (req, res) => {
    const user = req.user; // already normalized by middleware

    const newAccessToken = generateAccessToken(user);

    return res
        .status(200)
        .cookie("accessToken", newAccessToken, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 15 * 60 * 1000,
        })
        .json({ message: "Access token refreshed" });
});
