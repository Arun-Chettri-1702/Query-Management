import { query } from "../db/index.js";

// --------------------------------------------------
// Find a tag by normalized name
// --------------------------------------------------
export const getTagByName = async (name) => {
    const lower = name.toLowerCase().trim();

    const rows = await query(
        `SELECT * FROM tags WHERE LOWER(name) = ? LIMIT 1`,
        [lower]
    );

    return rows[0] || null;
};

// --------------------------------------------------
// Create or return tag ID
// --------------------------------------------------
export const findOrCreateTagByName = async (name) => {
    const lower = name.toLowerCase().trim();

    // 1. Check if exists
    const exists = await getTagByName(lower);
    if (exists) return exists.id;

    // 2. Create new tag
    const result = await query(`INSERT INTO tags (name) VALUES (?)`, [lower]);

    return result.insertId;
};

// --------------------------------------------------
// Bulk find-or-create tags
// --------------------------------------------------
export const findOrCreateTags = async (tagNames = []) => {
    const ids = [];

    for (const name of tagNames) {
        if (!name || !name.trim()) continue;
        const id = await findOrCreateTagByName(name);
        ids.push(id);
    }

    return ids;
};

// --------------------------------------------------
// Fetch all tags with their question count
// --------------------------------------------------
export const getAllTagsSQL = async () => {
    return await query(`
        SELECT 
            t.id,
            t.name,
            COUNT(qt.question_id) AS questionCount
        FROM tags t
        LEFT JOIN question_tags qt ON qt.tag_id = t.id
        GROUP BY t.id
        ORDER BY questionCount DESC
    `);
};

// --------------------------------------------------
// Fetch paginated questions for a given tag
// --------------------------------------------------
export const getQuestionsForTagSQL = async (tagId, limit, offset) => {
    return await query(
        `
        SELECT 
            q.id,
            q.title,
            q.body,
            q.asked_by,
            q.created_at,
            q.updated_at
        FROM questions q
        JOIN question_tags qt ON q.id = qt.question_id
        WHERE qt.tag_id = ?
        ORDER BY q.created_at DESC
        LIMIT ? OFFSET ?
        `,
        [tagId, limit, offset]
    );
};

export const countQuestionsForTagSQL = async (tagId) => {
    const rows = await query(
        `SELECT COUNT(*) AS count FROM question_tags WHERE tag_id = ?`,
        [tagId]
    );
    return rows[0].count;
};
