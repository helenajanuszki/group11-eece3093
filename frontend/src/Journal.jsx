import { useState, useEffect } from "react"
import "./styles/moodEntries.css"
import apiCall from "./api/client"
import { FaTrashAlt, FaEdit } from "react-icons/fa";

const BG = "/bg.png"

// const sampleEntries = [
//     { id: 1, date: "01/11", mood: ":D" },
//     { id: 2, date: "01/12", mood: ":)" },
//     { id: 3, date: "01/13", mood: ":|" }
// ]

function MoodEntriesPage() {
    const [entries, setEntries] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [selectedDay, setSelectedDay] = useState("")
    const [selectedMonth, setSelectedMonth] = useState("")
    const [selectedYear, setSelectedYear] = useState("")
    const [selectedMood, setSelectedMood] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [editingEntryId, setEditingEntryId] = useState(null)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [entryToDelete, setEntryToDelete] = useState(null)    
    

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

            setEntries(data)
        } catch (err) {
            console.error(err)
            setError("Something went wrong while loading entries")
        }
    }
    
    const resetModal = () => {
        setSelectedDay("")
        setSelectedMonth("")
        setSelectedYear("")
        setSelectedMood("")
        setEditingEntryId(null)
        setError("")
    }

    const openCreateModal = () => {
        resetModal()
        setShowModal(true)
    }

    const openEditModal = (entry) => {
        setError("")
        setEditingEntryId(entry.id)

        const entryDate = new Date(entry.entry_date)
        const day = String(entryDate.getDay()).padStart(2, "0")
        const month = String(entryDate.getMonth() + 1).padStart(2, "0")
        const year = String(entryDate.getFullYear())

        setSelectedDay(day)
        setSelectedMonth(month)
        setSelectedYear(year)
        setSelectedMood(entry.mood)
        setShowModal(true)
    }

    const getMoodLabel = (value) => {
        const match = moods.find((option) => option.value === value)
        return match ? match.label : value
    }

    const handleDeleteEntry = (id) => {
        setEntryToDelete(id)
        setShowDeleteModal(true)
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

        if (!selectedDay ||!selectedMonth || !selectedYear) {
            setError("Please choose a day, month and year")
            return
        }

        if (!selectedMood) {
            setError("Please choose a mood")
            return
        }

        const formattedDate = `${selectedYear}-${selectedMonth}-${selectedDay}`

        setLoading(true)

        try {
            let res
            if (editingEntryId) {
                res = await apiCall(`/journal/${editingEntryId}`, {
                    method: "PUT",
                    body: JSON.stringify({
                        date: formattedDate,
                        mood: selectedMood,
                        content: ""
                    })
                })
            } else {
                res = await apiCall("/journal", {
                    method: "POST",
                    body: JSON.stringify({
                        date: formattedDate,
                        mood: selectedMood,
                        content: ""
                    })
                })
            }

            const text = await res.text()
            const data = text ? JSON.parse(text) : {}

            console.log("status:", res.status)
            console.log("response:", data)

            if (!res.ok) {
                setError(data.ERROR || "Failed to save entry")
                return
            }

            await fetchEntries()
            setShowModal(false)
            resetModal()
        } catch (err) {
            console.error("save entry error:", err)
            setError("Something went wrong, please try again")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="mood-page" style={{ backgroundImage: `url(${BG})` }}        >
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

                    <div className="mood-table-wrap">
                        <table className="mood-table">
                            <thead>
                                <tr>
                                    <th>date</th>
                                    <th>mood</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.length > 0 ? (
                                    entries.map((entry) => (
                                        <tr key={entry.id}>
                                            <td>{entry.date}</td>
                                            <td>
                                                <div className="mood-cell">
                                                    <span>{getMoodLabel(entry.mood)}</span>
                                                    <div className="mood-cell">
                                                        <button 
                                                            className="mood-edit-btn"
                                                            onClick={() => openEditModal(entry)}
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                        <button 
                                                            className="mood-delete-btn"
                                                            onClick={() => handleDeleteEntry(entry.id)}
                                                        >
                                                            <FaTrashAlt />
                                                        </button>
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
                                                                        >
                                                                            confirm
                                                                        </button>

                                                                        <button
                                                                            className="mood-delete-cancel"
                                                                            onClick={cancelDelete}
                                                                        >
                                                                            cancel
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
)}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="2" className="no-data">
                                            no data
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {showModal && (
                        <div className="mood-modal-overlay">
                            <div className="mood-modal">
                                <button
                                    className="mood-close-btn"
                                    onClick={() => {
                                        setShowModal(false)
                                        resetModal()
                                    }}
                                >
                                    ×
                                </button>

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
                                            {[2026, 2027, 2028].map((y) => (
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
                                                    selectedMood === mood.value ? "selected" : ""
                                                }`}
                                                onClick={() => setSelectedMood(mood.value)}
                                            >
                                                {mood.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {error && <div className="mood-error">{error}</div>}

                                <button
                                    className="mood-save-btn"
                                    onClick={handleSaveEntry}
                                    disabled={loading}
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
                </div>
            </div>
        </div>
    )
}

export default MoodEntriesPage