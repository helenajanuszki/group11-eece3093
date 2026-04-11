import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import NavSidebar from "./Navigation"
import "./header.css"

function Header() {
    const [open, setOpen] = useState(false)
    const [showMenu, setShowMenu] = useState(false)
    const navigate = useNavigate()

    const SHARK = "/shark.png"

    const [username] = useState(() => {
        const savedUser = localStorage.getItem("user")
        if (!savedUser) return "User"

        try {
            const parsedUser = JSON.parse(savedUser)
            return parsedUser.username || "User"
        } catch {
            return "User"
        }
    })

    const handleLogout = () => {
        localStorage.removeItem("token")
        localStorage.removeItem("user")

        navigate("/") 
    }

    return (
        <>
            <header className="app-header">
                <div className="header-left">
                    <button
                        className="hamburger"
                        onClick={() => setOpen(!open)}
                    >
                        ☰
                    </button>

                    <Link to="/dashboard" className="header-title">
                        <h1 className="header-title">
                            Welcome, {username}
                        </h1>
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
                            <button onClick={handleLogout}>
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <NavSidebar open={open} setOpen={setOpen} />
        </>
    )
}

export default Header