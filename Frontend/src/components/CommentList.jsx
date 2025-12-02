import { useState } from "react";
import Comment from "./Comment";
import { useAuth } from "../hooks/useAuth";

const CommentList = ({ comments, onAddComment }) => {
    const [showForm, setShowForm] = useState(false);
    const [commentBody, setCommentBody] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!commentBody.trim()) return;

        setIsSubmitting(true);
        await onAddComment(commentBody);
        setCommentBody("");
        setShowForm(false);
        setIsSubmitting(false);
    };

    return (
        <div className="mt-4">
            {/* Comment List */}
            {comments && comments.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    {comments.map((comment) => (
                        <Comment
                            key={comment._id || comment.id} // FIXED
                            comment={comment}
                        />
                    ))}
                </div>
            )}

            {/* Add Comment Form */}
            {user && (
                <div>
                    {!showForm ? (
                        <button
                            onClick={() => setShowForm(true)}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                            Add a comment
                        </button>
                    ) : (
                        <form onSubmit={handleSubmit} className="mt-2">
                            <textarea
                                value={commentBody}
                                onChange={(e) => setCommentBody(e.target.value)}
                                placeholder="Add a comment..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                                rows="2"
                            />
                            <div className="flex gap-2 mt-2">
                                <button
                                    type="submit"
                                    disabled={
                                        isSubmitting || !commentBody.trim()
                                    }
                                    className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? "Adding..." : "Add Comment"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForm(false);
                                        setCommentBody("");
                                    }}
                                    className="px-4 py-1.5 text-gray-600 hover:text-gray-800 text-sm font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
};

export default CommentList;
