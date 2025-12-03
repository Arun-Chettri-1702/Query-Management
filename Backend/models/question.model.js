// models/question.model.js
import { query } from "../db/index.js";



// Find tag by name
export const findTagByName = async (name) => {
    const rows = await query("SELECT * FROM tags WHERE name = ? LIMIT 1", [
        name,
    ]);
    return rows[0] || null;
};

// Create tag
export const createTag = async (name) => {
    // store normalized lower-case tag names
    const lower = String(name || "")
        .trim()
        .toLowerCase();
    const result = await query("INSERT INTO tags (name) VALUES (?)", [lower]);
    return result.insertId;
};

// Find or create multiple tags → return array of IDs
export const findOrCreateTags = async (tagNames = []) => {
    const ids = [];

    for (const tagName of tagNames) {
        const raw = String(tagName || "").trim();
        if (!raw) continue;
        const lower = raw.toLowerCase();

        let tag = await findTagByName(lower);
        if (!tag) {
            const id = await createTag(lower);
            ids.push(id);
        } else {
            ids.push(tag.id);
        }
    }

    return ids;
};



// Create a question
export const createQuestion = async ({ title, body, askedBy }) => {
    const result = await query(
        `
        INSERT INTO questions (title, body, asked_by)
        VALUES (?, ?, ?)
        `,
        [title, body, askedBy]
    );

    return result.insertId;
};

// Safe insert tags for question (no duplicates)
export const addTagsToQuestion = async (questionId, tagIds = []) => {
    for (const tagId of tagIds) {
        // INSERT IGNORE prevents duplicate (question_id, tag_id) errors
        await query(
            `
            INSERT IGNORE INTO question_tags (question_id, tag_id)
            VALUES (?, ?)
        `,
            [questionId, tagId]
        );
    }
};

// Remove all tags of a question
export const removeTagsFromQuestion = async (questionId) => {
    await query(`DELETE FROM question_tags WHERE question_id = ?`, [
        questionId,
    ]);
};

// Get tags for a question
export const getTagsForQuestionSQL = async (questionId) => {
    return await query(
        `
        SELECT t.id, t.name
        FROM tags t
        JOIN question_tags qt ON qt.tag_id = t.id
        WHERE qt.question_id = ?
        ORDER BY t.name
        `,
        [questionId]
    );
};

// Get full question + askedBy + tags + answerCount
export const getQuestionByIdFull = async (id) => {
    const rows = await query(
        `
        SELECT 
            q.id, q.title, q.body, q.vote_count,
            q.created_at, q.updated_at, q.asked_by,
            u.id AS askedBy_id, u.name AS askedBy_name
        FROM questions q
        JOIN users u ON q.asked_by = u.id
        WHERE q.id = ?
        LIMIT 1
        `,
        [id]
    );

    const q = rows[0];
    if (!q) return null;

    const tags = await getTagsForQuestionSQL(id);

    const answers = await query(
        `SELECT COUNT(*) AS answerCount FROM answers WHERE question_id = ?`,
        [id]
    );

    // Normalize to frontend expectations:
    // - keep id (numeric)
    // - add _id for legacy code
    // - createdAt/updatedAt camelCase
    // - askedBy as object with both id and _id + name
    return {
        id: q.id,
        _id: q.id,
        title: q.title,
        body: q.body,
        vote_count: q.vote_count,
        created_at: q.created_at,
        updated_at: q.updated_at,
        createdAt: q.created_at,
        updatedAt: q.updated_at,
        askedBy: {
            id: q.askedBy_id,
            _id: q.askedBy_id,
            name: q.askedBy_name,
        },
        asked_by: q.asked_by,
        tags: tags.map((t) => ({ id: t.id, name: t.name })),
        answerCount: answers[0]?.answerCount || 0,
    };
};


