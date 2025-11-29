import { useState, useEffect } from "react";

const EditQuestionModal = ({ question, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        title: "",
        body: "",
        tags: "",
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Populate form when the modal opens with a question
    useEffect(() => {
        if (question) {
            setFormData({
                title: question.title || "",
                body: question.body || "",
                // Backend sends tags as [{ _id, name }, ...]
                // so we extract only names for editing
                tags: question.tags
                    ? question.tags.map((tag) => tag.name).join(", ")
                    : "",
            });
        }
    }, [question]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        if (errors[name]) {
            setErrors({ ...errors, [name]: "" });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = "Title is required";
        } else if (formData.title.length < 15) {
            newErrors.title = "Title must be at least 15 characters";
        }

        if (!formData.body.trim()) {
            newErrors.body = "Body is required";
        } else if (formData.body.length < 30) {
            newErrors.body = "Body must be at least 30 characters";
        }

        if (!formData.tags.trim()) {
            newErrors.tags = "At least one tag is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            setIsSubmitting(true);

            const tagsArray = formData.tags
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag);

            const updatedData = {
                title: formData.title.trim(),
                body: formData.body.trim(),
                tags: tagsArray,
            };

            await onSave(updatedData);
            onClose();
        } catch (err) {
            setErrors({ submit: err.message || "Failed to update question" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">
                        Edit Question
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {errors.submit && (
                        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
                            {errors.submit}
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label
                            htmlFor="title"
                            className="block text-sm font-semibold text-gray-900 mb-2"
                        >
                            Title
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors.title
                                    ? "border-red-500"
                                    : "border-gray-300"
                            }`}
                        />
                        {errors.title && (
                            <p className="mt-2 text-sm text-red-600">
                                {errors.title}
                            </p>
                        )}
                    </div>

                    {/* Body */}
                    <div>
                        <label
                            htmlFor="body"
                            className="block text-sm font-semibold text-gray-900 mb-2"
                        >
                            Body
                        </label>
                        <textarea
                            id="body"
                            name="body"
                            value={formData.body}
                            onChange={handleChange}
                            rows="10"
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                                errors.body
                                    ? "border-red-500"
                                    : "border-gray-300"
                            }`}
                        />
                        {errors.body && (
                            <p className="mt-2 text-sm text-red-600">
                                {errors.body}
                            </p>
                        )}
                    </div>

                    {/* Tags */}
                    <div>
                        <label
                            htmlFor="tags"
                            className="block text-sm font-semibold text-gray-900 mb-2"
                        >
                            Tags (comma-separated)
                        </label>
                        <input
                            type="text"
                            id="tags"
                            name="tags"
                            value={formData.tags}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors.tags
                                    ? "border-red-500"
                                    : "border-gray-300"
                            }`}
                        />
                        {errors.tags && (
                            <p className="mt-2 text-sm text-red-600">
                                {errors.tags}
                            </p>
                        )}
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditQuestionModal;
