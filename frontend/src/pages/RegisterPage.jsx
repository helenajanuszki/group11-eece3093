import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import apiCall from "../api/client"
import "../styles/auth.css"

const SHARK = "/shark.png"
const BG = "/bg.png"

function RegisterPage() {
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [phoneNumber, setPhoneNumber] = useState("")
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleRegister = async () => {
        setError(null)
        if (!username || !email || !password) {
            setError("Username, email and password are required")
            return
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }
        if (password.length < 8) {
            setError("Password must be at least 8 characters")
            return
        }
        setLoading(true)
        try {
            const body = { username, email, password }
            if (phoneNumber) body.phone_number = phoneNumber
            const res = await apiCall("/auth/register", {
                method: "POST",
                body: JSON.stringify(body)
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.ERROR || "Registration failed")
                return
            }
            navigate("/login", { state: { message: "Account created! Please sign in." } })
        } catch (err) {
            console.error(err)
            setError("Something went wrong, please try again")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page" style={{ backgroundImage: `url(${BG})` }}>
            <div className="auth-card">
                <h1 className="auth-title">Register</h1>

                <div className="auth-avatar">
                    <img src={SHARK} alt="logo" className="auth-avatar-img" />
                </div>

                {error && <div className="auth-error">{error}</div>}

                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username:" className="auth-input" />
                <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email:" className="auth-input" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password:" className="auth-input" />
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password:" className="auth-input" />

                <div className="phone-wrapper">
                    <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Phone (optional):"
                        className="auth-input"
                    />
                    <span className="optional-label">optional</span>
                </div>

                <button
                    type="button"
                    onClick={handleRegister}
                    disabled={loading}
                    className="auth-btn"
                >
                    {loading ? "..." : "CREATE ACCOUNT"}
                </button>

                <Link to="/login" className="auth-link">
                    Already have an account? Sign in
                </Link>
            </div>
        </div>
    )
}

export default RegisterPage