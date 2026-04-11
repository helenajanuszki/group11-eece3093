import { Link } from "react-router-dom"
import "./header.css"

function NavSidebar({ open, setOpen }) {
    return (
        <div className={`sidebar ${open ? "open" : ""}`}>
            <button 
                className="close-btn"
                onClick={() => setOpen(false)}
            >
                ✕
            </button>

            <nav className="nav-links">
                <Link to="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link>
                <Link to="/journal" onClick={() => setOpen(false)}>Journal</Link>
                <Link to="/lists" onClick={() => setOpen(false)}>Lists</Link>
                <Link to="/profile" onClick={() => setOpen(false)}>Profile</Link>
            </nav>
        </div>
    )
}

export default NavSidebar