import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { questionsAPI } from "../services/api";
import { useAuth } from "../hooks/useAuth";

const AskQuestionPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [formData, setFormData] = useState({
        title: "",
        body: "",
        tags: "",
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        // Clear error for this field
        if (errors[name]) {
            setErrors({ ...errors, [name]: "" });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Title validation
        if (!formData.title.trim()) {
            newErrors.title = "Title is required";
        } else if (formData.title.length < 15) {
            newErrors.title = "Title must be at least 15 characters";
        } else if (formData.title.length > 150) {
            newErrors.title = "Title must be less than 150 characters";
        }

        // Body validation
        if (!formData.body.trim()) {
            newErrors.body = "Question body is required";
        } else if (formData.body.length < 30) {
            newErrors.body = "Question body must be at least 30 characters";
        }

        // Tags validation
        if (!formData.tags.trim()) {
            newErrors.tags = "At least one tag is required";
        } else {
            const tagArray = formData.tags
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag);
            if (tagArray.length === 0) {
                newErrors.tags = "At least one tag is required";
            } else if (tagArray.length > 5) {
                newErrors.tags = "Maximum 5 tags allowed";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setIsSubmitting(true);

            // Prepare tags array
            const tagsArray = formData.tags
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag);

            const questionData = {
                title: formData.title.trim(),
                body: formData.body.trim(),
                tags: tagsArray,
            };

            const response = await questionsAPI.create(questionData);

            // Navigate to the newly created question
            console.log(response);
            navigate(`/questions/${response.question.id}`);
        } catch (err) {
            setErrors({ submit: err.message || "Failed to post question" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Ask a Public Question
                </h1>
                <p className="text-gray-600">
                    Get answers from the community by asking a clear, detailed
                    question.
                </p>
            </div>

            {/* Tips Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg
                        className="w-5 h-5 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                        />
                    </svg>
                    Writing a good question
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>Summarize your problem in a one-line title</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>Describe your problem in detail</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>
                            Describe what you've tried and what you expected
                        </span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>Add tags to help others find your question</span>
                    </li>
                </ul>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Global Error */}
                {errors.submit && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
                        {errors.submit}
                    </div>
                )}

                {/* Title */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <label
                        htmlFor="title"
                        className="block text-lg font-semibold text-gray-900 mb-2"
                    >
                        Title
                    </label>
                    <p className="text-sm text-gray-600 mb-3">
                        Be specific and imagine you're asking a question to
                        another person.
                    </p>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g., How do I center a div in CSS?"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.title ? "border-red-500" : "border-gray-300"
                        }`}
                    />
                    {errors.title && (
                        <p className="mt-2 text-sm text-red-600">
                            {errors.title}
                        </p>
                    )}
                    <p className="mt-2 text-xs text-gray-500">
                        {formData.title.length}/150 characters
                    </p>
                </div>

                {/* Body */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <label
                        htmlFor="body"
                        className="block text-lg font-semibold text-gray-900 mb-2"
                    >
                        What are the details of your problem?
                    </label>
                    <p className="text-sm text-gray-600 mb-3">
                        Include all the information someone would need to answer
                        your question.
                    </p>
                    <textarea
                        id="body"
                        name="body"
                        value={formData.body}
                        onChange={handleChange}
                        placeholder="Provide context, what you've tried, error messages, expected vs actual results..."
                        rows="12"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                            errors.body ? "border-red-500" : "border-gray-300"
                        }`}
                    />
                    {errors.body && (
                        <p className="mt-2 text-sm text-red-600">
                            {errors.body}
                        </p>
                    )}
                    <p className="mt-2 text-xs text-gray-500">
                        {formData.body.length} characters (minimum 30)
                    </p>
                </div>

                {/* Tags */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <label
                        htmlFor="tags"
                        className="block text-lg font-semibold text-gray-900 mb-2"
                    >
                        Tags
                    </label>
                    <p className="text-sm text-gray-600 mb-3">
                        Add up to 5 tags to describe what your question is
                        about. Separate tags with commas.
                    </p>
                    <input
                        type="text"
                        id="tags"
                        name="tags"
                        value={formData.tags}
                        onChange={handleChange}
                        placeholder="e.g., javascript, react, css, html, node"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.tags ? "border-red-500" : "border-gray-300"
                        }`}
                    />
                    {errors.tags && (
                        <p className="mt-2 text-sm text-red-600">
                            {errors.tags}
                        </p>
                    )}
                    {formData.tags && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {formData.tags.split(",").map((tag, index) => {
                                const trimmedTag = tag.trim();
                                if (!trimmedTag) return null;
                                return (
                                    <span
                                        key={index}
                                        className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                                    >
                                        {trimmedTag}
                                    </span>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <svg
                                    className="animate-spin h-5 w-5"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        fill="none"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                                Posting...
                            </span>
                        ) : (
                            "Post Your Question"
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="px-8 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                        Cancel
                    </button>
                </div>
            </form>

            {/* Preview Section (Optional Enhancement) */}
            {(formData.title || formData.body) && (
                <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Preview
                    </h3>
                    {formData.title && (
                        <h2 className="text-xl font-bold text-gray-900 mb-3">
                            {formData.title}
                        </h2>
                    )}
                    {formData.body && (
                        <p className="text-gray-700 whitespace-pre-wrap mb-3">
                            {formData.body}
                        </p>
                    )}
                    {formData.tags && (
                        <div className="flex flex-wrap gap-2">
                            {formData.tags.split(",").map((tag, index) => {
                                const trimmedTag = tag.trim();
                                if (!trimmedTag) return null;
                                return (
                                    <span
                                        key={index}
                                        className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                                    >
                                        {trimmedTag}
                                    </span>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AskQuestionPage;
