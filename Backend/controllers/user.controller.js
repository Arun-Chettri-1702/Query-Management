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

// Generate Access + Refresh Tokens
const generateAccessAndRefreshTokens = async (userId) => {
    const user = await findUserById(userId);
    if (!user) throw new Error("User not found");

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await saveRefreshToken(userId, refreshToken);

    return { accessToken, refreshToken };
};

// ------------------------ REGISTER ------------------------
export const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, bio } = req.body;

    if ([name, email, password].some((f) => f?.trim() === ""))
        throw new Error("Required fields cannot be empty");

    const existingUser = await findUserByEmail(email);
    if (existingUser) throw new Error("User already exists");

    const userId = await createUser({
        name,
        email,
        password,
        bio: bio || "",
    });

    const createdUser = await findUserById(userId);
    delete createdUser.password;
    delete createdUser.refresh_token;

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
        userId
    );

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
    };

    return res
        .status(200)
        .cookie("refreshToken", refreshToken, {
            ...options,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        .cookie("accessToken", accessToken, {
            ...options,
            maxAge: 15 * 60 * 1000,
        })
        .json({
            user: createdUser,
            message: "User registered successfully",
        });
});

// ------------------------ LOGIN ------------------------
export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if ([email, password].some((f) => f?.trim() === ""))
        throw new Error("Required fields cannot be empty");

    const user = await findUserByEmail(email);
    if (!user) throw new Error("User not found");

    const valid = await isValidPassword(password, user.password);
    if (!valid) throw new Error("Wrong password");

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
        user.id
    );

    const loggedInUser = await findUserById(user.id);
    delete loggedInUser.password;
    delete loggedInUser.refresh_token;

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
    };

    return res
        .status(200)
        .cookie("refreshToken", refreshToken, {
            ...options,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        .cookie("accessToken", accessToken, {
            ...options,
            maxAge: 15 * 60 * 1000,
        })
        .json({ user: loggedInUser, message: "Login successful" });
});

// ------------------------ LOGOUT ------------------------
export const logoutUser = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    await saveRefreshToken(userId, null);

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
    };

    return res
        .clearCookie("refreshToken", options)
        .clearCookie("accessToken", options)
        .status(200)
        .json({ message: "Logged out successfully" });
});

// ------------------------ GET USER ------------------------
export const getUserById = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (isNaN(Number(userId))) {
        res.status(400);
        throw new Error("Invalid user ID");
    }

    const user = await findUserById(userId);
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    delete user.password;
    delete user.refresh_token;

    res.status(200).json(user);
});

// ------------------------ REFRESH ACCESS TOKEN ------------------------
export const refreshAccessToken = asyncHandler(async (req, res) => {
    const user = req.user;

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
