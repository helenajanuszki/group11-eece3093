import { useState, useEffect } from "react"
import "./styles/moodEntries.css"
import apiCall from "./api/client"
import { FaTrashAlt, FaEdit, FaEye } from "react-icons/fa"

const BG = "/bg.png"

function MoodEntriesPage() {
    const [entries, setEntries] = useState([])
    const [showFormModal, setShowFormModal] = useState(false)
    const [showViewModal, setShowViewModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)

    const [selectedDay, setSelectedDay] = useState("")
    const [selectedMonth, setSelectedMonth] = useState("")
    const [selectedYear, setSelectedYear] = useState("")
    const [selectedMood, setSelectedMood] = useState("")
    const [selectedContent, setSelectedContent] = useState("")

    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [editingEntryId, setEditingEntryId] = useState(null)
    const [entryToDelete, setEntryToDelete] = useState(null)
    const [viewingEntry, setViewingEntry] = useState(null)

    const moods = [
        { label: ":D", value: 5 },
        { label: ":)", value: 4 },
        { label: ":|", value: 3 },
        { label: ":(", value: 2 },
        { label: "D:", value: 1 }
    ]

    useEffect(() => {
        fetchEntries()
    }, [])

    const fetchEntries = async () => {
        try {
            const res = await apiCall("/journal", {
                method: "GET"
            })

            const text = await res.text()
            const data = text ? JSON.parse(text) : {}

            if (!res.ok) {
                setError(data.ERROR || "Failed to load entries")
                return
            }

            setEntries(Array.isArray(data) ? data : [])
        } catch (err) {
            console.error(err)
            setError("Something went wrong while loading entries")
        }
    }

    const resetForm = () => {
        setSelectedDay("")
        setSelectedMonth("")
        setSelectedYear("")
        setSelectedMood("")
        setSelectedContent("")
        setEditingEntryId(null)
        setError("")
    }

    const closeFormModal = () => {
        setShowFormModal(false)
        resetForm()
    }

    const closeViewModal = () => {
        setShowViewModal(false)
        setViewingEntry(null)
    }

    const openCreateModal = () => {
        resetForm()
        setShowFormModal(true)
    }

    const openEditModal = (entry) => {
        setError("")
        setEditingEntryId(entry.id)

        const rawDate = entry.entry_date || entry.date
        const entryDate = new Date(rawDate)

        const day = String(entryDate.getDate()).padStart(2, "0")
        const month = String(entryDate.getMonth() + 1).padStart(2, "0")
        const year = String(entryDate.getFullYear())

        setSelectedDay(day)
        setSelectedMonth(month)
        setSelectedYear(year)
        setSelectedMood(Number(entry.mood))
        setSelectedContent(entry.content || "")
        setShowFormModal(true)
    }

    const openViewModal = (entry) => {
        setViewingEntry(entry)
        setShowViewModal(true)
    }

    const getMoodLabel = (value) => {
        const numericValue = Number(value)
        const match = moods.find((option) => option.value === numericValue)
        return match ? match.label : value
    }

    const handleDeleteEntry = (id) => {
        setEntryToDelete(id)
        setShowDeleteModal(true)
        setError("")
    }

    const confirmDelete = async () => {
        try {
            const res = await apiCall(`/journal/${entryToDelete}`, {
                method: "DELETE"
            })

            if (!res.ok) {
                const text = await res.text()
                const data = text ? JSON.parse(text) : {}
                setError(data.ERROR || "Failed to delete entry")
                return
            }

            await fetchEntries()
            setShowDeleteModal(false)
            setEntryToDelete(null)
        } catch (err) {
            console.error("delete error:", err)
            setError("Something went wrong while deleting")
        }
    }

    const cancelDelete = () => {
        setShowDeleteModal(false)
        setEntryToDelete(null)
    }

    const handleSaveEntry = async () => {
        setError("")

        if (!selectedDay || !selectedMonth || !selectedYear) {
            setError("Please choose a day, month and year")
            return
        }

        if (!selectedMood) {
            setError("Please choose a mood")
            return
        }

        if (!selectedContent.trim()) {
            setError("Please enter journal content")
            return
        }

        const formattedDate = `${selectedYear}-${selectedMonth}-${selectedDay}`

        setLoading(true)

        try {
            let res

            const payload = {
                date: formattedDate,
                mood: selectedMood,
                content: selectedContent.trim()
            }

            if (editingEntryId) {
                res = await apiCall(`/journal/${editingEntryId}`, {
                    method: "PUT",
                    body: JSON.stringify(payload)
                })
            } else {
                res = await apiCall("/journal", {
                    method: "POST",
                    body: JSON.stringify(payload)
                })
            }

            const text = await res.text()
            const data = text ? JSON.parse(text) : {}

            if (!res.ok) {
                setError(data.ERROR || "Failed to save entry")
                return
            }

            await fetchEntries()
            closeFormModal()
        } catch (err) {
            console.error("save entry error:", err)
            setError("Something went wrong, please try again")
        } finally {
            setLoading(false)
        }
    }

    const handleViewEdit = () => {
        if (!viewingEntry) return
        closeViewModal()
        openEditModal(viewingEntry)
    }

    return (
        <div
            className="mood-page"
            style={{ backgroundImage: `url(${BG})` }}
        >
            <div className="mood-shell">
                <div className="mood-header-top">Journal</div>

                <div className="mood-card">
                    <div className="mood-toolbar">
                        <div className="mood-title-wrap">
                            <h1 className="mood-title">mood entries</h1>
                            <button
                                className="mood-add-btn"
                                onClick={openCreateModal}
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {error && !showFormModal && !showDeleteModal && (
                        <div className="mood-error">{error}</div>
                    )}

                    <div className="mood-table-wrap">
                        <table className="mood-table">
                            <thead>
                                <tr>
                                    <th>date</th>
                                    <th>mood</th>
                                    <th>actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {entries.length > 0 ? (
                                    entries.map((entry) => (
                                        <tr
                                            key={entry.id}
                                            className="mood-row"
                                            onClick={() => openViewModal(entry)}
                                            style={{ cursor: "pointer" }}
                                        >
                                            <td>{entry.date || entry.entry_date}</td>
                                            <td>{getMoodLabel(entry.mood)}</td>
                                            <td>
                                                <div
                                                    className="mood-actions"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button
                                                        className="mood-view-btn"
                                                        onClick={() => openViewModal(entry)}
                                                        type="button"
                                                        aria-label="View entry"
                                                    >
                                                        <FaEye />
                                                    </button>

                                                    <button
                                                        className="mood-edit-btn"
                                                        onClick={() => openEditModal(entry)}
                                                        type="button"
                                                        aria-label="Edit entry"
                                                    >
                                                        <FaEdit />
                                                    </button>

                                                    <button
                                                        className="mood-delete-btn"
                                                        onClick={() => handleDeleteEntry(entry.id)}
                                                        type="button"
                                                        aria-label="Delete entry"
                                                    >
                                                        <FaTrashAlt />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="no-data">
                                            no data
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {showFormModal && (
                        <div className="mood-modal-overlay">
                            <div className="mood-modal">
                                <button
                                    className="mood-close-btn"
                                    onClick={closeFormModal}
                                    type="button"
                                >
                                    ×
                                </button>

                                <h2 className="mood-modal-title">
                                    {editingEntryId ? "edit entry" : "new entry"}
                                </h2>

                                <div className="mood-modal-field">
                                    <label>choose day:</label>
                                    <select
                                        value={selectedDay}
                                        onChange={(e) => setSelectedDay(e.target.value)}
                                        className="mood-select"
                                    >
                                        <option value="">dd</option>
                                        {Array.from({ length: 31 }, (_, i) => {
                                            const d = String(i + 1).padStart(2, "0")
                                            return (
                                                <option key={d} value={d}>
                                                    {d}
                                                </option>
                                            )
                                        })}
                                    </select>
                                </div>

                                <div className="mood-modal-field">
                                    <label>choose month:</label>
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="mood-select"
                                    >
                                        <option value="">mm</option>
                                        {Array.from({ length: 12 }, (_, i) => {
                                            const m = String(i + 1).padStart(2, "0")
                                            return (
                                                <option key={m} value={m}>
                                                    {m}
                                                </option>
                                            )
                                        })}
                                    </select>
                                </div>

                                <div className="mood-modal-field">
                                    <label>choose year:</label>
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                        className="mood-select"
                                    >
                                        <option value="">yyyy</option>
                                        {[2024, 2025, 2026, 2027, 2028].map((y) => (
                                            <option key={y} value={y}>
                                                {y}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mood-modal-field">
                                    <label>choose mood:</label>
                                    <div className="mood-options">
                                        {moods.map((mood) => (
                                            <button
                                                key={mood.value}
                                                type="button"
                                                className={`mood-option-btn ${
                                                    Number(selectedMood) === mood.value ? "selected" : ""
                                                }`}
                                                onClick={() => setSelectedMood(mood.value)}
                                            >
                                                {mood.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="mood-modal-field">
                                    <label>journal entry:</label>
                                    <textarea
                                        className="mood-textarea"
                                        value={selectedContent}
                                        onChange={(e) => setSelectedContent(e.target.value)}
                                        placeholder="write about your day..."
                                        rows={6}
                                    />
                                </div>

                                {error && <div className="mood-error">{error}</div>}

                                <button
                                    className="mood-save-btn"
                                    onClick={handleSaveEntry}
                                    disabled={loading}
                                    type="button"
                                >
                                    {loading
                                        ? "..."
                                        : editingEntryId
                                        ? "update entry"
                                        : "save entry"}
                                </button>
                            </div>
                        </div>
                    )}

                    {showViewModal && viewingEntry && (
                        <div className="mood-modal-overlay">
                            <div className="mood-modal">
                                <button
                                    className="mood-close-btn"
                                    onClick={closeViewModal}
                                    type="button"
                                >
                                    ×
                                </button>

                                <h2 className="mood-modal-title">view entry</h2>

                                <div className="mood-modal-field">
                                    <label>date:</label>
                                    <div>{viewingEntry.date || viewingEntry.entry_date}</div>
                                </div>

                                <div className="mood-modal-field">
                                    <label>mood:</label>
                                    <div>{getMoodLabel(viewingEntry.mood)}</div>
                                </div>

                                <div className="mood-modal-field">
                                    <label>journal entry:</label>
                                    <div className="mood-entry-preview">
                                        {viewingEntry.content || "No content added."}
                                    </div>
                                </div>

                                <button
                                    className="mood-save-btn"
                                    onClick={handleViewEdit}
                                    type="button"
                                >
                                    edit entry
                                </button>
                            </div>
                        </div>
                    )}

                    {showDeleteModal && (
                        <div className="mood-modal-overlay">
                            <div className="mood-modal">
                                <h2 className="mood-delete-title">delete entry?</h2>

                                <p className="mood-delete-text">
                                    are you sure you want to delete this entry?
                                </p>

                                <div className="mood-delete-actions">
                                    <button
                                        className="mood-delete-confirm"
                                        onClick={confirmDelete}
                                        type="button"
                                    >
                                        confirm
                                    </button>

                                    <button
                                        className="mood-delete-cancel"
                                        onClick={cancelDelete}
                                        type="button"
                                    >
                                        cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default MoodEntriesPage