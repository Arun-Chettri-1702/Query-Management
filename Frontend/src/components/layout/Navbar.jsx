import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";

const Navbar = () => {
    const { user, logout } = useAuth();

    return (
        <nav className="bg-white shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xl">
                                Q
                            </span>
                        </div>
                        <span className="text-xl font-bold text-gray-900">
                            QueryHub
                        </span>
                    </Link>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link
                            to="/"
                            className="text-gray-700 hover:text-blue-600 font-medium transition"
                        >
                            Questions
                        </Link>
                        <Link
                            to="/tags"
                            className="text-gray-700 hover:text-blue-600 font-medium transition"
                        >
                            Tags
                        </Link>
                        <Link
                            to="/users"
                            className="text-gray-700 hover:text-blue-600 font-medium transition"
                        >
                            Users
                        </Link>
                    </div>

                    {/* Auth Buttons */}
                    <div className="flex items-center space-x-4">
                        {user ? (
                            <>
                                {/* Ask Question Button */}
                                <Link
                                    to="/ask"
                                    className="hidden sm:block bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
                                >
                                    Ask Question
                                </Link>

                                {/* User Menu */}
                                <div className="flex items-center space-x-3">
                                    <Link
                                        to={`/users/${user._id}`}
                                        className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg px-3 py-2 transition"
                                    >
                                        <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                                            <span className="text-white font-semibold text-sm">
                                                {user.name
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </span>
                                        </div>
                                        <span className="hidden md:block text-gray-700 font-medium">
                                            {user.name}
                                        </span>
                                    </Link>

                                    {/* Logout Button */}
                                    <button
                                        onClick={logout}
                                        className="text-gray-600 hover:text-red-600 font-medium transition px-3 py-2 rounded-lg hover:bg-gray-100"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="text-gray-700 hover:text-blue-600 font-medium transition px-3 py-2"
                                >
                                    Log In
                                </Link>
                                <Link
                                    to="/register"
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
                                >
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Navigation (Optional - can expand later) */}
            <div className="md:hidden border-t border-gray-200">
                <div className="px-4 py-3 space-y-2">
                    <Link
                        to="/"
                        className="block text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-lg transition"
                    >
                        Questions
                    </Link>
                    <Link
                        to="/tags"
                        className="block text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-lg transition"
                    >
                        Tags
                    </Link>
                    <Link
                        to="/users"
                        className="block text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-lg transition"
                    >
                        Users
                    </Link>
                    {user && (
                        <Link
                            to="/ask"
                            className="block bg-blue-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-blue-700 transition text-center"
                        >
                            Ask Question
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
