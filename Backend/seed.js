// seed.js
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import bcrypt from "bcryptjs";
import { initDB, query } from "./db/index.js";

// -----------------------------
// Utility: Hash password
// -----------------------------
const hash = async (pw) => await bcrypt.hash(pw, 10);

// -----------------------------
// DATA (English only — realistic student tech content)
// -----------------------------
const questionsList = [
    "How do I fix the 'Cannot read property of undefined' error in JavaScript?",
    "What is the difference between SQL and NoSQL databases?",
    "Why do we use useEffect in React?",
    "How does JWT authentication work in web apps?",
    "What is the difference between TCP and UDP?",
    "How do I optimize SQL queries for faster execution?",
    "What is the role of middleware in Express.js?",
    "Why is React preferred over plain JavaScript for large projects?",
    "What is virtualization in operating systems?",
    "How does database indexing improve performance?",
    "How do I prepare for technical interviews effectively?",
    "How can I manage college and projects without getting overwhelmed?",
    "What is the best way to understand DSA concepts?",
    "How do I improve my communication and presentation skills?",
    "Is contributing to open-source helpful for placements?",
];

const answersList = [
    "Check if the variable is defined before accessing its property. Optional chaining is also useful in such cases.",
    "SQL stores structured relational data, while NoSQL handles unstructured or semi-structured data without a fixed schema.",
    "useEffect runs after rendering and is mainly used for API calls, event listeners, and subscriptions.",
    "JWT creates a signed token during login. The client sends it in the Authorization header on each protected request.",
    "TCP provides reliable delivery with acknowledgment; UDP is faster but doesn’t guarantee packet delivery.",
    "Index frequently queried columns, avoid SELECT *, and use EXPLAIN to identify performance bottlenecks.",
    "Middleware handles tasks like authentication, logging, validation, before the request reaches the route.",
    "React offers reusable components, state management, and virtual DOM which make large apps easier to maintain.",
    "Virtualization allows multiple operating systems to run on the same machine using virtual hardware.",
    "Indexes reduce lookup time by avoiding full table scans during search operations.",
    "Practice problem-solving daily, work on projects, and review core CS subjects instead of memorizing theory.",
    "Plan tasks weekly, break work into smaller goals, and avoid multitasking to reduce stress.",
    "Start with patterns and basics before moving to advanced algorithms. Practice daily for consistency.",
    "Record yourself speaking, read aloud, and explain topics to others to improve clarity and confidence.",
    "Open-source improves skills and builds credibility for recruiters due to real-world collaboration.",
];

const commentsList = [
    "Thanks, this helped!",
    "I was confused earlier, now it's clear.",
    "Can you give an example?",
    "This makes sense now.",
    "Appreciate the explanation!",
    "Does this apply to React as well?",
    "I tried and it worked.",
    "I'll check this approach and update.",
    "Nice breakdown, easy to follow.",
    "Could you clarify the last part?",
    "Great answer!",
    "Exactly what I needed.",
    "Does this work in MySQL too?",
    "Good explanation.",
    "I'll try this solution today.",
];

const tagsList = [
    "javascript",
    "react",
    "nodejs",
    "mysql",
    "dbms",
    "expressjs",
    "operating-systems",
    "networking",
    "datastructures",
    "algorithms",
    "web-development",
    "api-design",
    "authentication",
    "security",
    "deployment",
];

// -----------------------------
// Reset Database
// -----------------------------
async function resetDB() {
    console.log("🧨 Resetting database...");

    await query("SET FOREIGN_KEY_CHECKS = 0");

    const tables = [
        "answer_comments",
        "question_comments",
        "answer_votes",
        "answers",
        "question_tags",
        "questions",
        "tags",
        "users",
    ];

    for (const t of tables) {
        await query(`TRUNCATE TABLE ${t}`);
    }

    await query("SET FOREIGN_KEY_CHECKS = 1");

    console.log("✔ Database reset complete.\n");
}

