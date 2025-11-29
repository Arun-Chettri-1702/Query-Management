import User from "../models/user.model.js";
import asyncHandler from "express-async-handler";
import dotenv from "dotenv";
dotenv.config({
    path: "../.env",
});

const generateAccessAndRefreshTokens = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new Error("User not found");
    }

    try {
        const accessToken =  user.generateAccessToken();
        const refreshToken =  user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({ validationBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (err) {
        throw new Error("Token generation failed");
    }
};

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, bio } = req.body;

    if (
        [name, email, password].some((eachField) => {
            return eachField?.trim() === "";
        })
    ) {
        throw new Error("Required fields cannot be empty");
    }

    const existingUser = await User.findOne({
        $or: [{ email }],
    });
    if (existingUser) {
        throw new Error("User with this email or username already exists");
    }

    try {
        const userInstance = await User.create({
            name: name,
            email: email,
            password: password,
            bio: bio || "",
        });

        const createdUser = await User.findById(userInstance._id).select(
            "-password -refreshToken"
        );

        if (!createdUser) {
            throw new Error("User creation failed");
        }

        const { accessToken, refreshToken } =
            await generateAccessAndRefreshTokens(createdUser._id);

        console.log("Tokens:", { accessToken, refreshToken });
        console.log("vhjv", process.env.NODE_ENV === "production");
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
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            })
            .cookie("accessToken", accessToken, {
                ...options,
                maxAge: 15 * 60 * 1000, // 15 minutes
            })
            .json({
                user: createdUser,
                message: "User registered successfully",
            });
    } catch (error) {
        throw new Error(`Something went wrong while creating user ${error}`);
    }
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if ([email, password].some((eachField) => eachField?.trim() === "")) {
        throw new Error("Required fields cannot be empty");
    }

    const user = await User.findOne({ email });

    if (!user) {
        throw new Error("User not found");
    }

    const passwordValidator = user.isValidPassword(password);
    if (!passwordValidator) {
        throw new Error("Wrong Password");
    }

    const { accessToken, refreshToken } = generateAccessAndRefreshTokens(
        user._id
    );

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax", // prevents CSRF
        maxAge: 24 * 60 * 60 * 1000, // 1 day (match refresh token expiry),
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
        .json({ user: loggedInUser, message: "Login Successful" });
});

const logoutUser = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    await User.findByIdAndUpdate(
        userId,
        { $unset: { refreshToken: true } },
        { new: true }
    );

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

const getUserById = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!mongoose.isValidObjectId(userId)) {
        res.status(400);
        throw new Error("Invalid user ID");
    }

    const user = await User.findById(userId).select("-password -refreshToken");

    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    res.status(200).json(user);
});


const refreshAccessToken = asyncHandler(async (req, res) => {
    // We get 'req.user' from the new verifyRefreshToken middleware
    const user = req.user;

    try {
        const newAccessToken = user.generateAccessToken();

        const options = {
            httpOnly: true,
            secure: false, // Set to true in production
            sameSite: "lax",
            path: "/",
        };

        return res
            .status(200)
            .cookie("accessToken", newAccessToken, {
                ...options,
                maxAge: 15 * 60 * 1000, // 15 minutes
            })
            .json({ message: "Access token refreshed" });
    } catch (err) {
        throw new Error("Failed to refresh access token");
    }
});

export { registerUser, loginUser, logoutUser, getUserById, refreshAccessToken };
