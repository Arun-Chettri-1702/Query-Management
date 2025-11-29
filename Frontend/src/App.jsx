import { Routes, Route } from "react-router-dom";
import Navbar from "./components/layout/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Pages
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import AskQuestionPage from "./pages/AskQuestionPage.jsx";
import QuestionDetailPage from "./pages/QuestionDetailPage.jsx";
import UserProfilePage from "./pages/UserProfilePage.jsx";
import TagsPage from "./pages/TagsPage.jsx";
import TagQuestionsPage from "./pages/TagsQuestionPage.jsx";

function App() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                    path="/questions/:questionId"
                    element={<QuestionDetailPage />}
                />
                <Route path="/users/:userId" element={<UserProfilePage />} />
                <Route path="/tags" element={<TagsPage />} />
                <Route path="/tags/:tagName" element={<TagQuestionsPage />} />

                {/* Protected Routes */}
                <Route
                    path="/ask"
                    element={
                        <ProtectedRoute>
                            <AskQuestionPage />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </div>
    );
}

export default App;
