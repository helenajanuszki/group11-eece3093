import { Link } from "react-router-dom"
import "./header.css"

function NavSidebar({ open, setOpen }) {
    const savedUser = localStorage.getItem("user")
    let role = ""
    try {
        role = String(JSON.parse(savedUser || "{}")?.role || "").toLowerCase()
    } catch {
        role = ""
    }

    const isAdmin = role === "admin"

    return (
        <div className={`sidebar ${open ? "open" : ""}`}>
            <button className="close-btn" onClick={() => setOpen(false)}>
                ✕
            </button>

            <nav className="nav-links">
                {isAdmin ? (
                    <>
                        <Link to="/admin/dashboard" onClick={() => setOpen(false)}>Dashboard</Link>
                        <Link to="/admin/tasks" onClick={() => setOpen(false)}>Assigned Tasks</Link>
                        <Link to="/admin/reminders" onClick={() => setOpen(false)}>Sent Reminders</Link>
                        <Link to="/admin/students" onClick={() => setOpen(false)}>Manage Users</Link>
                        <Link to="/admin/lists" onClick={() => setOpen(false)}>My Lists</Link>
                    </>
                ) : (
                    <>
                        <Link to="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link>
                        <Link to="/journal" onClick={() => setOpen(false)}>Journal</Link>
                        <Link to="/lists" onClick={() => setOpen(false)}>Lists</Link>
                        <Link to="/reminders" onClick={() => setOpen(false)}>Reminders</Link>
                    </>
                )}
            </nav>
        </div>
    )
}

export default NavSidebar