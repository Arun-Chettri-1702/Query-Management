import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { questionsAPI } from "../services/api";
import QuestionItem from "../components/QuestionItem";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";

const HomePage = () => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [filter, setFilter] = useState("newest");

    // ✅ For searching
    const [searchQuery, setSearchQuery] = useState("");
    const [submittedSearch, setSubmittedSearch] = useState("");

    // ✅ For pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const questionsPerPage = 10;

    const { user } = useAuth();

    // ✅ Fetch questions whenever filter, page, or search changes
    useEffect(() => {
        fetchQuestions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter, currentPage, submittedSearch]);

    const fetchQuestions = async () => {
        try {
            setLoading(true);
            setError("");

            const params = {
                page: currentPage,
                limit: questionsPerPage,
            };

            // Apply filters
            if (filter === "votes") params.sort = "votes";
            if (filter === "unanswered") params.unanswered = "true";

            // Apply search if provided
            if (submittedSearch.trim()) params.search = submittedSearch.trim();

            const data = await questionsAPI.getAll(params);

            setQuestions(data.questions || []);
            setTotalPages(data.totalPages || 1);
        } catch (err) {
            setError(err.message || "Failed to fetch questions");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        setSubmittedSearch(searchQuery);
    };

    const handlePageChange = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // ✅ Render pagination buttons
    const renderPagination = () => {
        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(
            1,
            currentPage - Math.floor(maxVisiblePages / 2)
        );
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                        currentPage === i
                            ? "bg-blue-600 text-white"
                            : "border border-gray-300 hover:bg-gray-50 text-gray-700"
                    }`}
                >
                    {i}
                </button>
            );
        }

        return pages;
    };

    // ✅ Loading State
    if (loading) {
        return <LoadingSpinner fullScreen />;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        All Questions
                    </h1>
                    <p className="text-gray-600 mt-1">
                        {questions.length} question
                        {questions.length !== 1 ? "s" : ""}
                    </p>
                </div>
                {user && (
                    <Link
                        to="/ask"
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                    >
                        Ask Question
                    </Link>
                )}
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mb-6">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search questions by title or body..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-3 pl-12 pr-24 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <svg
                        className="absolute left-3 top-3.5 w-5 h-5 text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z"
                        />
                    </svg>
                    <button
                        type="submit"
                        className="absolute right-2 top-2 bg-blue-600 text-white px-4 py-1.5 rounded-md hover:bg-blue-700 transition"
                    >
                        Search
                    </button>
                </div>
            </form>

            {/* Filters */}
            <div className="flex gap-3 mb-6">
                {["newest", "votes", "unanswered"].map((type) => (
                    <button
                        key={type}
                        onClick={() => {
                            setFilter(type);
                            setCurrentPage(1);
                        }}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                            filter === type
                                ? "bg-blue-600 text-white"
                                : "border border-gray-300 hover:bg-gray-50 text-gray-700"
                        }`}
                    >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                ))}
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4 border border-red-200">
                    {error}
                </div>
            )}

            {/* Question List */}
            {questions.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {submittedSearch
                            ? "No questions found"
                            : "No questions yet"}
                    </h3>
                    <p className="text-gray-600 mb-6">
                        {submittedSearch
                            ? "Try a different search term"
                            : "Be the first to ask a question!"}
                    </p>
                    {user && !submittedSearch && (
                        <Link
                            to="/ask"
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                        >
                            Ask a Question
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {questions.map((question) => (
                        <QuestionItem key={question._id} question={question} />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {questions.length > 0 && totalPages > 1 && (
                <div className="mt-8 flex justify-center items-center gap-2">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 rounded-lg font-medium border transition ${
                            currentPage === 1
                                ? "text-gray-400 border-gray-200 cursor-not-allowed"
                                : "border-gray-300 hover:bg-gray-50 text-gray-700"
                        }`}
                    >
                        Previous
                    </button>

                    {currentPage > 3 && (
                        <span className="text-gray-500">...</span>
                    )}
                    {renderPagination()}
                    {currentPage < totalPages - 2 && (
                        <span className="text-gray-500">...</span>
                    )}

                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-4 py-2 rounded-lg font-medium border transition ${
                            currentPage === totalPages
                                ? "text-gray-400 border-gray-200 cursor-not-allowed"
                                : "border-gray-300 hover:bg-gray-50 text-gray-700"
                        }`}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default HomePage;