// -----------------------------
// Seed Users (10)
// -----------------------------
async function seedUsers() {
    console.log("👤 Creating users...");

    const students = [
        "Aarav",
        "Riya",
        "Kabir",
        "Ayush",
        "Ananya",
        "Karthik",
        "Meera",
        "Sahil",
        "Isha",
        "Rohan",
    ];

    const userIds = [];
    for (const name of students) {
        const email = `${name.toLowerCase()}@example.com`;
        const bio = `${name} is interested in programming and technology.`;
        const password = await hash("Password123!");

        const result = await query(
            `INSERT INTO users (name, email, password, bio) VALUES (?, ?, ?, ?)`,
            [name, email, password, bio]
        );

        userIds.push(result.insertId);
    }

    console.log("✔ Users created.\n");
    return userIds;
}

// -----------------------------
// Seed Tags
// -----------------------------
async function seedTags() {
    console.log("🏷 Seeding tags...");

    for (const tag of tagsList) {
        await query(`INSERT INTO tags (name) VALUES (?)`, [tag]);
    }

    const rows = await query("SELECT id FROM tags");
    console.log("✔ Tags created.\n");
    return rows.map((t) => t.id);
}

// -----------------------------
// Seed Questions
// -----------------------------
async function seedQuestions(users, tags) {
    console.log("❓ Seeding questions...");

    const questionIds = [];
    for (const q of questionsList) {
        const askedBy = users[Math.floor(Math.random() * users.length)];
        const result = await query(
            `INSERT INTO questions (title, body, asked_by) VALUES (?, ?, ?)`,
            [q, q, askedBy]
        );
        const qId = result.insertId;
        questionIds.push(qId);

        // assign random 1–3 tags
        const randomTags = tags.sort(() => 0.5 - Math.random()).slice(0, 3);
        for (const tag of randomTags) {
            await query(
                `INSERT INTO question_tags (question_id, tag_id) VALUES (?, ?)`,
                [qId, tag]
            );
        }
    }

    console.log("✔ Questions created.\n");
    return questionIds;
}

// -----------------------------
// Seed Answers
// -----------------------------
async function seedAnswers(users, questions) {
    console.log("💬 Seeding answers...");

    const answerIds = [];
    for (let i = 0; i < answersList.length; i++) {
        const body = answersList[i];
        const author = users[Math.floor(Math.random() * users.length)];
        const question =
            questions[Math.floor(Math.random() * questions.length)];

        const result = await query(
            `INSERT INTO answers (body, author_id, question_id) VALUES (?, ?, ?)`,
            [body, author, question]
        );
        answerIds.push(result.insertId);
    }

    console.log("✔ Answers created.\n");
    return answerIds;
}

// -----------------------------
// Seed Comments for Q + A
// -----------------------------
async function seedQuestionComments(users, questions) {
    console.log("💬 Seeding question comments...");
    for (const q of questions) {
        const num = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < num; i++) {
            const comment =
                commentsList[Math.floor(Math.random() * commentsList.length)];
            const author = users[Math.floor(Math.random() * users.length)];
            await query(
                `INSERT INTO question_comments (body, author_id, question_id) VALUES (?, ?, ?)`,
                [comment, author, q]
            );
        }
    }
    console.log("✔ Question comments done.\n");
}

async function seedAnswerComments(users, answers) {
    console.log("💬 Seeding answer comments...");
    for (const a of answers) {
        const num = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < num; i++) {
            const comment =
                commentsList[Math.floor(Math.random() * commentsList.length)];
            const author = users[Math.floor(Math.random() * users.length)];
            await query(
                `INSERT INTO answer_comments (body, author_id, answer_id) VALUES (?, ?, ?)`,
                [comment, author, a]
            );
        }
    }
    console.log("✔ Answer comments done.\n");
}

// -----------------------------
// Run Seeder
// -----------------------------
async function runSeeder() {
    await initDB();
    await resetDB();

    const users = await seedUsers();
    const tags = await seedTags();
    const questions = await seedQuestions(users, tags);
    const answers = await seedAnswers(users, questions);
    await seedQuestionComments(users, questions);
    await seedAnswerComments(users, answers);

    console.log("\n🎉 DATABASE SEEDED SUCCESSFULLY 🎉\n");
    process.exit(0);
}

runSeeder().catch((err) => {
    console.error(err);
    process.exit(1);
});
