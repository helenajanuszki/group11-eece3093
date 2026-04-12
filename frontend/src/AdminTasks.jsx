import { useCallback, useEffect, useMemo, useState } from "react"
import apiCall from "./api/client"
import "./styles/admin-tasks.css"

const BG = "/background-faded-blue.avif"

function toInputDateTime(iso) {
	return iso ? String(iso).slice(0, 16) : ""
}

function formatDateTime(iso) {
	if (!iso) return "-"
	const d = new Date(iso)
	if (Number.isNaN(d.getTime())) return String(iso)
	return d.toLocaleString()
}

export default function AdminTasksPage() {
	const [users, setUsers] = useState([])
	const [tasks, setTasks] = useState([])
	const [loading, setLoading] = useState(true)
	const [msg, setMsg] = useState("")

	const [targetMode, setTargetMode] = useState("single")
	const [selectedUserId, setSelectedUserId] = useState("")
	const [selectedUserIds, setSelectedUserIds] = useState([])

	const [taskTitle, setTaskTitle] = useState("")
	const [taskDescription, setTaskDescription] = useState("")
	const [taskDue, setTaskDue] = useState("")
	const [taskPriority, setTaskPriority] = useState("low")
	const [creating, setCreating] = useState(false)

	const [editingTask, setEditingTask] = useState(null)
	const [editForm, setEditForm] = useState({
		title: "",
		description: "",
		due_date: "",
		priority: "low",
		status: "incomplete",
	})
	const [savingEdit, setSavingEdit] = useState(false)

	const loadUsers = useCallback(async () => {
		const res = await apiCall("/admin/users", { method: "GET" })
		const data = await res.json().catch(() => [])
		if (!res.ok) throw new Error((data && data.ERROR) || "Failed to load users")

		const myUsers = Array.isArray(data) ? data : []
		setUsers(myUsers)

		if (myUsers.length > 0) {
			const firstId = String(myUsers[0].id)
			setSelectedUserId((prev) => prev || firstId)
		}
	}, [])

	const loadTasks = useCallback(async () => {
		const res = await apiCall("/admin/tasks", { method: "GET" })
		const data = await res.json().catch(() => [])
		if (!res.ok) throw new Error((data && data.ERROR) || "Failed to load tasks")
		setTasks(Array.isArray(data) ? data : [])
	}, [])

	useEffect(() => {
		const load = async () => {
			setLoading(true)
			setMsg("")
			try {
				await Promise.all([loadUsers(), loadTasks()])
			} catch (e) {
				setMsg(e.message || "Failed to load tasks")
			} finally {
				setLoading(false)
			}
		}

		load()
	}, [loadUsers, loadTasks])

	const toggleUser = (id) => {
		setSelectedUserIds((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
		)
	}

	const canCreate = useMemo(() => {
		if (!taskTitle.trim()) return false
		if (targetMode === "single") return Boolean(selectedUserId)
		if (targetMode === "multi") return selectedUserIds.length > 0
		return users.length > 0
	}, [taskTitle, targetMode, selectedUserId, selectedUserIds, users])

	const handleCreateTask = async (e) => {
		e.preventDefault()
		if (!canCreate) return

		setCreating(true)
		setMsg("")
		try {
			let targetPayload = {}
			if (targetMode === "all") targetPayload = { all_students: true }
			else if (targetMode === "multi") targetPayload = { user_ids: selectedUserIds }
			else targetPayload = { user_id: Number(selectedUserId) }

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
			if (!res.ok) throw new Error(data.ERROR || "Failed to create task")

			setTaskTitle("")
			setTaskDescription("")
			setTaskDue("")
			setTaskPriority("low")
			setSelectedUserIds([])
			setMsg("Task created.")
			await loadTasks()
		} catch (e) {
			setMsg(e.message || "Failed to create task")
		} finally {
			setCreating(false)
		}
	}

	const openEdit = (taskGroup) => {
		setEditingTask(taskGroup)
		setEditForm({
			title: taskGroup.title || "",
			description: taskGroup.description || "",
			due_date: toInputDateTime(taskGroup.due_date),
			priority: taskGroup.priority || "low",
			status: taskGroup.status || "incomplete",
		})
	}

	const closeEdit = () => setEditingTask(null)

	const handleSaveEdit = async () => {
		if (!editingTask) return
		setSavingEdit(true)
		setMsg("")
		try {
			const res = await apiCall("/admin/tasks/batch", {
				method: "PUT",
				body: JSON.stringify({
					task_ids: editingTask.task_ids,
					title: editForm.title,
					description: editForm.description,
					due_date: editForm.due_date || "",
					priority: editForm.priority,
					status: editForm.status,
				}),
			})

			const data = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(data.ERROR || "Failed to save task changes")

			setMsg("Task updated.")
			closeEdit()
			await loadTasks()
		} catch (e) {
			setMsg(e.message || "Failed to save task changes")
		} finally {
			setSavingEdit(false)
		}
	}

	return (
		<main className="at-page" style={{ backgroundImage: `url(${BG})` }}>
			<div className="at-shell">
				<div className="at-header">Manage Tasks</div>

				<section className="at-card">
					<h3 className="at-title">Create Task</h3>

					<form className="at-form" onSubmit={handleCreateTask}>
						<div className="at-target-row">
							<label><input type="radio" name="targetMode" checked={targetMode === "single"} onChange={() => setTargetMode("single")} />One</label>
							<label><input type="radio" name="targetMode" checked={targetMode === "multi"} onChange={() => setTargetMode("multi")} />Many</label>
							<label><input type="radio" name="targetMode" checked={targetMode === "all"} onChange={() => setTargetMode("all")} />All</label>
						</div>

						{targetMode === "single" && (
							<select className="at-input" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
								<option value="">Select user</option>
								{users.map((u) => <option key={u.id} value={u.id}>{u.username}</option>)}
							</select>
						)}

						{targetMode === "multi" && (
							<div className="at-user-checklist">
								{users.map((u) => (
									<label key={u.id}>
										<input type="checkbox" checked={selectedUserIds.includes(u.id)} onChange={() => toggleUser(u.id)} />
										{u.username}
									</label>
								))}
							</div>
						)}

						<input className="at-input" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Task title" />
						<textarea className="at-input" rows={3} value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} placeholder="Description (optional)" />
						<input className="at-input" type="datetime-local" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} />

						<select className="at-input" value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}>
							<option value="low">Low</option>
							<option value="medium">Medium</option>
							<option value="high">High</option>
						</select>

						<button className="at-btn" type="submit" disabled={creating || !canCreate}>
							{creating ? "Saving..." : "Add Task"}
						</button>
					</form>
				</section>

				<section className="at-card">
					<h3 className="at-title">All Assigned Tasks</h3>
					{loading ? <p className="at-note">Loading...</p> : null}

					{!loading && tasks.length === 0 ? <p className="at-note">No assigned tasks yet.</p> : null}

					<ul className="at-task-list">
						{tasks.map((task) => (
							<li key={`${task.id}-${task.task_ids?.join("-")}`} className="at-task-item">
								<div className="at-task-top">
									<strong>{task.title}</strong>
									<button className="at-btn" type="button" onClick={() => openEdit(task)}>Edit</button>
								</div>
								<div>{task.description || "No description"}</div>
								<div>Due: {formatDateTime(task.due_date)}</div>
								<div>Priority: {task.priority}</div>
								<div>Status: {task.status === "mixed" ? "mixed (varies by user)" : task.status}</div>
								<div>
									Assigned users: {task.users?.map((u) => `${u.username} (${u.email}) - ${u.status}`).join(", ") || "-"}
								</div>
							</li>
						))}
					</ul>
				</section>

				{msg ? <p className="at-note">{msg}</p> : null}

				{editingTask && (
					<div className="at-modal-overlay" onClick={closeEdit}>
						<div className="at-modal" onClick={(e) => e.stopPropagation()}>
							<button className="at-close" type="button" onClick={closeEdit}>x</button>
							<h3 className="at-title">Edit Task</h3>

							<input className="at-input" value={editForm.title} onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))} />
							<textarea className="at-input" rows={3} value={editForm.description} onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))} />
							<input className="at-input" type="datetime-local" value={editForm.due_date} onChange={(e) => setEditForm((prev) => ({ ...prev, due_date: e.target.value }))} />

							<select className="at-input" value={editForm.priority} onChange={(e) => setEditForm((prev) => ({ ...prev, priority: e.target.value }))}>
								<option value="low">Low</option>
								<option value="medium">Medium</option>
								<option value="high">High</option>
							</select>

							<select className="at-input" value={editForm.status} onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}>
								<option value="incomplete">incomplete</option>
								<option value="in_progress">in_progress</option>
								<option value="complete">complete</option>
							</select>

							<button className="at-btn" type="button" onClick={handleSaveEdit} disabled={savingEdit}>
								{savingEdit ? "Saving..." : "Save Changes"}
							</button>
						</div>
					</div>
				)}
			</div>
		</main>
	)
}
