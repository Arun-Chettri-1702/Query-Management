import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { questionsAPI, answersAPI, commentsAPI } from "../services/api";
import AnswerItem from "../components/AnswerItem";
import CommentList from "../components/CommentList";
import Tag from "../components/ui/Tag";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import EditQuestionModal from "../components/EditQuestionModal";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import { useAuth } from "../hooks/useAuth";

const QuestionDetailPage = () => {
    const { questionId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [question, setQuestion] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [answerBody, setAnswerBody] = useState("");
    const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);

    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchQuestionData();
    }, [questionId]);

    const fetchQuestionData = async () => {
        let questionData = null;
        try {
            setLoading(true);
            setError("");

            questionData = await questionsAPI.getById(questionId);
            setQuestion(questionData);

            const answersData = await questionsAPI.getAnswers(questionId);
            setAnswers(answersData.answers || answersData);

            const commentsData = await questionsAPI.getComments(questionId);
            setComments(commentsData.comments || commentsData);
        } catch (err) {
            if (err.response && err.response.status === 401) {
                setError("You must be logged in to view answers and comments.");
                if (questionData) setQuestion(questionData);
            } else if (err.response && err.response.status === 404) {
                setError("This question could not be found.");
            } else {
                setError(err.message || "Failed to load question");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateQuestion = async (updatedData) => {
        try {
            const response = await questionsAPI.update(questionId, updatedData);
            setQuestion(response.updatedQuestion);
            setShowEditModal(false);
        } catch (err) {
            console.error("Failed to update question:", err);
            throw new Error(err.message || "Failed to update question");
        }
    };

    const handleDeleteQuestion = async () => {
        try {
            setIsDeleting(true);
            await questionsAPI.delete(questionId);
            setShowDeleteModal(false);
            navigate("/");
        } catch (err) {
            alert(err.message || "Failed to delete question");
            setIsDeleting(false);
        }
    };

    const handleVoteAnswer = async (answerId, voteType) => {
        if (!user) {
            alert("Please login to vote");
            return;
        }

        try {
            await answersAPI.vote(answerId, voteType);

            setAnswers(
                answers.map((answer) => {
                    if (answer._id === answerId) {
                        const currentVote = answer.userVote;
                        let newScore = answer.voteCount || 0;

                        if (currentVote === voteType) {
                            newScore -= voteType;
                            return {
                                ...answer,
                                voteCount: newScore,
                                userVote: null,
                            };
                        } else if (currentVote) {
                            newScore += voteType * 2;
                            return {
                                ...answer,
                                voteCount: newScore,
                                userVote: voteType,
                            };
                        } else {
                            newScore += voteType;
                            return {
                                ...answer,
                                voteCount: newScore,
                                userVote: voteType,
                            };
                        }
                    }
                    return answer;
                })
            );
        } catch (err) {
            alert(err.message || "Failed to vote");
        }
    };

    const handleSubmitAnswer = async (e) => {
        e.preventDefault();
        if (!answerBody.trim()) return;

        try {
            setIsSubmittingAnswer(true);
            const data = await answersAPI.create(questionId, {
                body: answerBody,
            });
            setAnswers([...answers, data.answer]);
            setAnswerBody("");
        } catch (err) {
            alert(err.message || "Failed to submit answer");
        } finally {
            setIsSubmittingAnswer(false);
        }
    };

    const handleAddComment = async (commentBody) => {
        try {
            const data = await commentsAPI.createOnQuestion(questionId, {
                body: commentBody,
            });
            setComments([...comments, data.comment]);
        } catch (err) {
            console.error("Failed to add comment:", err);
        }
    };

    const handleDeleteAnswer = async (answerId) => {
        if (!window.confirm("Are you sure you want to delete this answer?")) {
            return;
        }

        try {
            await answersAPI.delete(answerId);
            setAnswers(answers.filter((answer) => answer._id !== answerId));
        } catch (err) {
            alert(err.message || "Failed to delete answer");
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const handleUpdateAnswer = async (answerId, updatedData) => {
        try {
            const response = await answersAPI.update(answerId, updatedData);
            setAnswers(
                answers.map((answer) =>
                    answer._id === answerId
                        ? response.updatedAnswer || response.answer
                        : answer
                )
            );
        } catch (err) {
            console.error("Failed to update answer:", err);
            throw new Error(err.message || "Failed to update answer");
        }
    };

    if (loading) return <LoadingSpinner fullScreen />;

    if (error && !question) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
                    {error}
                </div>
            </div>
        );
    }

    if (!question) return null;

    const isQuestionAuthor =
        user &&
        question.askedBy &&
        user._id === (question.askedBy?._id || question.askedBy);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Question Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                    {question.title}
                </h1>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span>Asked {formatDate(question.createdAt)}</span>
                </div>
            </div>

            <div className="flex gap-6">
                {/* Main Content */}
                <div className="flex-1">
                    {/* Question */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <div className="prose max-w-none mb-4">
                                    <p className="text-gray-800 whitespace-pre-wrap">
                                        {question.body}
                                    </p>
                                </div>

                                {/* Tags */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {question.tags?.map((tag) => (
                                        <Tag key={tag._id} name={tag.name} />
                                    ))}
                                </div>

                                {/* Actions & Author */}
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-4">
                                        <button className="text-sm text-gray-600 hover:text-blue-600">
                                            Share
                                        </button>
                                        {isQuestionAuthor && (
                                            <>
                                                <button
                                                    onClick={() =>
                                                        setShowEditModal(true)
                                                    }
                                                    className="text-sm text-gray-600 hover:text-blue-600"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setShowDeleteModal(true)
                                                    }
                                                    className="text-sm text-gray-600 hover:text-red-600"
                                                    disabled={isDeleting}
                                                >
                                                    {isDeleting
                                                        ? "Deleting..."
                                                        : "Delete"}
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    {/* Author Card */}
                                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                                        <div className="text-xs text-gray-600 mb-1">
                                            asked{" "}
                                            {formatDate(question.createdAt)}
                                        </div>
                                        <Link
                                            to={`/users/${
                                                question.askedBy?._id ||
                                                question.askedBy
                                            }`}
                                            className="flex items-center gap-2 hover:bg-blue-100 rounded px-2 py-1 transition"
                                        >
                                            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded flex items-center justify-center">
                                                <span className="text-white text-sm font-semibold">
                                                    {question.askedBy?.name
                                                        ?.charAt(0)
                                                        .toUpperCase() || "U"}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-gray-900">
                                                    {question.askedBy?.name ||
                                                        "Anonymous"}
                                                </div>
                                            </div>
                                        </Link>
                                    </div>
                                </div>

                                {/* Comments */}
                                <CommentList
                                    comments={comments}
                                    onAddComment={handleAddComment}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Answers Section */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            {answers.length}{" "}
                            {answers.length === 1 ? "Answer" : "Answers"}
                        </h2>

                        {answers.length > 0 ? (
                            <div className="divide-y divide-gray-200">
                                {answers.map((answer) => {
                                    const isAnswerAuthor =
                                        user &&
                                        answer.author_id &&
                                        user._id ===
                                            (answer.author_id?._id ||
                                                answer.author_id);
                                    return (
                                        <AnswerItem
                                            key={answer._id}
                                            answer={answer}
                                            onVote={handleVoteAnswer}
                                            onDeleteAnswer={handleDeleteAnswer}
                                            canEdit={isAnswerAuthor}
                                        />
                                    );
                                })}
                            </div>
                        ) : (
                            !error && (
                                <p className="text-gray-600 text-center py-8">
                                    No answers yet. Be the first to answer!
                                </p>
                            )
                        )}

                        {/* Answer Form */}
                        {user ? (
                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <h3 className="text-xl font-bold text-gray-900 mb-4">
                                    Your Answer
                                </h3>
                                <form onSubmit={handleSubmitAnswer}>
                                    <textarea
                                        value={answerBody}
                                        onChange={(e) =>
                                            setAnswerBody(e.target.value)
                                        }
                                        placeholder="Write your answer here..."
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                        rows="8"
                                    />
                                    <button
                                        type="submit"
                                        disabled={
                                            isSubmittingAnswer ||
                                            !answerBody.trim()
                                        }
                                        className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
                                    >
                                        {isSubmittingAnswer
                                            ? "Posting..."
                                            : "Post Your Answer"}
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                                <p className="text-gray-600 mb-4">
                                    You must be logged in to post an answer.
                                </p>
                                <Link
                                    to="/login"
                                    className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
                                >
                                    Log In to Answer
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <aside className="hidden lg:block w-80">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                        <h3 className="font-semibold text-gray-900 mb-2">
                            Related Questions
                        </h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a
                                    href="#"
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    How to center a div?
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    What is the difference between let and var?
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    Best practices for React hooks
                                </a>
                            </li>
                        </ul>
                    </div>
                </aside>
            </div>

            {/* Modals */}
            {showEditModal && (
                <EditQuestionModal
                    question={question}
                    onClose={() => setShowEditModal(false)}
                    onSave={handleUpdateQuestion}
                />
            )}

            {showDeleteModal && (
                <DeleteConfirmModal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    onConfirm={handleDeleteQuestion}
                    title="Delete Question"
                    message="Are you sure you want to delete this question? This action cannot be undone."
                    isDeleting={isDeleting}
                />
            )}
        </div>
    );
};

export default QuestionDetailPage;
