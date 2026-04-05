/*
 * API utility for backend requests.
 * 
 * Automatically attaches the JWT token from localStorage to every request.
 * Redirects to /login if a 401 is received (expired or missing token).
 * 
 * Usage:
 *   const res = await apiCall("/journal", { method: "GET" })
 *   const res = await apiCall("/journal", { method: "POST", body: JSON.stringify(data) })
 */

const BASE_URL = "/api"
const apiCall = async (url, options = {}) => {
    const token = localStorage.getItem("token")

    const res = await fetch(`/api${url}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token && { "Authorization": `Bearer ${token}` }),
            ...options.headers
        }
    })

    // only redirect on 401 if it's NOT an auth endpoint
    if (res.status === 401 && !url.includes("/auth/")) {
        localStorage.removeItem("token")
        window.location.href = "/login"
        return
    }

    return res
}

export default apiCall