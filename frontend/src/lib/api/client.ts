import axios from "axios"

// Support both local development and production URLs
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NODE_ENV === "production"
    ? "https://api.kernex.dev/api/v1"
    : "http://localhost:8000/api/v1"

console.log("[API Client] Base URL:", API_BASE_URL)

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Log outgoing requests in development
    if (process.env.NODE_ENV === "development") {
      console.log("[API Request]", config.method?.toUpperCase(), config.url)
    }

    // Add auth token if available (for future authentication)
    // const token = localStorage.getItem("auth_token")
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
    return config
  },
  (error) => {
    console.error("[API Error]", error)
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Log responses in development
    if (process.env.NODE_ENV === "development") {
      console.log("[API Response]", response.status, response.config.url)
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      console.error("[API Auth Error]", "Unauthorized - redirecting to login")
      // Handle unauthorized - redirect to login page
    } else if (error.response?.status === 404) {
      console.warn("[API Not Found]", error.config?.url)
    } else if (error.response?.status === 500) {
      console.error("[API Server Error]", error.response?.data)
    } else if (error.code === "ECONNREFUSED" || error.message === "Network Error") {
      console.warn("[API Connection Error]", "Backend is not responding")
    }
    return Promise.reject(error)
  }
)

export default apiClient
