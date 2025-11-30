// db/index.js
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

let pool;

/**
 * createTables()
 * Idempotent SQL that creates the schema your current controllers expect.
 * Safe to call on every startup.
 */
const createTables = async (conn) => {
    // Use utf8mb4 for emoji / full unicode
    const commonOpts =
        "ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    // NOTE: keep the order: parents first, then children
    const statements = [
        // users
        `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      bio TEXT,
      refresh_token TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ${commonOpts};`,

        // tags
        `CREATE TABLE IF NOT EXISTS tags (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ${commonOpts};`,

        // questions
        `CREATE TABLE IF NOT EXISTS questions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      body LONGTEXT NOT NULL,
      asked_by INT NOT NULL,
      vote_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (asked_by) REFERENCES users(id) ON DELETE CASCADE
    ) ${commonOpts};`,

        // question_tags many-to-many
        `CREATE TABLE IF NOT EXISTS question_tags (
      question_id INT NOT NULL,
      tag_id INT NOT NULL,
      PRIMARY KEY (question_id, tag_id),
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    ) ${commonOpts};`,

        // answers
        `CREATE TABLE IF NOT EXISTS answers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      body LONGTEXT NOT NULL,
      author_id INT NOT NULL,
      question_id INT NOT NULL,
      vote_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
      INDEX (question_id),
      INDEX (author_id)
    ) ${commonOpts};`,

        // answer_votes (unique per (answer_id, user_id))
        `CREATE TABLE IF NOT EXISTS answer_votes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      answer_id INT NOT NULL,
      user_id INT NOT NULL,
      vote_type TINYINT NOT NULL, -- 1 or -1
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_answer_user (answer_id, user_id),
      FOREIGN KEY (answer_id) REFERENCES answers(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ${commonOpts};`,

        // question_comments
        `CREATE TABLE IF NOT EXISTS question_comments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      body TEXT NOT NULL,
      author_id INT NOT NULL,
      question_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
      INDEX (question_id),
      INDEX (author_id)
    ) ${commonOpts};`,

        // answer_comments
        `CREATE TABLE IF NOT EXISTS answer_comments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      body TEXT NOT NULL,
      author_id INT NOT NULL,
      answer_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (answer_id) REFERENCES answers(id) ON DELETE CASCADE,
      INDEX (answer_id),
      INDEX (author_id)
    ) ${commonOpts};`,
    ];

    // Execute each statement sequentially
    for (const sql of statements) {
        await conn.query(sql);
    }
};

export const initDB = async () => {
    try {
        // Step 1: connect WITHOUT selecting a DB (so we can create it if missing)
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            multipleStatements: false,
        });

        console.log("Connected to MySQL server.");
        console.log(connection.execute("Show databases"));

        // Step 2: create DB if missing
        await connection.query(
            `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`
        );
        console.log(`Database '${process.env.DB_NAME}' verified/created.`);
        await connection.end();

        // Step 3: create pool WITH database selected
        pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            namedPlaceholders: false,
        });

        // Step 4: create tables (idempotent)
        // Use a dedicated connection from the pool to create tables
        const conn = await pool.getConnection();
        try {
            await createTables(conn);
            console.log("All tables are verified/created.");
        } finally {
            conn.release();
        }

        console.log("MySQL connection pool initialized.");
        return pool;
    } catch (err) {
        console.error("MySQL init error:", err);
        process.exit(1);
    }
};

// Helper to run SQL queries safely from other modules
export const query = async (sql, params = []) => {
    if (!pool) await initDB();

    console.log("\n---- DEBUG SQL ----");
    console.log(sql);
    console.log("PARAMS:", params);
    console.log("-------------------\n");

    const [rows] = await pool.execute(sql, params);
    return rows;
};
