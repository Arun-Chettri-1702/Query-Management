import { Link } from "react-router-dom";

const Tag = ({ name, size = "md", clickable = true }) => {
    const sizeClasses = {
        sm: "text-xs px-2 py-1",
        md: "text-sm px-3 py-1",
        lg: "text-base px-4 py-2",
    };

    const tagClasses = `
    inline-block rounded-full bg-blue-100 text-blue-700 font-medium
    ${sizeClasses[size]}
    ${clickable ? "hover:bg-blue-200 transition cursor-pointer" : ""}
  `;

    if (clickable) {
        return (
            <Link to={`/tags/${name}`} className={tagClasses}>
                {name}
            </Link>
        );
    }

    return <span className={tagClasses}>{name}</span>;
};

export default Tag;
