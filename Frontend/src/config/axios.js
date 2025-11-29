import axios from "axios";
import { usersAPI } from "../services/api.js"; // We need this for the refresh call

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
    withCredentials: true,
});

// --- ADD THIS ENTIRE SECTION ---

// This is a "Response Interceptor"
// It runs a function on every response that comes *back* from the API
axiosInstance.interceptors.response.use(
    // 1. If the response is successful (e.g., 200 OK), just return it
    (response) => response,

    // 2. If the response is an error
    async (error) => {
        const originalRequest = error.config;

        // Check if it's a 401 error and we haven't already retried
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true; // Mark that we've retried

            try {
                // 3. Try to get a new access token
                await usersAPI.refreshToken();
                
                // 4. If successful, re-run the original failed request
                return axiosInstance(originalRequest);

            } catch (refreshError) {
                // 5. If the refresh token also fails, the user is logged out.
                console.error("Refresh token failed:", refreshError);
                // We can't use the useAuth() hook here, so we do it manually.
                localStorage.removeItem("user");
                // Redirect to login
                window.location.href = "/login";
                return Promise.reject(refreshError);
            }
        }

        // For all other errors, just return the error
        return Promise.reject(error);
    }
);
// --- END OF NEW SECTION ---

export default axiosInstance;