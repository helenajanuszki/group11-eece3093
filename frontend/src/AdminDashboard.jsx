import { useEffect, useState } from "react"
import apiCall from "./api/client"
import "./styles/admin-dashboard.css"

const BG = "/background-faded-blue.avif"

export default function AdminDashboard() {
  const [taskTitle, setTaskTitle] = useState("")
  const [taskDescription, setTaskDescription] = useState("")
  const [taskDue, setTaskDue] = useState("")
  const [taskPriority, setTaskPriority] = useState("low")
  const [taskSaving, setTaskSaving] = useState(false)

  const [reminderText, setReminderText] = useState("")
  const [reminderDescription, setReminderDescription] = useState("")
  const [reminderAt, setReminderAt] = useState("")
  const [reminderSaving, setReminderSaving] = useState(false)

  const [users, setUsers] = useState([])

  const [targetMode, setTargetMode] = useState("single")
  const [selectedUserId, setSelectedUserId] = useState("")
  const [selectedUserIds, setSelectedUserIds] = useState([])

  const [reminderTargetMode, setReminderTargetMode] = useState("single")
  const [selectedReminderUserId, setSelectedReminderUserId] = useState("")
  const [selectedReminderUserIds, setSelectedReminderUserIds] = useState([])

  const [msg, setMsg] = useState("")

  useEffect(() => {
    const loadMyUsers = async () => {
      try {
        const res = await apiCall("/admin/users", { method: "GET" })
        const data = await res.json().catch(() => [])
        if (!res.ok) throw new Error()

        const myUsers = Array.isArray(data) ? data : []
        setUsers(myUsers)

        if (myUsers.length > 0) {
          const firstId = String(myUsers[0].id)
          setSelectedUserId(firstId)
          setSelectedReminderUserId(firstId)
        } else {
          setSelectedUserId("")
          setSelectedReminderUserId("")
        }

        setSelectedUserIds([])
        setSelectedReminderUserIds([])
      } catch {
        setUsers([])
        setSelectedUserId("")
        setSelectedReminderUserId("")
        setSelectedUserIds([])
        setSelectedReminderUserIds([])
      }
    }

    loadMyUsers()
  }, [])

  const toggleUser = (id) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const toggleReminderUser = (id) => {
    setSelectedReminderUserIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const quickAddTask = async (e) => {
    e.preventDefault()
    if (!taskTitle.trim()) return

    setTaskSaving(true)
    setMsg("")

    try {
      let targetPayload = {}

      if (targetMode === "all") {
        targetPayload = { all_students: true }
      } else if (targetMode === "multi") {
        if (selectedUserIds.length === 0) throw new Error("Select at least one user")
        targetPayload = { user_ids: selectedUserIds }
      } else {
        if (!selectedUserId) throw new Error("Select a user")
        targetPayload = { user_id: Number(selectedUserId) }
      }

      const res = await apiCall("/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: taskTitle.trim(),
          description: taskDescription.trim() || "",
          due_date: taskDue || null,
          priority: taskPriority,
          ...targetPayload,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.ERROR || "Failed to add task")

      setTaskTitle("")
      setTaskDescription("")
      setTaskDue("")
      setTaskPriority("low")
      setSelectedUserIds([])
      setMsg("Task added.")
    } catch (err) {
      setMsg(err.message || "Failed to add task")
    } finally {
      setTaskSaving(false)
    }
  }

  const quickAddReminder = async (e) => {
    e.preventDefault()
    if (!reminderText.trim()) return
    if (!reminderAt) {
      setMsg("Reminder date/time is required.")
      return
    }

    setReminderSaving(true)
    setMsg("")

    try {
      let recipients = []

      if (reminderTargetMode === "all") {
        recipients = users.map((u) => u.id)
        if (!recipients.length) throw new Error("No assigned users found")
      } else if (reminderTargetMode === "multi") {
        if (selectedReminderUserIds.length === 0) throw new Error("Select at least one user")
        recipients = selectedReminderUserIds
      } else {
        if (!selectedReminderUserId) throw new Error("Select a user")
        recipients = [Number(selectedReminderUserId)]
      }

      const res = await apiCall("/reminders", {
        method: "POST",
        body: JSON.stringify({
          title: reminderText.trim(),
          description: reminderDescription.trim() || "",
          due_date: reminderAt,
          recipients,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.ERROR || "Failed to add reminder")

      setReminderText("")
      setReminderDescription("")
      setReminderAt("")
      setSelectedReminderUserIds([])
      setMsg("Reminder added.")
    } catch (err) {
      setMsg(err.message || "Failed to add reminder")
    } finally {
      setReminderSaving(false)
    }
  }

  return (
    <main className="ad-page" style={{ backgroundImage: `url(${BG})` }}>
      <div className="ad-shell">
        <div className="ad-header">Admin Dashboard</div>

        <section className="ad-grid">
          <article className="ad-card">
            <h3 className="ad-card-title">Task</h3>

            <form className="ad-form" onSubmit={quickAddTask}>
              <div className="ad-target-row">
                <label><input type="radio" name="taskTargetMode" checked={targetMode === "single"} onChange={() => setTargetMode("single")} />One</label>
                <label><input type="radio" name="taskTargetMode" checked={targetMode === "multi"} onChange={() => setTargetMode("multi")} />Many</label>
                <label><input type="radio" name="taskTargetMode" checked={targetMode === "all"} onChange={() => setTargetMode("all")} />All</label>
              </div>

              {targetMode === "single" && (
                <select className="ad-input" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
                  <option value="">Select user</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.username}</option>)}
                </select>
              )}

              {targetMode === "multi" && (
                <div className="ad-student-checklist">
                  {users.map((u) => (
                    <label key={u.id}>
                      <input type="checkbox" checked={selectedUserIds.includes(u.id)} onChange={() => toggleUser(u.id)} />
                      {u.username}
                    </label>
                  ))}
                </div>
              )}

              <input className="ad-input" placeholder="Quick add task title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
              <textarea
                className="ad-input"
                rows={3}
                placeholder="Task description (optional)"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
              />
              <input className="ad-input" type="datetime-local" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} />
                <select
                className="ad-input"
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <button className="ad-btn" type="submit" disabled={taskSaving}>{taskSaving ? "Saving..." : "Add Task"}</button>
            </form>
          </article>

          <article className="ad-card">
            <h3 className="ad-card-title">Reminder</h3>

            <form className="ad-form" onSubmit={quickAddReminder}>
              <div className="ad-target-row">
                <label><input type="radio" name="reminderTargetMode" checked={reminderTargetMode === "single"} onChange={() => setReminderTargetMode("single")} />One</label>
                <label><input type="radio" name="reminderTargetMode" checked={reminderTargetMode === "multi"} onChange={() => setReminderTargetMode("multi")} />Many</label>
                <label><input type="radio" name="reminderTargetMode" checked={reminderTargetMode === "all"} onChange={() => setReminderTargetMode("all")} />All</label>
              </div>

              {reminderTargetMode === "single" && (
                <select className="ad-input" value={selectedReminderUserId} onChange={(e) => setSelectedReminderUserId(e.target.value)}>
                  <option value="">Select user</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.username}</option>)}
                </select>
              )}

              {reminderTargetMode === "multi" && (
                <div className="ad-student-checklist">
                  {users.map((u) => (
                    <label key={u.id}>
                      <input type="checkbox" checked={selectedReminderUserIds.includes(u.id)} onChange={() => toggleReminderUser(u.id)} />
                      {u.username}
                    </label>
                  ))}
                </div>
              )}

              <input className="ad-input" placeholder="Quick add reminder title" value={reminderText} onChange={(e) => setReminderText(e.target.value)} />
              <textarea
                className="ad-input"
                rows={3}
                placeholder="Reminder description (optional)"
                value={reminderDescription}
                onChange={(e) => setReminderDescription(e.target.value)}
              />
              <input className="ad-input" type="datetime-local" value={reminderAt} onChange={(e) => setReminderAt(e.target.value)} />
              <button className="ad-btn" type="submit" disabled={reminderSaving}>{reminderSaving ? "Saving..." : "Add Reminder"}</button>
            </form>
          </article>
        </section>

        <section className="ad-grid ad-grid-single">
          <article className="ad-card">
            <h3 className="ad-card-title">My Users</h3>
            {users.length === 0 ? (
              <p className="ad-msg">No assigned users.</p>
            ) : (
              <ul className="ad-students-list">
                {users.map((u) => (
                  <li key={u.id} className="ad-student-item">
                    <strong>{u.username}</strong>
                    <span>{u.email || "No email"}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>

        {msg ? <p className="ad-msg">{msg}</p> : null}
      </div>
    </main>
  )
}