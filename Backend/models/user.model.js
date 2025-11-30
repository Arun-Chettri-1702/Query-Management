import { query } from "../db/index.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

// Hash password (pre-save equivalent)
export const hashPasswordIfNeeded = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

// Create user
export const createUser = async ({ name, email, password, bio }) => {
    const hashed = await hashPasswordIfNeeded(password);

    const sql = `
        INSERT INTO users (name, email, password, bio)
        VALUES (?, ?, ?, ?)
    `;

    const result = await query(sql, [name, email, hashed, bio || null]);
    return result.insertId;
};

// Find user by email
export const findUserByEmail = async (email) => {
    const rows = await query("SELECT * FROM users WHERE email = ? LIMIT 1", [
        email,
    ]);
    return rows[0] || null;
};

// Find user by ID
export const findUserById = async (id) => {
    const rows = await query("SELECT * FROM users WHERE id = ? LIMIT 1", [id]);
    return rows[0] || null;
};

// Save refresh token
export const saveRefreshToken = async (userId, token) => {
    await query("UPDATE users SET refresh_token = ? WHERE id = ?", [
        token,
        userId,
    ]);
};

// Compare password
export const isValidPassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

// Generate Access Token
export const generateAccessToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            name: user.name,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_LIFETIME }
    );
};

// Generate Refresh Token
export const generateRefreshToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            name: user.name,
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_LIFETIME }
    );
};
