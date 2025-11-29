import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { tagsAPI } from "../services/api";
import QuestionItem from "../components/QuestionItem";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";

const TagQuestionsPage = () => {
    const { tagName } = useParams();
    const { user } = useAuth();

    const [questions, setQuestions] = useState([]);
    const [tagInfo, setTagInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const questionsPerPage = 10;

    useEffect(() => {
        fetchTagQuestions();
    }, [tagName, currentPage]);

    const fetchTagQuestions = async () => {
        try {
            setLoading(true);
            setError("");

            const params = {
                page: currentPage,
                limit: questionsPerPage,
            };

            const data = await tagsAPI.getQuestions(tagName, params);

            setQuestions(data.questions || []);
            setTagInfo(data.tag);
            setTotalPages(data.totalPages || 1);
            setTotalQuestions(data.total || 0);
        } catch (err) {
            setError(err.message || "Failed to fetch questions");
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

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

    if (loading) return <LoadingSpinner fullScreen />;

    if (error) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Tag Header */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="inline-block bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-lg font-semibold">
                                {tagInfo?.name || tagName}
                            </span>
                            <span className="text-gray-600">
                                {totalQuestions} question
                                {totalQuestions !== 1 ? "s" : ""}
                            </span>
                        </div>
                        <p className="text-gray-700">
                            Questions tagged with [{tagInfo?.name || tagName}]
                        </p>
                    </div>

                    {user && (
                        <Link
                            to="/ask"
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition whitespace-nowrap"
                        >
                            Ask Question
                        </Link>
                    )}
                </div>
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
                <Link to="/" className="hover:text-blue-600">
                    Home
                </Link>
                <span>›</span>
                <Link to="/tags" className="hover:text-blue-600">
                    Tags
                </Link>
                <span>›</span>
                <span className="text-gray-900 font-medium">{tagName}</span>
            </div>

            {/* Questions List */}
            {questions.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                            className="w-10 h-10 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                            />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        No questions yet
                    </h3>
                    <p className="text-gray-600 mb-6">
                        Be the first to ask a question with the{" "}
                        <span className="font-semibold">{tagName}</span> tag!
                    </p>
                    {user && (
                        <Link
                            to="/ask"
                            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
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

export default TagQuestionsPage;
