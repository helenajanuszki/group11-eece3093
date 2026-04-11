import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  getOwnLists,
  getAssignedLists,
  getListDetails,
  updateTask,
  deleteTask,
} from "./api/taskApi";
import "./styles/lists.css";

function formatDueDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function toInputDateTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function normalizeListArray(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.lists)) return response.lists;
  if (Array.isArray(response?.data?.lists)) return response.data.lists;
  return [];
}

function normalizeTaskArray(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.tasks)) return response.tasks;
  if (Array.isArray(response?.data?.tasks)) return response.data.tasks;
  return [];
}

export default function StudentListPage() {
  const [lists, setLists] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedListId, setSelectedListId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingTask, setEditingTask] = useState(null);

  const BG = "/background-faded-blue.avif";
  const location = useLocation();

  const notifyListsChanged = () => {
    localStorage.setItem("studentListsSync", String(Date.now()));
    window.dispatchEvent(new Event("studentListsUpdated"));
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [ownListsResponse, assignedListsResponse] = await Promise.all([
        getOwnLists(),
        getAssignedLists(),
      ]);

      console.log("OWN LISTS RESPONSE:", ownListsResponse);
      console.log("ASSIGNED LISTS RESPONSE:", assignedListsResponse);

      const ownLists = normalizeListArray(ownListsResponse);
      const assignedLists = normalizeListArray(assignedListsResponse);

      const normalizedOwn = ownLists.map((list) => ({
        ...list,
        source: "own",
      }));

      const normalizedAssigned = assignedLists.map((list) => ({
        ...list,
        source: "assigned",
      }));

      const mergedMap = new Map();

      [...normalizedOwn, ...normalizedAssigned].forEach((list) => {
        mergedMap.set(String(list.id), list);
      });

      const allLists = Array.from(mergedMap.values());
      setLists(allLists);

      if (selectedListId !== "all") {
        const stillExists = allLists.some(
          (list) => String(list.id) === String(selectedListId)
        );

        if (!stillExists) {
          setSelectedListId("all");
        }
      }

      const detailResponses = await Promise.all(
        allLists.map(async (list) => {
          try {
            const full = await getListDetails(list.id);
            const listTasks = normalizeTaskArray(full);

            return {
              ...list,
              tasks: listTasks,
            };
          } catch (err) {
            console.log(`Could not load tasks for list ${list.id}:`, err);
            return {
              ...list,
              tasks: [],
            };
          }
        })
      );

      const flattened = detailResponses.flatMap((list) =>
        (list.tasks || []).map((task) => ({
          ...task,
          list_id: list.id,
          list_name: list.name,
          list_source: list.source,
          assigned_by: list.assigned_by || null,
        }))
      );

      setTasks(flattened);
    } catch (err) {
      setError(err.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [selectedListId]);

  useEffect(() => {
    loadData();
  }, [loadData, location.key]);

  useEffect(() => {
    const handleFocus = () => {
      loadData();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [loadData]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === "studentListsSync") {
        loadData();
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [loadData]);

  useEffect(() => {
    const handleListsUpdated = () => {
      loadData();
    };

    window.addEventListener("studentListsUpdated", handleListsUpdated);
    return () =>
      window.removeEventListener("studentListsUpdated", handleListsUpdated);
  }, [loadData]);

  const filteredTasks = useMemo(() => {
    if (selectedListId === "all") return tasks;
    return tasks.filter((task) => String(task.list_id) === String(selectedListId));
  }, [tasks, selectedListId]);

  async function handleStatusChange(task, newStatus) {
    try {
      await updateTask(task.list_id, task.id, { status: newStatus });
      notifyListsChanged();
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleMoveTask(task, targetListId) {
    if (!targetListId || String(targetListId) === String(task.list_id)) return;

    try {
      await updateTask(task.list_id, task.id, {
        todo_list_id: Number(targetListId),
      });
      notifyListsChanged();
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete(task) {
    try {
      await deleteTask(task.list_id, task.id);
      notifyListsChanged();
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleSaveEdit(e) {
    e.preventDefault();

    try {
      await updateTask(editingTask.list_id, editingTask.id, {
        title: editingTask.title,
        description: editingTask.description,
        due_date: editingTask.due_date || null,
        priority: editingTask.priority,
        status: editingTask.status,
      });
      setEditingTask(null);
      notifyListsChanged();
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  }

  const ownListsOnly = lists.filter((list) => list.source === "own");

  return (
    <div className="task-page" style={{ backgroundImage: `url(${BG})` }}>
      <div className="task-card">
        <div className="task-header">
          <h1>Task List</h1>

          <select
            className="task-filter"
            value={selectedListId}
            onChange={(e) => setSelectedListId(e.target.value)}
          >
            <option value="all">All Lists</option>
            {lists.map((list) => (
              <option key={list.id} value={list.id}>
                {list.name} {list.source === "assigned" ? "(assigned)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* {loading && <p className="info-text">Loading tasks...</p>}
        {error && <p className="error-text">{error}</p>} */}

        {!loading && !error && (
          <div className="task-table-wrapper">
            <table className="task-table">
              <thead>
                <tr>
                  <th>Priority</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Due</th>
                  <th>List</th>
                  <th>Move</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-row">
                      No tasks found.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => {
                    const isAssigned = task.list_source === "assigned";

                    return (
                      <tr key={`${task.list_id}-${task.id}`}>
                        <td>{task.priority || "-"}</td>
                        <td>{task.title}</td>
                        <td>{task.description || "-"}</td>
                        <td>
                          <select
                            className={`status-pill ${task.status || ""}`}
                            value={task.status || "incomplete"}
                            onChange={(e) =>
                              handleStatusChange(task, e.target.value)
                            }
                          >
                            <option value="incomplete">incomplete</option>
                            <option value="in_progress">in-progress</option>
                            <option value="complete">complete</option>
                          </select>
                        </td>
                        <td>{formatDueDate(task.due_date)}</td>
                        <td>{task.list_name}</td>
                        <td>
                          <select
                            disabled={isAssigned}
                            defaultValue=""
                            onChange={(e) =>
                              handleMoveTask(task, e.target.value)
                            }
                          >
                            <option value="">move</option>
                            {ownListsOnly.map((list) => (
                              <option key={list.id} value={list.id}>
                                {list.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="action-buttons">
                          {!isAssigned && (
                            <button
                              className="small-btn"
                              onClick={() =>
                                setEditingTask({
                                  ...task,
                                  due_date: toInputDateTime(task.due_date),
                                })
                              }
                            >
                              Edit
                            </button>
                          )}
                          <button
                            className="small-btn danger"
                            onClick={() => handleDelete(task)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingTask && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>Edit Task</h2>

            <form onSubmit={handleSaveEdit} className="task-form">
              <input
                type="text"
                value={editingTask.title}
                onChange={(e) =>
                  setEditingTask((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Task title"
                required
              />

              <textarea
                value={editingTask.description || ""}
                onChange={(e) =>
                  setEditingTask((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Description"
              />

              <input
                type="datetime-local"
                value={editingTask.due_date || ""}
                onChange={(e) =>
                  setEditingTask((prev) => ({
                    ...prev,
                    due_date: e.target.value,
                  }))
                }
              />

              <select
                value={editingTask.priority || "low"}
                onChange={(e) =>
                  setEditingTask((prev) => ({
                    ...prev,
                    priority: e.target.value,
                  }))
                }
              >
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
              </select>

              <select
                value={editingTask.status || "incomplete"}
                onChange={(e) =>
                  setEditingTask((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }))
                }
              >
                <option value="incomplete">incomplete</option>
                <option value="in_progress">in progress</option>
                <option value="complete">done</option>
              </select>

              <div className="modal-actions">
                <button type="submit" className="small-btn">
                  Save
                </button>
                <button
                  type="button"
                  className="small-btn danger"
                  onClick={() => setEditingTask(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}