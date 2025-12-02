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

            const params = { page: currentPage, limit: questionsPerPage };
            const data = await tagsAPI.getQuestions(tagName, params);

            const normalized = (data.questions || []).map((q) => ({
                ...q,
                id: q.id || q._id,
                createdAt: q.createdAt || q.created_at,
                voteCount: q.voteCount ?? q.vote_count ?? 0,
            }));

            setQuestions(normalized);
            setTagInfo(data.tag || null);
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
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
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

    if (error)
        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
                    {error}
                </div>
            </div>
        );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <span className="inline-block bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-lg font-semibold">
                            {tagInfo?.name || tagName}
                        </span>
                        <div className="text-gray-600 text-sm mt-2">
                            {totalQuestions} question
                            {totalQuestions !== 1 ? "s" : ""}
                        </div>
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
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
                <Link to="/" className="hover:text-blue-600">
                    Home
                </Link>
                <span>›</span>
                <Link to="/tags" className="hover:text-blue-600">
                    Tags
                </Link>
                <span>›</span>
                <span className="font-medium text-gray-900">{tagName}</span>
            </div>

            {questions.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        No questions yet
                    </h3>
                    <p className="text-gray-600 mb-6">
                        Be the first to ask a question with the{" "}
                        <strong>{tagName}</strong> tag!
                    </p>
                    {user && (
                        <Link
                            to="/ask"
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                        >
                            Ask a Question
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {questions.map((q) => (
                        <QuestionItem key={q.id} question={q} />
                    ))}
                </div>
            )}

            {questions.length > 0 && totalPages > 1 && (
                <div className="mt-8 flex justify-center items-center gap-2">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 border rounded-lg ${
                            currentPage === 1
                                ? "text-gray-400 border-gray-200 cursor-not-allowed"
                                : "border-gray-300 hover:bg-gray-50 text-gray-700"
                        }`}
                    >
                        Previous
                    </button>

                    {renderPagination()}

                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-4 py-2 border rounded-lg ${
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
