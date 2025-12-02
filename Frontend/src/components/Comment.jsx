import { Link } from "react-router-dom";

const Comment = ({ comment }) => {
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);

        if (diff < 60) return "just now";
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;

        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    };

    const author =
        comment.author || // normalized backend: { id, name }
        comment.author_id_obj || // fallback from answer normalization
        null;

    const authorId = author?._id || author?.id || comment.author_id;
    const authorName = author?.name || "Anonymous";

    return (
        <div className="py-2 border-b border-gray-100 last:border-0">
            <p className="text-gray-700 text-sm mb-1">{comment.body}</p>

            <div className="flex items-center gap-2 text-xs text-gray-500">
                <Link
                    to={`/users/${authorId}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                >
                    {authorName}
                </Link>

                <span>{formatDate(comment.createdAt)}</span>
            </div>
        </div>
    );
};

export default Comment;