export const getAllQuestionsSQL = async ({
    search,
    unanswered,
    sort,
    skip,
    limit,
}) => {
    // params holds values for '?' placeholders in the WHERE clauses
    const params = [];
    const whereParts = [];

    /* ----------------------------
       Unanswered filter
    ---------------------------- */
    if (unanswered === "true") {
        whereParts.push(
            `NOT EXISTS (SELECT 1 FROM answers a WHERE a.question_id = q.id)`
        );
    } else if (unanswered === "false") {
        whereParts.push(
            `EXISTS (SELECT 1 FROM answers a WHERE a.question_id = q.id)`
        );
    }

    /* ----------------------------
       Search logic (OR logic)
    ---------------------------- */
    if (search) {
        const like = `%${search}%`;
        // Order must match placeholders below
        params.push(like, like, like);
        whereParts.push(`(
            q.title LIKE ?
            OR q.body LIKE ?
            OR EXISTS (
                SELECT 1 FROM question_tags qt JOIN tags t ON t.id = qt.tag_id
                WHERE qt.question_id = q.id AND t.name LIKE ?
            )
        )`);
    }

    const whereSQL = whereParts.length
        ? "WHERE " + whereParts.join(" AND ")
        : "";

    /* ----------------------------
       Sorting
    ---------------------------- */
    let orderSQL = "ORDER BY q.created_at DESC";
    if (sort === "votes") {
        orderSQL = "ORDER BY q.vote_count DESC, q.created_at DESC";
    }

    /* ----------------------------
       LIMIT/OFFSET - avoid using placeholders for DB drivers that choke
       when mixing prepared placeholders with templated LIMIT/OFFSET.
       We sanitize/validate numeric input and interpolate safely.
    ---------------------------- */
    const safeLimit = Number(limit) > 0 ? Number(limit) : 10;
    const safeSkip = Number(skip) >= 0 ? Number(skip) : 0;

    const mainSQL = `
        SELECT
            q.id, q.title, q.body, q.vote_count,
            q.created_at, q.updated_at,
            u.id AS askedBy_id, u.name AS askedBy_name,
            (SELECT COUNT(*) FROM answers a WHERE a.question_id = q.id) AS answerCount
        FROM questions q
        JOIN users u ON u.id = q.asked_by
        ${whereSQL}
        ${orderSQL}
        LIMIT ${safeLimit} OFFSET ${safeSkip}
    `;

    // Execute main query with only the WHERE params
    const rows = await query(mainSQL, params);

    /* ----------------------------
       Total count (same WHERE clauses)
    ---------------------------- */
    const totalSQL = `
        SELECT COUNT(*) AS total
        FROM questions q
        ${whereSQL}
    `;
    const totalRows = await query(totalSQL, params);
    const total = totalRows[0]?.total || 0;

    /* ----------------------------
       Attach tags & normalize rows for frontend
    ---------------------------- */
    for (const q of rows) {
        const tags = await getTagsForQuestionSQL(q.id);
        q.tags = tags.map((t) => ({ id: t.id, name: t.name }));

        // Normalize fields so frontend can use either id or _id and createdAt
        q._id = q.id;
        q.createdAt = q.created_at;
        q.updatedAt = q.updated_at;
        q.askedBy = {
            id: q.askedBy_id,
            _id: q.askedBy_id,
            name: q.askedBy_name,
        };

        // keep legacy column names too (in case other controllers expect them)
        q.created_at = q.created_at;
        q.updated_at = q.updated_at;
        q.asked_by = q.asked_by;
    }

    return { questions: rows, total };
};


export const getQuestionsByUserId = async (userId) => {
    const rows = await query(
        `
        SELECT 
            q.id, q.title, q.body, q.vote_count,
            q.created_at, q.updated_at, q.asked_by,
            u.name as owner_name
        FROM questions q
        JOIN users u ON u.id = q.asked_by
        WHERE q.asked_by = ?
        ORDER BY q.created_at DESC
        `,
        [userId]
    );

    // normalize to frontend expectations
    for (const q of rows) {
        const tags = await getTagsForQuestionSQL(q.id);
        q.tags = tags.map((t) => ({ id: t.id, name: t.name }));

        q._id = q.id;
        q.createdAt = q.created_at;
        q.updatedAt = q.updated_at;
        q.askedBy = { id: q.asked_by, _id: q.asked_by, name: q.owner_name };
    }

    return rows;
};

export const updateQuestionSQL = async (questionId, fields) => {
    const columns = [];
    const values = [];

    if (fields.title) {
        columns.push("title = ?");
        values.push(fields.title);
    }
    if (fields.body) {
        columns.push("body = ?");
        values.push(fields.body);
    }

    if (columns.length === 0) return;

    const sql = `
        UPDATE questions
        SET ${columns.join(", ")}
        WHERE id = ?
    `;

    values.push(questionId);

    await query(sql, values);
};

/* -------------------------------------------------------
   DELETE QUESTION
------------------------------------------------------- */
export const deleteQuestionSQL = async (questionId) => {
    await query(
        `
        DELETE FROM questions
        WHERE id = ?
        `,
        [questionId]
    );
};
