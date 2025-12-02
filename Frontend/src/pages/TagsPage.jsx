import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { tagsAPI } from "../services/api";
import LoadingSpinner from "../components/ui/LoadingSpinner";

const TagsPage = () => {
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchTags();
    }, []);

    const fetchTags = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await tagsAPI.getAll();
            setTags(data.tags || data);
        } catch (err) {
            setError(err.message || "Failed to fetch tags");
        } finally {
            setLoading(false);
        }
    };

    const filteredTags = tags.filter((tag) =>
        tag.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <LoadingSpinner fullScreen />;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Tags</h1>
                <p className="text-gray-600">
                    A tag is a keyword or label that categorizes your question.
                </p>
            </div>

            <div className="mb-6">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Filter by tag name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-96 px-4 py-3 pl-11 border border-gray-300 rounded-lg"
                    />
                    <svg
                        className="absolute left-3 top-3.5 w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            {filteredTags.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                    <p className="text-gray-600">
                        No tags found matching "{searchTerm}"
                    </p>
                </div>
            ) : (
                <>
                    <div className="mb-4 text-sm text-gray-600">
                        {filteredTags.length} tag
                        {filteredTags.length !== 1 ? "s" : ""}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredTags.map((tag) => (
                            <Link
                                key={tag.id}
                                to={`/tags/${tag.name}`}
                                className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-blue-300 transition"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                                        {tag.name}
                                    </span>
                                    <span className="text-2xl font-bold text-gray-900">
                                        {tag.questionCount || 0}
                                    </span>
                                </div>
                                <div className="mt-3 text-xs text-gray-500">
                                    {tag.questionCount || 0} question
                                    {tag.questionCount !== 1 ? "s" : ""}
                                </div>
                            </Link>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default TagsPage;
