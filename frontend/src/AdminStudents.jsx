import { useEffect, useState } from "react"
import apiCall from "./api/client"
import "./styles/admin-students.css"

const BG = "/background-faded-blue.avif"

export default function AdminStudents() {
  const [q, setQ] = useState("")
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState("")

  const loadStudents = async (search = "") => {
    setLoading(true)
    setMsg("")
    try {
      const res = await apiCall(`/admin/students?q=${encodeURIComponent(search)}`, { method: "GET" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.ERROR || "Failed to load users")
      setStudents(Array.isArray(data) ? data : [])
    } catch (e) {
      setMsg(e.message || "Failed to load students")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStudents("")
  }, [])

  const assignStudent = async (id) => {
    setMsg("")
    try {
      const res = await apiCall(`/admin/users/${id}/assign`, { method: "PUT" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.ERROR || "Failed to assign user")
      await loadStudents(q)
      setMsg("Student assigned.")
    } catch (e) {
      setMsg(e.message || "Failed to assign student")
    }
  }
  const unassignStudent = async (id) => {
    setMsg("")
    try {
      const res = await apiCall(`/admin/users/${id}/assign`, { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.ERROR || "Failed to unassign user")
      await loadStudents(q)
      setMsg("Student unassigned.")
    } catch (e) {
      setMsg(e.message || "Failed to unassign student")
    }
  }

  return (
    <main className="as-page" style={{ backgroundImage: `url(${BG})` }}>
      <div className="as-shell">
        <div className="as-header-top">Manage Users</div>

        <section className="as-card">
          <div className="as-search-row">
            <input
              className="as-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by username..."
            />
            <button className="as-btn" onClick={() => loadStudents(q)}>
              Search
            </button>
          </div>

          {loading ? <p className="as-note">Loading...</p> : null}
          {msg ? <p className="as-note">{msg}</p> : null}

          <ul className="as-list">
        {students.map((s) => (
        <li key={s.id} className="as-item">
            <div>
            <strong>{s.username}</strong>
            <div className="as-sub">{s.email || "no email"}</div>
            </div>

            {s.assigned_to_me ? (
            <button className="as-btn as-btn-danger" onClick={() => unassignStudent(s.id)}>
                Unassign
            </button>
            ) : (
            <button className="as-btn" onClick={() => assignStudent(s.id)}>
                Assign
            </button>
            )}
        </li>
        ))}
          </ul>
        </section>
      </div>
    </main>
  )
}