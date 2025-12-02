import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { usersAPI } from "../services/api";
import QuestionItem from "../components/QuestionItem";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";

const UserProfilePage = () => {
    const { userId } = useParams();
    const { user: loggedInUser } = useAuth();

    // Proper self-profile check (fix #1)
    const isOwnProfile =
        loggedInUser &&
        String(loggedInUser.id || loggedInUser._id) === String(userId);

    const [profileUser, setProfileUser] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState([]);
    const [activeTab, setActiveTab] = useState("questions");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchUserData();
    }, [userId, isOwnProfile]);

    const fetchUserData = async () => {
        try {
            setLoading(true);
            setError("");

            const [u, q, a] = await Promise.all([
                usersAPI.getById(userId),
                usersAPI.getQuestions(userId),
                isOwnProfile
                    ? usersAPI.getAnswers()
                    : Promise.resolve({ answers: [] }),
            ]);

            // Normalize questions
            const normalizedQuestions = (q.questions || []).map((x) => ({
                ...x,
                id: x.id || x._id,
                createdAt: x.createdAt || x.created_at,
                voteCount: x.voteCount ?? x.vote_count ?? 0,
            }));

            // Normalize answers
            const normalizedAnswers = (a.answers || []).map((x) => ({
                ...x,
                id: x.id || x._id,
                _id: x.id || x._id,
                createdAt: x.createdAt || x.created_at,
                voteCount: x.voteCount ?? x.vote_count ?? 0,
                questionId: x.question?.id || x.question_id || x.questionId,
            }));

            setProfileUser(u);
            setQuestions(normalizedQuestions);
            setAnswers(normalizedAnswers);
        } catch (err) {
            if (err.response?.status === 404) setError("User not found.");
            else setError(err.message || "Failed to load profile.");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
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

    if (!profileUser) return null;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Profile Header */}
            <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
                <div className="flex items-start gap-6">
                    <div className="w-32 h-32 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-5xl font-bold">
                            {profileUser.name?.charAt(0).toUpperCase() || "U"}
                        </span>
                    </div>

                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {profileUser.name}
                        </h1>

                        <div className="flex items-center gap-4 text-gray-600 mb-4">
                            <span>{profileUser.email}</span>
                            <span>
                                Member since {formatDate(profileUser.createdAt)}
                            </span>
                        </div>

                        <div className="flex gap-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-green-600">
                                    {questions.length}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Questions
                                </div>
                            </div>

                            <div className="text-center">
                                <div className="text-3xl font-bold text-purple-600">
                                    {answers.length}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Answers
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {profileUser.bio && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-2">
                            About
                        </h3>
                        <p className="text-gray-700">{profileUser.bio}</p>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg border border-gray-200">
                <div className="border-b border-gray-200 flex gap-1 px-6">
                    <button
                        onClick={() => setActiveTab("questions")}
                        className={`px-6 py-4 font-medium border-b-2 ${
                            activeTab === "questions"
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-gray-600"
                        }`}
                    >
                        Questions ({questions.length})
                    </button>

                    {isOwnProfile && (
                        <button
                            onClick={() => setActiveTab("answers")}
                            className={`px-6 py-4 font-medium border-b-2 ${
                                activeTab === "answers"
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-gray-600"
                            }`}
                        >
                            Answers ({answers.length})
                        </button>
                    )}
                </div>

                <div className="p-6">
                    {/* Questions */}
                    {activeTab === "questions" && (
                        <div>
                            {questions.length === 0 ? (
                                <p className="text-center text-gray-600 py-12">
                                    No questions asked yet.
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {questions.map((q) => (
                                        <QuestionItem
                                            key={q.id || q._id}
                                            question={q}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Answers */}
                    {activeTab === "answers" && isOwnProfile && (
                        <div>
                            {answers.length === 0 ? (
                                <p className="text-center text-gray-600 py-12">
                                    No answers posted yet.
                                </p>
                            ) : (
                                <div className="space-y-6">
                                    {answers.map((a) => (
                                        <div
                                            key={a._id}
                                            className="border-b pb-6"
                                        >
                                            <div className="font-semibold mb-2">
                                                {a.voteCount} votes
                                            </div>

                                            <Link
                                                to={`/questions/${a.questionId}`}
                                                className="text-blue-600 hover:text-blue-800 font-semibold"
                                            >
                                                {a.question?.title ||
                                                    "View Question"}
                                            </Link>

                                            <p className="text-gray-700 mt-2 line-clamp-3">
                                                {a.body}
                                            </p>

                                            <div className="text-sm text-gray-500 mt-1">
                                                Answered{" "}
                                                {formatDate(a.createdAt)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfilePage;
