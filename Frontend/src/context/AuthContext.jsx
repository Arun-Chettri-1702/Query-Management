import { createContext, useState, useEffect } from "react";
// CHANGED: Import your new axiosInstance
import axiosInstance from "../config/axios.js"; // Adjust path if needed

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // This useEffect hook remains exactly the same
    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    // CHANGED: Switched from fetch to axios
    const register = async (userData) => {
        try {
            setIsLoading(true);

            // Use axiosInstance.post
            // We only need the endpoint path, not the full URL
            const response = await axiosInstance.post(
                "/users/registerUser",
                userData
            );

            // axios provides data directly in response.data
            const data = response.data;

            // Store user (data.user)
            setUser(data.user);
            localStorage.setItem("user", JSON.stringify(data.user));

            return { success: true };
        } catch (error) {
            // Axios error handling is cleaner
            // The error message from your backend is at error.response.data.message
            return {
                success: false,
                error:
                    error.response?.data?.message ||
                    error.message ||
                    "Registration failed",
            };
        } finally {
            setIsLoading(false);
        }
    };

    // CHANGED: Switched from fetch to axios
    const login = async (credentials) => {
        try {
            setIsLoading(true);

            const response = await axiosInstance.post(
                "/users/loginUser",
                credentials
            );
            const data = response.data;

            setUser(data.user);
            localStorage.setItem("user", JSON.stringify(data.user));

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error:
                    error.response?.data?.message ||
                    error.message ||
                    "Login failed",
            };
        } finally {
            setIsLoading(false);
        }
    };

    // CHANGED: Switched from fetch to axios
    const logout = async () => {
        try {
            // No need for credentials: 'include', it's in the instance defaults
            await axiosInstance.post("/users/logoutUser");
        } catch (error) {
            console.error("Logout API call failed:", error);
        }

        // This part remains the same
        setUser(null);
        localStorage.removeItem("user");
    };

    // This part remains the same
    const value = {
        user,
        isLoading,
        login,
        register,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};
