import axiosInstance from "../config/axios.js";

// Questions API
export const questionsAPI = {
    // Get all questions (you'll need to add this route in backend)
    getAll: async (params = {}) => {
        const response = await axiosInstance.get("/questions", { params });
        return response.data;
    },

    // Get single question
    getById: async (id) => {
        const response = await axiosInstance.get(
            `/questions/getQuestionById/${id}`
        );
        return response.data;
    },

    // Create question
    create: async (questionData) => {
        const response = await axiosInstance.post(
            "/questions/createQuestion",
            questionData
        );
        return response.data;
    },

    // Update question
    update: async (id, questionData) => {
        const response = await axiosInstance.patch(
            `/questions/updateQuestion/${id}`,
            questionData
        );
        return response.data;
    },

    // Delete question
    delete: async (id) => {
        const response = await axiosInstance.delete(
            `/questions/deleteQuestion/${id}`
        );
        return response.data;
    },

    // Get question's answers
    getAnswers: async (questionId) => {
        const response = await axiosInstance.get(
            `/answers/getAnswersForQuestion/${questionId}`
        );
        return response.data;
    },

    // Get question's comments
    getComments: async (questionId) => {
        const response = await axiosInstance.get(
            `/questions/${questionId}/comments/getComments`
        );
        return response.data;
    },
};

// Answers API
export const answersAPI = {
    // Create answer
    create: async (questionId, answerData) => {
        const response = await axiosInstance.post(
            `/answers/postAnswer/${questionId}`,
            answerData
        );
        return response.data;
    },

    // Update answer
    update: async (answerId, answerData) => {
        const response = await axiosInstance.patch(
            `/answers/updateAnswer/${answerId}`,
            answerData
        );
        return response.data;
    },

    // Delete answer
    delete: async (answerId) => {
        const response = await axiosInstance.delete(
            `/answers/deleteAnswer/${answerId}`
        );
        return response.data;
    },

    // Vote on answer
    vote: async (answerId, voteType) => {
        const response = await axiosInstance.post(`/answers/${answerId}/vote`, {
            voteType,
        });
        return response.data;
    },

    // Get answer's comments
    getComments: async (answerId) => {
        const response = await axiosInstance.get(
            `/answers/${answerId}/comments/getComments`
        );
        return response.data;
    },
};

// Comments API
export const commentsAPI = {
    // Create comment on question
    createOnQuestion: async (questionId, commentData) => {
        const response = await axiosInstance.post(
            `/questions/${questionId}/comments/createComment`,
            commentData
        );
        return response.data;
    },

    // Create comment on answer
    createOnAnswer: async (answerId, commentData) => {
        const response = await axiosInstance.post(
            `/answers/${answerId}/comments/createComment`,
            commentData
        );
        return response.data;
    },

    // Update comment
    update: async (commentId, commentData) => {
        const response = await axiosInstance.patch(
            `/comments/updateComment/${commentId}`,
            commentData
        );
        return response.data;
    },

    // Delete comment
    delete: async (commentId) => {
        const response = await axiosInstance.delete(
            `/comments/deleteComment/${commentId}`
        );
        return response.data;
    },
};

// Users API
export const usersAPI = {
    // Register user
    register: async (userData) => {
        const response = await axiosInstance.post(
            "/users/registerUser",
            userData
        );
        return response.data;
    },

    // Login user
    login: async (credentials) => {
        const response = await axiosInstance.post(
            "/users/loginUser",
            credentials
        );
        return response.data;
    },

    // Logout user
    logout: async () => {
        const response = await axiosInstance.post("/users/logoutUser");
        return response.data;
    },

    // Get user profile (you'll need to add this route in backend)
    getById: async (userId) => {
        const response = await axiosInstance.get(`/users/${userId}`);
        return response.data;
    },

    // Get user's questions
    getQuestions: async (userId) => {
        const response = await axiosInstance.get(
            `/questions/getUserQuestions/${userId}`
        );
        return response.data;
    },

    // Get user's answers
    getAnswers: async () => {
        const response = await axiosInstance.get(`/answers/getAnswersForUser`);
        return response.data;
    },

    // refresh tokens
    refreshToken: async () => {
        const response = await axiosInstance.post("/users/refresh-token");
        return response.data;
    },
};

// Tags API
export const tagsAPI = {
    // Get all tags
    getAll: async () => {
        const response = await axiosInstance.get("/tags");
        return response.data;
    },

    // Get tag by name (you'll need to add this route in backend)
    getByName: async (tagName) => {
        const response = await axiosInstance.get(`/tags/${tagName}`);
        return response.data;
    },

    // Get questions by tag
    getQuestions: async (tagName,params) => {
        const response = await axiosInstance.get(`/tags/${tagName}/questions`,{ params });
        return response.data;
    },
};
