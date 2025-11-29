import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { usersAPI } from "../services/api";
import QuestionItem from "../components/QuestionItem";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";

const UserProfilePage = () => {
    const { userId } = useParams();

    // Avoid naming conflict with profile user
    const { user: loggedInUser } = useAuth();

    // State
    const [profileUser, setProfileUser] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState([]);
    const [activeTab, setActiveTab] = useState("questions");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Check if logged-in user is viewing their own profile
    const isOwnProfile = loggedInUser?._id === userId;

    useEffect(() => {
        fetchUserData();
    }, [userId, isOwnProfile]);

    const fetchUserData = async () => {
        try {
            setLoading(true);
            setError("");

            // Fetch all data (parallelized)
            const [userData, questionsData, answersData] = await Promise.all([
                usersAPI.getById(userId),
                usersAPI.getQuestions(userId),
                isOwnProfile
                    ? usersAPI.getAnswers()
                    : Promise.resolve({ answers: [] }),
            ]);

            setProfileUser(userData);
            setQuestions(questionsData.questions || questionsData);
            setAnswers(answersData.answers || answersData);
        } catch (err) {
            if (err.response && err.response.status === 404) {
                setError("User not found.");
            } else {
                setError(err.message || "Failed to load user profile.");
            }
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
            {/* --- User Header --- */}
            <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
                <div className="flex items-start gap-6">
                    {/* Avatar */}
                    <div className="w-32 h-32 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-5xl font-bold">
                            {profileUser.name?.charAt(0).toUpperCase() || "U"}
                        </span>
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {profileUser.name}
                        </h1>
                        <div className="flex items-center gap-4 text-gray-600 mb-4">
                            <div className="flex items-center gap-2">
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                />
                                <span>{profileUser.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                />
                                <span>
                                    Member since{" "}
                                    {formatDate(profileUser.createdAt)}
                                </span>
                            </div>
                        </div>

                        {/* Stats */}
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

                {/* Bio Section */}
                {profileUser.bio && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-2">
                            About
                        </h3>
                        <p className="text-gray-700">{profileUser.bio}</p>
                    </div>
                )}
            </div>

            {/* --- Tabs --- */}
            <div className="bg-white rounded-lg border border-gray-200">
                {/* Tab Header */}
                <div className="border-b border-gray-200">
                    <div className="flex gap-1 px-6">
                        <button
                            onClick={() => setActiveTab("questions")}
                            className={`px-6 py-4 font-medium transition border-b-2 ${
                                activeTab === "questions"
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            Questions ({questions.length})
                        </button>

                        {/* Only show Answers tab for own profile */}
                        {isOwnProfile && (
                            <button
                                onClick={() => setActiveTab("answers")}
                                className={`px-6 py-4 font-medium transition border-b-2 ${
                                    activeTab === "answers"
                                        ? "border-blue-600 text-blue-600"
                                        : "border-transparent text-gray-600 hover:text-gray-900"
                                }`}
                            >
                                Answers ({answers.length})
                            </button>
                        )}
                    </div>
                </div>

                {/* --- Tab Content --- */}
                <div className="p-6">
                    {/* Questions Tab */}
                    {activeTab === "questions" && (
                        <div>
                            {questions.length === 0 ? (
                                <div className="text-center py-12 text-gray-600">
                                    <p>No questions asked yet</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {questions.map((question) => (
                                        <QuestionItem
                                            key={question._id}
                                            question={question}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Answers Tab (Own Profile Only) */}
                    {activeTab === "answers" && isOwnProfile && (
                        <div>
                            {answers.length === 0 ? (
                                <div className="text-center py-12 text-gray-600">
                                    <p>No answers posted yet</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {answers.map((answer) => (
                                        <div
                                            key={answer._id}
                                            className="border-b border-gray-200 pb-6 last:border-0"
                                        >
                                            <div className="flex items-start gap-4 mb-3">
                                                <div>
                                                    <span className="font-semibold">
                                                        {answer.voteCount || 0}
                                                    </span>{" "}
                                                    votes
                                                </div>
                                            </div>
                                            <Link
                                                to={`/questions/${answer.question_id?._id}`}
                                                className="text-blue-600 hover:text-blue-800 font-semibold mb-2 block"
                                            >
                                                {answer.question_id?.title ||
                                                    "View Question"}
                                            </Link>
                                            <p className="text-gray-700 line-clamp-3">
                                                {answer.body}
                                            </p>
                                            <div className="mt-2 text-sm text-gray-500">
                                                Answered{" "}
                                                {formatDate(answer.createdAt)}
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
