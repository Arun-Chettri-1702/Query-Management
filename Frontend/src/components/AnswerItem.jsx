import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import VoteControl from "./VoteControl";
import CommentList from "./CommentList";
import { answersAPI, commentsAPI } from "../services/api";
import { useAuth } from "../hooks/useAuth";

const AnswerItem = ({
    answer,
    onVote,
    onUpdateAnswer,
    onDeleteAnswer,
    canEdit,
}) => {
    const [comments, setComments] = useState([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editBody, setEditBody] = useState(answer.body);
    const [isSaving, setIsSaving] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        fetchComments();
    }, [answer._id]);

    const fetchComments = async () => {
        try {
            setLoadingComments(true);
            const data = await answersAPI.getComments(answer._id);
            setComments(data.comments || data);
        } catch (err) {
            console.error("Failed to fetch comments:", err);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleAddComment = async (commentBody) => {
        try {
            const data = await commentsAPI.createOnAnswer(answer._id, {
                body: commentBody,
            });
            setComments([...comments, data.comment]);
        } catch (err) {
            console.error("Failed to add comment:", err);
        }
    };

    const handleSaveEdit = async () => {
        if (!editBody.trim()) {
            setIsEditing(false);
            return;
        }

        try {
            setIsSaving(true);
            await onUpdateAnswer(answer._id, { body: editBody });
            setIsEditing(false);
        } catch (err) {
            alert(err.message || "Failed to update answer");
        } finally {
            setIsSaving(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="border-b border-gray-200 py-6">
            <div className="flex gap-4">
                {/* Vote Control */}
                <div className="flex-shrink-0">
                    <VoteControl
                        score={answer.voteCount || 0}
                        userVote={answer.userVote}
                        onUpvote={() => onVote(answer._id, 1)}
                        onDownvote={() => onVote(answer._id, -1)}
                        disabled={!user}
                    />
                </div>

                {/* Answer Content */}
                <div className="flex-1">
                    {/* Answer Body */}
                    {isEditing ? (
                        <div className="mb-4">
                            <textarea
                                value={editBody}
                                onChange={(e) => setEditBody(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                rows="8"
                            />
                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={handleSaveEdit}
                                    disabled={isSaving}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-blue-400"
                                >
                                    {isSaving ? "Saving..." : "Save"}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setEditBody(answer.body);
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="prose max-w-none mb-4">
                            <p className="text-gray-800 whitespace-pre-wrap">
                                {answer.body}
                            </p>
                        </div>
                    )}

                    {/* Author Info */}
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-4">
                            <button className="text-sm text-gray-600 hover:text-blue-600">
                                Share
                            </button>
                            {canEdit && !isEditing && (
                                <>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="text-sm text-gray-600 hover:text-blue-600"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() =>
                                            onDeleteAnswer(answer._id)
                                        }
                                        className="text-sm text-gray-600 hover:text-red-600"
                                    >
                                        Delete
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Author Card */}
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                            <div className="text-xs text-gray-600 mb-1">
                                answered {formatDate(answer.createdAt)}
                            </div>
                            <Link
                                to={`/users/${
                                    answer.author_id?._id || answer.author_id
                                }`}
                                className="flex items-center gap-2 hover:bg-blue-100 rounded px-2 py-1 transition"
                            >
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded flex items-center justify-center">
                                    <span className="text-white text-sm font-semibold">
                                        {answer.author_id?.name
                                            ?.charAt(0)
                                            .toUpperCase() || "U"}
                                    </span>
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-gray-900">
                                        {answer.author_id?.name || "Anonymous"}
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Comments */}
                    <CommentList
                        comments={comments}
                        loading={loadingComments}
                        onAddComment={handleAddComment}
                    />
                </div>
            </div>
        </div>
    );
};

export default AnswerItem;
