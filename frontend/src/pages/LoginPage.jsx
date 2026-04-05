import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import apiCall from "../api/client"
import "../styles/auth.css"

const SHARK = "/shark.png"
const BG = "/bg.png"

function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleLogin = async () => {
        setError(null)
        if (!email || !password) {
            setError("Email and password are required")
            return
        }
        if (!email.includes("@")) {
            setError("Please enter a valid email")
            return
        }
        setLoading(true)
        try {
            const res = await apiCall("/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password })
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.ERROR || "Login failed")
                return
            }
            localStorage.setItem("token", data.token)
            localStorage.setItem("user", JSON.stringify(data.user))
            if (data.user.role === "admin") {
                navigate("/admin/dashboard")
            } else {
                navigate("/dashboard")
            }
        } catch (err) {
            console.error(err)
            setError("Something went wrong, please try again")
        } finally {
            setLoading(false)
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault()
            handleLogin()
        }
    }

    return (
        <div className="auth-page" style={{ backgroundImage: `url(${BG})` }}>
            <div className="auth-card">
                <h1 className="auth-title">Log-in</h1>

                <div className="auth-avatar">
                    <img src={SHARK} alt="logo" className="auth-avatar-img" />
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={(e) => e.preventDefault()} className="auth-form">
                    <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Email:"
                        className="auth-input"
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Password:"
                        className="auth-input"
                    />
                    <button
                        type="button"
                        onClick={handleLogin}
                        disabled={loading}
                        className="auth-btn"
                    >
                        {loading ? "..." : "ENTER"}
                    </button>
                </form>

                <Link to="/register" className="auth-link">
                    No Account? Register
                </Link>
            </div>
        </div>
    )
}

export default LoginPage