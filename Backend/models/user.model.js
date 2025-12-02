// models/user.model.js
import { query } from "../db/index.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

/* -------------------------------------------------------
   Helper — normalize user output
------------------------------------------------------- */
export const mapUser = (u) => {
    if (!u) return null;

    const id = u.id;
    const _id = u.id;

    return {
        id,
        _id,

        name: u.name,
        email: u.email,
        bio: u.bio,

        createdAt: u.created_at,
        updatedAt: u.updated_at,

        // internal fields hidden from frontend
        refresh_token: u.refresh_token,
    };
};

/* -------------------------------------------------------
   HASH PASSWORD
------------------------------------------------------- */
export const hashPasswordIfNeeded = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

/* -------------------------------------------------------
   CREATE USER
------------------------------------------------------- */
export const createUser = async ({ name, email, password, bio }) => {
    const hashed = await hashPasswordIfNeeded(password);

    const sql = `
        INSERT INTO users (name, email, password, bio)
        VALUES (?, ?, ?, ?)
    `;

    const result = await query(sql, [name, email, hashed, bio || null]);
    return result.insertId;
};

/* -------------------------------------------------------
   FIND USER BY EMAIL (raw DB row)
------------------------------------------------------- */
export const findUserByEmail = async (email) => {
    const rows = await query("SELECT * FROM users WHERE email = ? LIMIT 1", [
        email,
    ]);
    return rows[0] || null;
};

/* -------------------------------------------------------
   FIND USER BY ID (normalized)
------------------------------------------------------- */
export const findUserById = async (id) => {
    const rows = await query("SELECT * FROM users WHERE id = ? LIMIT 1", [id]);
    if (!rows[0]) return null;

    const user = rows[0];
    return mapUser(user);
};

/* -------------------------------------------------------
   SAVE REFRESH TOKEN
------------------------------------------------------- */
export const saveRefreshToken = async (userId, token) => {
    await query("UPDATE users SET refresh_token = ? WHERE id = ?", [
        token,
        userId,
    ]);
};

/* -------------------------------------------------------
   PASSWORD CHECK
------------------------------------------------------- */
export const isValidPassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

/* -------------------------------------------------------
   ACCESS TOKEN
------------------------------------------------------- */
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

/* -------------------------------------------------------
   REFRESH TOKEN
------------------------------------------------------- */
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
