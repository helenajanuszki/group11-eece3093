import { useCallback, useEffect, useState } from "react"
import apiCall from "./api/client"
import "./styles/student-reminders.css"

const BG = "/background-faded-blue.avif"

function formatDateTime(iso) {
	if (!iso) return "-"
	const d = new Date(iso)
	if (Number.isNaN(d.getTime())) return String(iso)
	return d.toLocaleString()
}

export default function StudentRemindersPage() {
	const [reminders, setReminders] = useState([])
	const [loading, setLoading] = useState(true)
	const [msg, setMsg] = useState("")
	const [viewingReminder, setViewingReminder] = useState(null)
	const [deletingReminder, setDeletingReminder] = useState(null)
	const [deleting, setDeleting] = useState(false)

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
				await loadReminders()
			} catch (e) {
				setMsg(e.message || "Failed to load reminders")
			} finally {
				setLoading(false)
			}
		}

		load()
	}, [loadReminders])

	const openDeleteReminder = (reminder) => {
		setDeletingReminder(reminder)
	}

	const closeDeleteReminder = () => {
		if (deleting) return
		setDeletingReminder(null)
	}

	const confirmDeleteReminder = async () => {
		if (!deletingReminder) return

		setDeleting(true)
		setMsg("")
		try {
			const res = await apiCall(`/reminders/${deletingReminder.id}`, { method: "DELETE" })
			if (!res.ok) {
				const data = await res.json().catch(() => ({}))
				throw new Error(data.ERROR || "Failed to remove reminder")
			}

			if (viewingReminder?.id === deletingReminder.id) {
				setViewingReminder(null)
			}
			setDeletingReminder(null)
			setMsg("Reminder removed.")
			await loadReminders()
		} catch (e) {
			setMsg(e.message || "Failed to remove reminder")
		} finally {
			setDeleting(false)
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

	const getReminderSource = (reminder) => {
		if (reminder?.creator_username) return reminder.creator_username
		return "Unknown admin"
	}

	return (
		<main className="sr-page" style={{ backgroundImage: `url(${BG})` }}>
			<div className="sr-shell">
				<div className="sr-header">Reminders</div>

				<section className="sr-card">
					<h3 className="sr-title">My Reminders</h3>
					{loading ? <p className="sr-note">Loading...</p> : null}
					{!loading && reminders.length === 0 ? <p className="sr-note">No reminders.</p> : null}

					<ul className="sr-reminder-list">
						{reminders.map((reminder) => (
							<li key={reminder.id} className="sr-reminder-item" onClick={() => setViewingReminder(reminder)}>
								<div className="sr-reminder-top">
									<strong className="sr-reminder-title">{reminder.title}</strong>
								</div>
								<div className="sr-reminder-source">From: {getReminderSource(reminder)}</div>
								<div className="sr-reminder-desc">{reminder.description || "No description"}</div>
								<div className="sr-reminder-actions">
									<button
										className="sr-btn sr-mini-btn"
										type="button"
										onClick={(e) => {
											e.stopPropagation()
											setViewingReminder(reminder)
										}}
									>
										View
									</button>
									<button
										className="sr-btn sr-btn-danger sr-mini-btn"
										type="button"
										onClick={(e) => {
											e.stopPropagation()
											openDeleteReminder(reminder)
										}}
									>
										Delete
									</button>
								</div>
							</li>
						))}
					</ul>
				</section>

				{msg ? <p className="sr-note">{msg}</p> : null}

				{viewingReminder && (
					<div className="sr-modal-overlay" onClick={() => setViewingReminder(null)}>
						<div className="sr-modal" onClick={(e) => e.stopPropagation()}>
							<button className="sr-close" type="button" onClick={() => setViewingReminder(null)}>x</button>
							<h3 className="sr-title">View Reminder</h3>

							<div className="sr-view-row"><strong className="sr-view-label">Title:</strong> {viewingReminder.title}</div>
							<div className="sr-view-row"><strong className="sr-view-label">From:</strong> {getReminderSource(viewingReminder)}</div>
							<div className="sr-view-row"><strong className="sr-view-label">Description:</strong> {viewingReminder.description || "No description"}</div>
							<div className="sr-view-row"><strong className="sr-view-label">Date:</strong> {getReminderDate(viewingReminder)}</div>
						</div>
					</div>
				)}

				{deletingReminder && (
					<div className="sr-modal-overlay" onClick={closeDeleteReminder}>
						<div className="sr-modal" onClick={(e) => e.stopPropagation()}>
							<h2 className="sr-delete-title">remove reminder?</h2>
							<p className="sr-delete-text">
								remove &quot;{deletingReminder.title}&quot; from your reminders?
							</p>

							<div className="sr-delete-actions">
								<button
									className="sr-delete-confirm"
									onClick={confirmDeleteReminder}
									type="button"
									disabled={deleting}
								>
									{deleting ? "removing..." : "confirm"}
								</button>

								<button
									className="sr-delete-cancel"
									onClick={closeDeleteReminder}
									type="button"
									disabled={deleting}
								>
									cancel
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</main>
	)
}
