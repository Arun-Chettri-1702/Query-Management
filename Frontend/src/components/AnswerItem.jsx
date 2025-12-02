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
    }, [answer.id]);

    const fetchComments = async () => {
        try {
            setLoadingComments(true);
            const data = await answersAPI.getComments(answer.id);
            setComments(data.comments || data);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleAddComment = async (commentBody) => {
        try {
            const data = await commentsAPI.createOnAnswer(answer.id, {
                body: commentBody,
            });
            setComments([...comments, data.comment]);
        } catch (err) {
            console.error("Failed to add comment:", err);
        }
    };

    const handleSaveEdit = async () => {
        if (!editBody.trim()) return setIsEditing(false);

        try {
            setIsSaving(true);
            await onUpdateAnswer(answer.id, { body: editBody });
            setIsEditing(false);
        } finally {
            setIsSaving(false);
        }
    };

    const formatDate = (d) =>
        new Date(d).toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

    return (
        <div className="border-b border-gray-200 py-6">
            <div className="flex gap-4">
                {/* Votes */}
                <VoteControl
                    score={answer.voteCount}
                    userVote={answer.userVote}
                    onUpvote={() => onVote(answer.id, 1)}
                    onDownvote={() => onVote(answer.id, -1)}
                    disabled={!user}
                />

                <div className="flex-1">
                    {/* BODY */}
                    {isEditing ? (
                        <div>
                            <textarea
                                value={editBody}
                                onChange={(e) => setEditBody(e.target.value)}
                                rows={6}
                                className="w-full border rounded p-3"
                            />
                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={handleSaveEdit}
                                    disabled={isSaving}
                                    className="bg-blue-600 text-white px-4 py-2 rounded"
                                >
                                    {isSaving ? "Saving..." : "Save"}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setEditBody(answer.body);
                                    }}
                                    className="px-4 py-2 border rounded"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-700 whitespace-pre-wrap">
                            {answer.body}
                        </p>
                    )}

                    {/* Footer */}
                    <div className="flex justify-between items-center mt-4">
                        <div className="flex gap-4">
                            <button className="text-sm text-gray-600">
                                Share
                            </button>
                            {canEdit && !isEditing && (
                                <>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="text-sm text-blue-600"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() =>
                                            onDeleteAnswer(answer.id)
                                        }
                                        className="text-sm text-red-600"
                                    >
                                        Delete
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Author */}
                        <Link
                            to={`/users/${answer.author.id}`}
                            className="flex items-center gap-2 bg-blue-50 border p-2 rounded"
                        >
                            <div className="w-8 h-8 bg-blue-500 text-white rounded flex items-center justify-center">
                                {answer.author.name[0].toUpperCase()}
                            </div>
                            <div>
                                <div className="text-sm font-semibold">
                                    {answer.author.name}
                                </div>
                                <div className="text-xs text-gray-600">
                                    answered {formatDate(answer.createdAt)}
                                </div>
                            </div>
                        </Link>
                    </div>

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
