import { useCallback, useEffect, useMemo, useState } from "react"
import apiCall from "./api/client"
import "./styles/admin-reminders.css"

const BG = "/background-faded-blue.avif"

function toInputDateTime(iso) {
	return iso ? String(iso).slice(0, 16) : ""
}

function nowInputDateTime() {
	return new Date().toISOString().slice(0, 16)
}

function formatDateTime(iso) {
	if (!iso) return "-"
	const d = new Date(iso)
	if (Number.isNaN(d.getTime())) return String(iso)
	return d.toLocaleString()
}

function AdminRemindersPage() {
	const [users, setUsers] = useState([])
	const [reminders, setReminders] = useState([])
	const [loading, setLoading] = useState(true)
	const [msg, setMsg] = useState("")

	const [targetMode, setTargetMode] = useState("single")
	const [selectedUserId, setSelectedUserId] = useState("")
	const [selectedUserIds, setSelectedUserIds] = useState([])

	const [title, setTitle] = useState("")
	const [description, setDescription] = useState("")
	const [creating, setCreating] = useState(false)
	const [viewingReminder, setViewingReminder] = useState(null)

	const [editingReminder, setEditingReminder] = useState(null)
	const [editForm, setEditForm] = useState({
		title: "",
		description: "",
		due_date: "",
		recipients: [],
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

	const loadReminders = useCallback(async () => {
		const res = await apiCall("/reminders", { method: "GET" })
		const data = await res.json().catch(() => [])
		if (!res.ok) throw new Error((data && data.ERROR) || "Failed to load reminders")
		setReminders(Array.isArray(data) ? data : [])
	}, [])

	useEffect(() => {
		const load = async () => {
			setLoading(true)
			setMsg("")
			try {
				await Promise.all([loadUsers(), loadReminders()])
			} catch (e) {
				setMsg(e.message || "Failed to load reminders")
			} finally {
				setLoading(false)
			}
		}

		load()
	}, [loadUsers, loadReminders])

	const usersById = useMemo(() => {
		const map = new Map()
		for (const u of users) map.set(u.id, u)
		return map
	}, [users])

	const toggleUser = (id) => {
		setSelectedUserIds((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
		)
	}

	const canCreate = useMemo(() => {
		if (!title.trim()) return false
		if (targetMode === "single") return Boolean(selectedUserId)
		if (targetMode === "multi") return selectedUserIds.length > 0
		return users.length > 0
	}, [title, targetMode, selectedUserId, selectedUserIds, users])

	const handleCreateReminder = async (e) => {
		e.preventDefault()
		if (!canCreate) return

		setCreating(true)
		setMsg("")
		try {
			let recipients = []
			if (targetMode === "all") recipients = users.map((u) => u.id)
			else if (targetMode === "multi") recipients = selectedUserIds
			else recipients = [Number(selectedUserId)]

			const createdDate = nowInputDateTime()

			const res = await apiCall("/reminders", {
				method: "POST",
				body: JSON.stringify({
					title: title.trim(),
					description: description.trim() || "",
					due_date: createdDate,
					recipients,
				}),
			})

			const data = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(data.ERROR || "Failed to create reminder")

			setTitle("")
			setDescription("")
			setSelectedUserIds([])
			setMsg("Reminder created.")
			await loadReminders()
		} catch (e) {
			setMsg(e.message || "Failed to create reminder")
		} finally {
			setCreating(false)
		}
	}

	const openEdit = (reminder) => {
		setEditingReminder(reminder)
		setEditForm({
			title: reminder.title || "",
			description: reminder.description || "",
			due_date: toInputDateTime(reminder.due_date),
			recipients: Array.isArray(reminder.recipients) ? reminder.recipients : [],
		})
	}

	const closeEdit = () => setEditingReminder(null)

	const openView = (reminder) => setViewingReminder(reminder)

	const closeView = () => setViewingReminder(null)

	const handleDeleteReminder = async (reminder) => {
		const ok = window.confirm(`Delete reminder "${reminder.title}"?`)
		if (!ok) return

		setMsg("")
		try {
			const res = await apiCall(`/reminders/${reminder.id}`, { method: "DELETE" })
			if (!res.ok) {
				const data = await res.json().catch(() => ({}))
				throw new Error(data.ERROR || "Failed to delete reminder")
			}

			if (viewingReminder?.id === reminder.id) {
				setViewingReminder(null)
			}
			setMsg("Reminder deleted.")
			await loadReminders()
		} catch (e) {
			setMsg(e.message || "Failed to delete reminder")
		}
	}

	const toggleEditRecipient = (id) => {
		setEditForm((prev) => ({
			...prev,
			recipients: prev.recipients.includes(id)
				? prev.recipients.filter((x) => x !== id)
				: [...prev.recipients, id],
		}))
	}

	const handleSaveEdit = async () => {
		if (!editingReminder) return
		if (!editForm.title.trim()) {
			setMsg("Title is required")
			return
		}

		setSavingEdit(true)
		setMsg("")
		try {
			const res = await apiCall(`/reminders/${editingReminder.id}`, {
				method: "PUT",
				body: JSON.stringify({
					title: editForm.title,
					description: editForm.description,
					due_date: editForm.due_date || nowInputDateTime(),
					recipients: editForm.recipients,
				}),
			})

			const data = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(data.ERROR || "Failed to save reminder changes")

			setMsg("Reminder updated.")
			closeEdit()
			await loadReminders()
		} catch (e) {
			setMsg(e.message || "Failed to save reminder changes")
		} finally {
			setSavingEdit(false)
		}
	}

	const getReminderDate = (reminder) => {
		const raw =
			reminder?.created_at ||
			reminder?.createdAt ||
			reminder?.date ||
			reminder?.due_date
		return formatDateTime(raw)
	}

	return (
		<main className="ar-page" style={{ backgroundImage: `url(${BG})` }}>
			<div className="ar-shell">
				<div className="ar-header">Manage Reminders</div>

				<section className="ar-card">
					<h3 className="ar-title">Create Reminder</h3>

					<form className="ar-form" onSubmit={handleCreateReminder}>
						<div className="ar-target-row">
							<label><input type="radio" name="targetMode" checked={targetMode === "single"} onChange={() => setTargetMode("single")} />One</label>
							<label><input type="radio" name="targetMode" checked={targetMode === "multi"} onChange={() => setTargetMode("multi")} />Many</label>
							<label><input type="radio" name="targetMode" checked={targetMode === "all"} onChange={() => setTargetMode("all")} />All</label>
						</div>

						{targetMode === "single" && (
							<select className="ar-input" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
								<option value="">Select user</option>
								{users.map((u) => <option key={u.id} value={u.id}>{u.username}</option>)}
							</select>
						)}

						{targetMode === "multi" && (
							<div className="ar-user-checklist">
								{users.map((u) => (
									<label key={u.id}>
										<input type="checkbox" checked={selectedUserIds.includes(u.id)} onChange={() => toggleUser(u.id)} />
										{u.username}
									</label>
								))}
							</div>
						)}

						<input className="ar-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Reminder title" />
						<textarea className="ar-input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" />
						<button className="ar-btn" type="submit" disabled={creating || !canCreate}>
							{creating ? "Saving..." : "Add Reminder"}
						</button>
					</form>
				</section>

				<section className="ar-card">
					<h3 className="ar-title">All Sent Reminders</h3>
					{loading ? <p className="ar-note">Loading...</p> : null}

					{!loading && reminders.length === 0 ? <p className="ar-note">No reminders yet.</p> : null}

					<ul className="ar-reminder-list">
						{reminders.map((reminder) => (
							<li key={reminder.id} className="ar-reminder-item" onClick={() => openView(reminder)}>
								<div className="ar-reminder-top">
									<strong className="ar-reminder-title">{reminder.title}</strong>
								</div>
								<div className="ar-reminder-desc">{reminder.description || "No description"}</div>
								<div className="ar-reminder-actions">
									<button
										className="ar-btn ar-mini-btn"
										type="button"
										onClick={(e) => {
											e.stopPropagation()
											openView(reminder)
										}}
									>
										View
									</button>
									<button
										className="ar-btn ar-mini-btn"
										type="button"
										onClick={(e) => {
											e.stopPropagation()
											openEdit(reminder)
										}}
									>
										Edit
									</button>
									<button
										className="ar-btn ar-btn-danger ar-mini-btn"
										type="button"
										onClick={(e) => {
											e.stopPropagation()
											handleDeleteReminder(reminder)
										}}
									>
										Delete
									</button>
								</div>
							</li>
						))}
					</ul>
				</section>

				{msg ? <p className="ar-note">{msg}</p> : null}

				{editingReminder && (
					<div className="ar-modal-overlay" onClick={closeEdit}>
						<div className="ar-modal" onClick={(e) => e.stopPropagation()}>
							<button className="ar-close" type="button" onClick={closeEdit}>x</button>
							<h3 className="ar-title">Edit Reminder</h3>

							<input className="ar-input" value={editForm.title} onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))} />
							<textarea className="ar-input" rows={3} value={editForm.description} onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))} />

							<div className="ar-user-checklist">
								{users.map((u) => (
									<label key={u.id}>
										<input
											type="checkbox"
											checked={editForm.recipients.includes(u.id)}
											onChange={() => toggleEditRecipient(u.id)}
										/>
										{u.username}
									</label>
								))}
							</div>

							<button className="ar-btn" type="button" onClick={handleSaveEdit} disabled={savingEdit}>
								{savingEdit ? "Saving..." : "Save Changes"}
							</button>
						</div>
					</div>
				)}

				{viewingReminder && (
					<div className="ar-modal-overlay" onClick={closeView}>
						<div className="ar-modal" onClick={(e) => e.stopPropagation()}>
							<button className="ar-close" type="button" onClick={closeView}>x</button>
							<h3 className="ar-title">View Reminder</h3>

							<div className="ar-view-row"><strong className="ar-view-label">Title:</strong> {viewingReminder.title}</div>
							<div className="ar-view-row"><strong className="ar-view-label">Description:</strong> {viewingReminder.description || "No description"}</div>
							<div className="ar-view-row"><strong className="ar-view-label">Date:</strong> {getReminderDate(viewingReminder)}</div>
							<div className="ar-view-row">
								<strong className="ar-view-label">Recipients:</strong>{" "}
								{Array.isArray(viewingReminder.recipients) && viewingReminder.recipients.length > 0
									? viewingReminder.recipients
											.map((id) => {
												const u = usersById.get(id)
												return u ? `${u.username} (${u.email})` : `User #${id}`
											})
											.join(", ")
									: "No recipients"}
							</div>
						</div>
					</div>
				)}
			</div>
		</main>
	)
}

export default AdminRemindersPage
