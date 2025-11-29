import { Link } from "react-router-dom";

const Comment = ({ comment }) => {
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return "just now";
        if (diffInSeconds < 3600)
            return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400)
            return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    };

    return (
        <div className="py-2 border-b border-gray-100 last:border-0">
            <p className="text-gray-700 text-sm mb-1">{comment.body}</p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
                <Link // --- FIX 1: Safely access author ID ---
                    to={`/users/${comment.author?._id || comment.author_id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                >
                    {/* --- FIX 2: Use optional chaining (?.) to prevent the crash --- */}
                    {comment.author?.name || "Anonymous"}
                </Link>
                <span>{formatDate(comment.createdAt)}</span>
            </div>
        </div>
    );
};

export default Comment;
