import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import NavSidebar from "./Navigation"
import "./header.css"

function Header() {
    const [open, setOpen] = useState(false)
    const [showMenu, setShowMenu] = useState(false)
    const navigate = useNavigate()

    const SHARK = "/shark.png"

    const [userInfo] = useState(() => {
        const savedUser = localStorage.getItem("user")
        if (!savedUser) return { username: "User", role: "" }

        try {
            const parsedUser = JSON.parse(savedUser)
            return {
                username: parsedUser.username || "User",
                role: String(parsedUser.role || "").toLowerCase(),
            }
        } catch {
            return { username: "User", role: "" }
        }
    })

    const dashboardPath = userInfo.role === "admin" ? "/admin/dashboard" : "/dashboard"

    const handleLogout = () => {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        navigate("/")
    }

    return (
        <>
            <header className="app-header">
                <div className="header-left">
                    <button className="hamburger" onClick={() => setOpen(!open)}>
                        ☰
                    </button>

                    <Link to={dashboardPath} className="header-title">
                        <h1 className="header-title">Welcome, {userInfo.username}</h1>
                    </Link>
                </div>

                <div className="profile-container">
                    <img
                        src={SHARK}
                        alt="logo"
                        className="profile-img"
                        onClick={() => setShowMenu(!showMenu)}
                    />

                    {showMenu && (
                        <div className="profile-dropdown">
                            <button onClick={handleLogout}>Logout</button>
                        </div>
                    )}
                </div>
            </header>

            <NavSidebar open={open} setOpen={setOpen} />
        </>
    )
}

export default Header