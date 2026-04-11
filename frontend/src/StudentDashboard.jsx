import { useEffect, useState } from "react"
import apiCall from "./api/client"
import "./styles/student-dashboard.css"
import { FaGrinBeam, FaSmile, FaMeh, FaFrown, FaSadTear } from "react-icons/fa"

const BG = "/background-faded-blue.avif"

const MOODS = [
  { icon: <FaGrinBeam />, value: 5 },
  { icon: <FaSmile />, value: 4 },
  { icon: <FaMeh />, value: 3 },
  { icon: <FaFrown />, value: 2 },
  { icon: <FaSadTear />, value: 1 },
]

function todayISODate() {
  return new Date().toISOString().slice(0, 10)
}

function formatDueDateTime(value) {
  if (!value) return "-"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString([], {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function StudentDashboard() {
  const [personalLists, setPersonalLists] = useState([])
  const [adminLists, setAdminLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [selectedMood, setSelectedMood] = useState(null)
  const [journalContent, setJournalContent] = useState("")
  const [savingEntry, setSavingEntry] = useState(false)
  const [entryMessage, setEntryMessage] = useState("")

  const [selectedList, setSelectedList] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loadingTasks, setLoadingTasks] = useState(false)

  const [selectedTask, setSelectedTask] = useState(null)
  const [savingTask, setSavingTask] = useState(false)
  const [taskMessage, setTaskMessage] = useState("")

  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [addingTask, setAddingTask] = useState(false)
  const [addTaskMessage, setAddTaskMessage] = useState("")
  const [newTaskForm, setNewTaskForm] = useState({
    title: "",
    description: "",
    due_date: "",
    priority: "low",
    status: "incomplete",
  })

  const [showAddListModal, setShowAddListModal] = useState(false)
  const [addingList, setAddingList] = useState(false)
  const [addListMessage, setAddListMessage] = useState("")
  const [newListForm, setNewListForm] = useState({
    name: "",
    description: "",
  })

  const notifyListsChanged = () => {
    localStorage.setItem("studentListsSync", String(Date.now()));
    window.dispatchEvent(new Event("studentListsUpdated"));
  };

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    due_date: "",
    priority: "low",
    status: "incomplete",
  })

  const isAssignedSelectedList = Boolean(selectedList?.assigned_by)

  const toInputDateTime = (iso) => (iso ? String(iso).slice(0, 16) : "")

  const getPriorityClass = (priority) => {
    const p = String(priority || "low").toLowerCase()
    if (p === "high") return "priority-high"
    if (p === "medium") return "priority-medium"
    return "priority-low"
  }

  const loadLists = async () => {
    setLoading(true)
    setError("")
    try {
      const [personalRes, adminRes] = await Promise.all([
        apiCall("/lists", { method: "GET" }),
        apiCall("/lists/assigned", { method: "GET" }),
      ])

      const personalData = await personalRes.json()
      const adminData = await adminRes.json()

      if (!personalRes.ok) throw new Error(personalData.ERROR || "Failed to load personal lists")
      if (!adminRes.ok) throw new Error(adminData.ERROR || "Failed to load admin lists")

      const allPersonal = Array.isArray(personalData) ? personalData : []
      const assigned = Array.isArray(adminData) ? adminData : []

      const assignedIds = new Set(assigned.map((l) => l.id))
      const personalOnly = allPersonal.filter((l) => !assignedIds.has(l.id))

      setPersonalLists(personalOnly)
      setAdminLists(assigned)
    } catch (e) {
      setError(e.message || "Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === "studentListsSync") {
        loadLists();

        if (selectedList) {
          loadTasksForList(selectedList);
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [selectedList]);

  useEffect(() => {
    const handleFocus = () => {
      loadLists();
      if (selectedList) {
        loadTasksForList(selectedList);
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [selectedList]);

  useEffect(() => {
    const handleListsUpdated = async () => {
      await loadLists();
      if (selectedList) {
        await loadTasksForList(selectedList);
      }
    };

    window.addEventListener("studentListsUpdated", handleListsUpdated);
    return () => window.removeEventListener("studentListsUpdated", handleListsUpdated);
  }, [selectedList]);

  useEffect(() => {
    loadLists()
  }, [])

  const loadTasksForList = async (list) => {
    setSelectedList(list)
    setSelectedTask(null)
    setTaskMessage("")
    setLoadingTasks(true)
    setError("")
    try {
      const res = await apiCall(`/lists/${list.id}`, { method: "GET" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.ERROR || "Failed to load tasks")

      const nextTasks = Array.isArray(data?.tasks) ? data.tasks : Array.isArray(data) ? data : []
      setTasks(nextTasks)
    } catch (e) {
      setTasks([])
      setError(e.message || "Failed to load tasks")
    } finally {
      setLoadingTasks(false)
    }
  }

  const closeTaskEditor = () => {
    setSelectedTask(null)
    setTaskMessage("")
  }

  const pickTask = (task) => {
    setSelectedTask(task)
    setTaskMessage("")
    setTaskForm({
      title: task.title || "",
      description: task.description || "",
      due_date: toInputDateTime(task.due_date),
      priority: task.priority || "low",
      status: task.status || "incomplete",
    })
  }

  const handleUpdateTask = async () => {
    if (!selectedList || !selectedTask) return
    setSavingTask(true)
    setTaskMessage("")
    setError("")
    try {
      const payload = isAssignedSelectedList
        ? { status: taskForm.status }
        : {
            title: taskForm.title,
            description: taskForm.description,
            due_date: taskForm.due_date || null,
            priority: taskForm.priority,
            status: taskForm.status,
          }

      const res = await apiCall(`/lists/${selectedList.id}/tasks/${selectedTask.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.ERROR || "Failed to update task")

      await loadTasksForList(selectedList);
      notifyListsChanged();
      closeTaskEditor();
    } catch (e) {
      setTaskMessage(e.message || "Failed to update task")
    } finally {
      setSavingTask(false)
    }
  }

  const handleTaskField = (field, value) => {
    setTaskForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveJournal = async () => {
    if (!selectedMood) {
      setEntryMessage("Please select a mood.")
      return
    }

    setSavingEntry(true)
    setEntryMessage("")
    try {
      const res = await apiCall("/journal", {
        method: "POST",
        body: JSON.stringify({
          date: todayISODate(),
          mood: selectedMood.value,
          content: journalContent.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.ERROR || "Failed to save journal entry")

      setJournalContent("")
      setEntryMessage("Journal entry saved.")
    } catch (e) {
      setEntryMessage(e.message || "Failed to save journal entry")
    } finally {
      setSavingEntry(false)
    }
  }

  const handleMoodSelect = (mood) => {
    setEntryMessage("")
    setSelectedMood((prev) => {
      const isSame = prev?.value === mood.value
      if (isSame) {
        setJournalContent("")
        return null
      }
      return mood
    })
  }

  const openAddTaskModal = () => {
    if (!selectedList || isAssignedSelectedList) return
    setAddTaskMessage("")
    setNewTaskForm({
      title: "",
      description: "",
      due_date: "",
      priority: "low",
      status: "incomplete",
    })
    setShowAddTaskModal(true)
  }

  const closeAddTaskModal = () => {
    setShowAddTaskModal(false)
    setAddTaskMessage("")
  }

  const handleNewTaskField = (field, value) => {
    setNewTaskForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleCreateTask = async () => {
    if (!selectedList) return
    if (!newTaskForm.title.trim()) {
      setAddTaskMessage("Task title is required.")
      return
    }

    setAddingTask(true)
    setAddTaskMessage("")
    try {
      const res = await apiCall(`/lists/${selectedList.id}/tasks`, {
        method: "POST",
        body: JSON.stringify({
          title: newTaskForm.title.trim(),
          description: newTaskForm.description?.trim() || "",
          due_date: newTaskForm.due_date || null,
          priority: newTaskForm.priority,
          status: newTaskForm.status,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.ERROR || "Failed to create task")

      await loadTasksForList(selectedList);
      notifyListsChanged();
      closeAddTaskModal();
    } catch (e) {
      setAddTaskMessage(e.message || "Failed to create task")
    } finally {
      setAddingTask(false)
    }
  }

  const openAddListModal = () => {
    setAddListMessage("")
    setNewListForm({ name: "", description: "" })
    setShowAddListModal(true)
  }

  const closeAddListModal = () => {
    setShowAddListModal(false)
    setAddListMessage("")
  }

  const handleListField = (field, value) => {
    setNewListForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleCreateList = async () => {
    if (!newListForm.name.trim()) {
      setAddListMessage("List name is required.")
      return
    }

    setAddingList(true)
    setAddListMessage("")
    try {
      const res = await apiCall("/lists", {
        method: "POST",
        body: JSON.stringify({
          name: newListForm.name.trim(),
          description: newListForm.description?.trim() || "",
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.ERROR || "Failed to create list")

      await loadLists();
      notifyListsChanged();
      closeAddListModal();
    } catch (e) {
      setAddListMessage(e.message || "Failed to create list")
    } finally {
      setAddingList(false)
    }
  }

  return (
    <main className="sd-page" style={{ backgroundImage: `url(${BG})` }}>
      <div className="sd-shell">
        <div className="sd-header-top">Dashboard</div>

        <section className="sd-card sd-mood-card">
          <h2 className="sd-title">How are you feeling today?</h2>

          <div className="sd-mood-row">
            {MOODS.map((mood) => (
              <button
                key={mood.value}
                type="button"
                className={`sd-mood-btn ${selectedMood?.value === mood.value ? "is-active" : ""}`}
                onClick={() => handleMoodSelect(mood)}
                aria-label={`Mood ${mood.value}`}
              >
                <span className="sd-mood-icon">{mood.icon}</span>
              </button>
            ))}
          </div>

          {selectedMood && (
            <div className="sd-journal">
              <textarea
                className="sd-input"
                rows={4}
                placeholder="Write a quick journal entry..."
                value={journalContent}
                onChange={(e) => setJournalContent(e.target.value)}
              />
              <button className="sd-btn" onClick={handleSaveJournal} disabled={savingEntry}>
                {savingEntry ? "Saving..." : "Save Journal Entry"}
              </button>
              {entryMessage ? <p className="sd-note">{entryMessage}</p> : null}
            </div>
          )}
        </section>

        <section className="sd-grid">
          <div className="sd-left-col">
            <article className="sd-card">
              <div className="sd-title-row">
                <h3 className="sd-title">My Personal Lists</h3>
                <button type="button" className="sd-btn" onClick={openAddListModal}>
                  + Add List
                </button>
              </div>

              {loading ? (
                <p className="sd-text">Loading...</p>
              ) : personalLists.length === 0 ? (
                <p className="sd-text">No personal lists yet.</p>
              ) : (
                <ul className="sd-list">
                  {personalLists.map((list) => (
                    <li key={list.id}>
                      <button
                        className={`sd-list-item-btn ${selectedList?.id === list.id ? "is-active" : ""}`}
                        onClick={() => loadTasksForList(list)}
                      >
                        <strong>{list.name}</strong>
                        <span>{list.description || "No description"}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="sd-card">
              <h3 className="sd-title">Lists from Admins</h3>
              {loading ? (
                <p className="sd-text">Loading...</p>
              ) : adminLists.length === 0 ? (
                <p className="sd-text">No admin-assigned lists.</p>
              ) : (
                <ul className="sd-list">
                  {adminLists.map((list) => (
                    <li key={list.id}>
                      <button
                        className={`sd-list-item-btn ${selectedList?.id === list.id ? "is-active" : ""}`}
                        onClick={() => loadTasksForList(list)}
                      >
                        <strong>{list.name}</strong>
                        <span>{list.description || "No description"}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </div>

          <article className="sd-card">
            <div className="sd-title-row">
              <h3 className="sd-title">Tasks {selectedList ? `- ${selectedList.name}` : ""}</h3>
              <button
                type="button"
                className="sd-btn"
                onClick={openAddTaskModal}
                disabled={!selectedList || isAssignedSelectedList}
              >
                + Add Task
              </button>
            </div>

            {!selectedList ? (
              <p className="sd-text">Select a list to view tasks.</p>
            ) : loadingTasks ? (
              <p className="sd-text">Loading tasks...</p>
            ) : tasks.length === 0 ? (
              <p className="sd-text">No tasks in this list.</p>
            ) : (
              <ul className="sd-task-list">
                {tasks.map((task) => (
                  <li key={task.id}>
                    <button
                      className={`sd-task-item ${getPriorityClass(task.priority)} ${selectedTask?.id === task.id ? "is-active" : ""}`}
                      onClick={() => pickTask(task)}
                    >
                      <strong>{task.title || task.name || "Task"}</strong>
                      <span>{task.description || "No description"}</span>
                      <span>Due: {formatDueDateTime(task.due_date)}</span>
                      <span>Status: {task.status || "incomplete"}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>

        {showAddListModal && (
          <div className="sd-modal-overlay" onClick={closeAddListModal}>
            <div className="sd-modal" onClick={(e) => e.stopPropagation()}>
              <button className="sd-modal-close" type="button" onClick={closeAddListModal}>
                ×
              </button>

              <h4 className="sd-title">Add Personal List</h4>

              <input
                className="sd-input"
                value={newListForm.name}
                onChange={(e) => handleListField("name", e.target.value)}
                placeholder="List name"
              />
              <textarea
                className="sd-input"
                rows={3}
                value={newListForm.description}
                onChange={(e) => handleListField("description", e.target.value)}
                placeholder="Description (optional)"
              />

              <button className="sd-btn" type="button" onClick={handleCreateList} disabled={addingList}>
                {addingList ? "Saving..." : "Create List"}
              </button>
              {addListMessage ? <p className="sd-note">{addListMessage}</p> : null}
            </div>
          </div>
        )}

        {showAddTaskModal && (
          <div className="sd-modal-overlay" onClick={closeAddTaskModal}>
            <div className="sd-modal" onClick={(e) => e.stopPropagation()}>
              <button className="sd-modal-close" type="button" onClick={closeAddTaskModal}>
                ×
              </button>

              <h4 className="sd-title">Add Task</h4>

              <input
                className="sd-input"
                value={newTaskForm.title}
                onChange={(e) => handleNewTaskField("title", e.target.value)}
                placeholder="Title"
              />
              <textarea
                className="sd-input"
                rows={3}
                value={newTaskForm.description}
                onChange={(e) => handleNewTaskField("description", e.target.value)}
                placeholder="Description (optional)"
              />
              <input
                className="sd-input"
                type="datetime-local"
                value={newTaskForm.due_date}
                onChange={(e) => handleNewTaskField("due_date", e.target.value)}
              />
              <select
                className="sd-input"
                value={newTaskForm.priority}
                onChange={(e) => handleNewTaskField("priority", e.target.value)}
              >
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
              </select>
              <select
                className="sd-input"
                value={newTaskForm.status}
                onChange={(e) => handleNewTaskField("status", e.target.value)}
              >
                <option value="incomplete">incomplete</option>
                <option value="in_progress">in_progress</option>
                <option value="complete">complete</option>
              </select>

              <button className="sd-btn" type="button" onClick={handleCreateTask} disabled={addingTask}>
                {addingTask ? "Saving..." : "Create Task"}
              </button>
              {addTaskMessage ? <p className="sd-note">{addTaskMessage}</p> : null}
            </div>
          </div>
        )}

        {selectedTask && (
          <div className="sd-modal-overlay" onClick={closeTaskEditor}>
            <div className="sd-modal" onClick={(e) => e.stopPropagation()}>
              <button className="sd-modal-close" type="button" onClick={closeTaskEditor}>
                ×
              </button>

              <h4 className="sd-title">Edit Task</h4>

              <input
                className="sd-input"
                value={taskForm.title}
                onChange={(e) => handleTaskField("title", e.target.value)}
                disabled={isAssignedSelectedList}
                placeholder="Title"
              />
              <textarea
                className="sd-input"
                rows={3}
                value={taskForm.description}
                onChange={(e) => handleTaskField("description", e.target.value)}
                disabled={isAssignedSelectedList}
                placeholder="Description"
              />
              <input
                className="sd-input"
                type="datetime-local"
                value={taskForm.due_date}
                onChange={(e) => handleTaskField("due_date", e.target.value)}
                disabled={isAssignedSelectedList}
              />
              <select
                className="sd-input"
                value={taskForm.priority}
                onChange={(e) => handleTaskField("priority", e.target.value)}
                disabled={isAssignedSelectedList}
              >
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
              </select>
              <select
                className="sd-input"
                value={taskForm.status}
                onChange={(e) => handleTaskField("status", e.target.value)}
              >
                <option value="incomplete">incomplete</option>
                <option value="in_progress">in_progress</option>
                <option value="complete">complete</option>
              </select>

              <button className="sd-btn" type="button" onClick={handleUpdateTask} disabled={savingTask}>
                {savingTask ? "Saving..." : "Save Task"}
              </button>
              {taskMessage ? <p className="sd-note">{taskMessage}</p> : null}
            </div>
          </div>
        )}

        {error ? <p className="sd-error">{error}</p> : null}
      </div>
    </main>
  )
}