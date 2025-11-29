import { Link } from "react-router-dom";
import Tag from "./ui/Tag";

const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
        return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const QuestionItem = ({ question }) => {
    const {
        _id,
        title,
        voteCount = 0,
        answers = [],
        tags = [],
        askedBy,
        createdAt,
    } = question;

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition">
            <div className="flex gap-4">
                {/* Stats Section */}
                <div className="flex flex-col items-end gap-3 text-gray-600 min-w-[80px]">
                    <div className="text-center">
                        <div className="text-2xl font-semibold text-gray-900">
                            {voteCount}
                        </div>
                        <div className="text-xs text-gray-500">votes</div>
                    </div>

                    <div className="text-center">
                        <div
                            className={`text-2xl font-semibold ${
                                answers.length > 0
                                    ? "text-green-600"
                                    : "text-gray-900"
                            }`}
                        >
                            {answers.length}
                        </div>
                        <div className="text-xs text-gray-500">answers</div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 min-w-0">
                    {/* Title */}
                    <Link
                        to={`/questions/${_id}`}
                        className="text-lg font-semibold text-blue-600 hover:text-blue-800 mb-2 block break-words"
                    >
                        {title}
                    </Link>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        {tags.map((tag) => (
                            <Tag key={tag._id} name={tag.name} size="sm" />
                        ))}
                    </div>

                    {/* Author & Time */}
                    <div className="flex items-center justify-end text-sm">
                        <div className="flex items-center gap-2">
                            <Link
                                to={`/users/${askedBy?._id || ""}`}
                                className="flex items-center gap-2 hover:bg-gray-100 rounded px-2 py-1 transition"
                            >
                                <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs font-semibold">
                                        {askedBy?.name
                                            ?.charAt(0)
                                            .toUpperCase() || "U"}
                                    </span>
                                </div>
                                <span className="text-gray-700 font-medium">
                                    {askedBy?.name || "Anonymous"}
                                </span>
                            </Link>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-500">
                                asked {formatDate(createdAt)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuestionItem;
