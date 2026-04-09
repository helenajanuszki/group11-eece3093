import { useState } from "react"
import "./styles/moodEntries.css"

const SHARK = "/shark.png"
const BG = "/bg.png"

const sampleEntries = [
    { id: 1, date: "01/11", mood: ":D" },
    { id: 2, date: "01/12", mood: ":)" },
    { id: 3, date: "01/13", mood: ":|" }
]

function MoodEntriesPage() {
    const [entries, setEntries] = useState(sampleEntries)
    const [showModal, setShowModal] = useState(false)
    const [selectedMonth, setSelectedMonth] = useState("")
    const [selectedYear, setSelectedYear] = useState("")
    const [selectedMood, setSelectedMood] = useState("")
    const [error, setError] = useState("")

    const moods = [":D", ":)", ":|", ":(", "D:"]

    const handleAddEntry = () => {
        setError("")

        if (!selectedMonth || !selectedYear) {
            setError("Please choose a month and year")
            return
        }

        if (!selectedMood) {
            setError("Please choose a mood")
            return
        }

        const formattedDate = `${selectedMonth}/01/${selectedYear}`

        const newEntry = {
            id: Date.now(),
            date: formattedDate,
            mood: selectedMood
        }

        setEntries([newEntry, ...entries])
        setSelectedMonth("")
        setSelectedYear("")
        setSelectedMood("")
        setShowModal(false)
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
                                onClick={() => setShowModal(true)}
                            >
                                +
                            </button>
                        </div>

                        {/* <div className="mood-toolbar-right">
                            <button className="mood-menu-btn">☰</button>
                            <div className="mood-profile">
                                <img src={SHARK} alt="profile" className="mood-profile-img" />
                            </div>
                        </div> */}
                    </div>

                    <div className="mood-table-wrap">
                        <table className="mood-table">
                            <thead>
                                <tr>
                                    <th>date ˅</th>
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
                                                    <span>{entry.mood}</span>
                                                    <button className="mood-edit-btn">
                                                        edit
                                                    </button>
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
                                    onClick={() => setShowModal(false)}
                                >
                                    ×
                                </button>

                                <div className="mood-modal-field">
                                    <label>choose month:</label>
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="mood-select"
                                    >
                                        <option value="">mm</option>
                                        <option value="01">01</option>
                                        <option value="02">02</option>
                                        <option value="03">03</option>
                                        <option value="04">04</option>
                                        <option value="05">05</option>
                                        <option value="06">06</option>
                                        <option value="07">07</option>
                                        <option value="08">08</option>
                                        <option value="09">09</option>
                                        <option value="10">10</option>
                                        <option value="11">11</option>
                                        <option value="12">12</option>
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
                                        <option value="2024">2024</option>
                                        <option value="2025">2025</option>
                                        <option value="2026">2026</option>
                                    </select>
                                </div>

                                <div className="mood-modal-field">
                                    <label>choose mood:</label>
                                    <div className="mood-options">
                                        {moods.map((mood) => (
                                            <button
                                                key={mood}
                                                type="button"
                                                className={`mood-option-btn ${
                                                    selectedMood === mood ? "selected" : ""
                                                }`}
                                                onClick={() => setSelectedMood(mood)}
                                            >
                                                {mood}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {error && <div className="mood-error">{error}</div>}

                                <button
                                    className="mood-save-btn"
                                    onClick={handleAddEntry}
                                >
                                    save entry
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