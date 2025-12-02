const VoteControl = ({
    score,
    userVote = 0, // backend sends 1, -1, or 0
    onUpvote,
    onDownvote,
    disabled = false,
}) => {
    return (
        <div className="flex flex-col items-center gap-2">
            {/* Upvote Button */}
            <button
                onClick={onUpvote}
                disabled={disabled}
                className={`p-2 rounded-lg transition ${
                    userVote === 1
                        ? "bg-orange-100 text-orange-600"
                        : "hover:bg-gray-100 text-gray-600 hover:text-orange-600"
                } ${
                    disabled
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer"
                }`}
                title="This answer is useful"
            >
                <svg
                    className="w-8 h-8"
                    fill={userVote === 1 ? "currentColor" : "none"}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 15l7-7 7 7"
                    />
                </svg>
            </button>

            {/* Score */}
            <div
                className={`text-2xl font-bold ${
                    score > 0
                        ? "text-green-600"
                        : score < 0
                        ? "text-red-600"
                        : "text-gray-700"
                }`}
            >
                {score}
            </div>

            {/* Downvote Button */}
            <button
                onClick={onDownvote}
                disabled={disabled}
                className={`p-2 rounded-lg transition ${
                    userVote === -1
                        ? "bg-blue-100 text-blue-600"
                        : "hover:bg-gray-100 text-gray-600 hover:text-blue-600"
                } ${
                    disabled
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer"
                }`}
                title="This answer is not useful"
            >
                <svg
                    className="w-8 h-8"
                    fill={userVote === -1 ? "currentColor" : "none"}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>
        </div>
    );
};

export default VoteControl;
