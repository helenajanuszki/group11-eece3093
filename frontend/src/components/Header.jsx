import { useState } from "react"
import NavSidebar from "./Navigation"
import "./header.css"

function Header() {
    const [open, setOpen] = useState(false)
    const [username] = useState(() => {
    const savedUser = localStorage.getItem("user")

    if (!savedUser) return "User"

    try {
        const parsedUser = JSON.parse(savedUser)
        return parsedUser.username || "User"
    } catch (err) {
        console.error("Could not load user from storage:", err)
        return "User"
    }
})

    return (
        <>
            <header className="app-header">
                <div className="header-left">
                    <button
                        className="hamburger"
                        onClick={() => setOpen(!open)}
                        type="button"
                    >
                        ☰
                    </button>

                    <h1 className="header-title">Welcome, {username}</h1>
                </div>
            </header>

            <NavSidebar open={open} setOpen={setOpen} />
        </>
    )
}

export default Header