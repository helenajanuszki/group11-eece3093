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
import apiCall from "./api/client";
import { FaTrashAlt, FaEdit } from "react-icons/fa"


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

export default function ListPage() {
  const [lists, setLists] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedListId, setSelectedListId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingTask, setEditingTask] = useState(null);
  const [showDeleteTaskModal, setShowDeleteTaskModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [showDeleteListModal, setShowDeleteListModal] = useState(false);
  const [listToDelete, setListToDelete] = useState(null);

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
        is_admin_list: false,
      }));

      const normalizedAssigned = assignedLists.map((list) => ({
        ...list,
        source: "assigned",
        is_admin_list: true,
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

          is_locked:
            list.source === "assigned" ||
            list.is_admin_list === true ||
            task.is_admin_created === true,
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
    setTaskToDelete(task);
    setShowDeleteTaskModal(true);
  }

  async function confirmDeleteTask() {
    if (!taskToDelete) return;

    try {
      await deleteTask(taskToDelete.list_id, taskToDelete.id);
      notifyListsChanged();
      await loadData();
      setShowDeleteTaskModal(false);
      setTaskToDelete(null);
    } catch (err) {
      alert(err.message);
    }
  }

  function cancelDeleteTask() {
    setShowDeleteTaskModal(false);
    setTaskToDelete(null);
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

  const [showAddList, setShowAddList] = useState(false);
  const [newListName, setNewListName] = useState("");

  async function handleCreateList() {
    if (!newListName.trim()) return;

    try {
        await apiCall("/lists", {
        method: "POST",
        body: JSON.stringify({
            name: newListName,
            description: "",
        }),
        });

        setNewListName("");
        setShowAddList(false);
        notifyListsChanged();
        await loadData();
    } catch (err) {
        alert(err.message);
        }
    }

    function handleDeleteList(listId) {
      const targetList = lists.find((list) => String(list.id) === String(listId)) || null;
      if (!targetList || targetList.is_default || targetList.source !== "own") {
        return;
      }
      setListToDelete(targetList);
      setShowDeleteListModal(true);
    }

    async function confirmDeleteList() {
      if (!listToDelete) return;
      if (listToDelete.is_default || listToDelete.source !== "own") {
        setShowDeleteListModal(false);
        setListToDelete(null);
        return;
      }

      try {
        await apiCall(`/lists/${listToDelete.id}`, {
          method: "DELETE",
        });

        notifyListsChanged();
        await loadData();
        setShowDeleteListModal(false);
        setListToDelete(null);
      } catch (err) {
        alert(err.message);
      }
    }

    function cancelDeleteList() {
      setShowDeleteListModal(false);
      setListToDelete(null);
    }

  const selectedList =
    selectedListId === "all"
      ? null
      : lists.find((list) => String(list.id) === String(selectedListId)) || null;
  const canDeleteSelectedList =
    !!selectedList && selectedList.source === "own" && selectedList.is_default !== true;

  const ownListsOnly = lists.filter((list) => list.source === "own");

  const [showAddTask, setShowAddTask] = useState(false);
    const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    due_date: "",
    priority: "low",
    });

    async function handleCreateTask() {
    if (!newTask.title.trim() || selectedListId === "all") return;

    try {
        await apiCall(`/lists/${selectedListId}/tasks`, {
        method: "POST",
        body: JSON.stringify(newTask),
        });

        setNewTask({
        title: "",
        description: "",
        due_date: "",
        priority: "low",
        });

        setShowAddTask(false);
        notifyListsChanged();
        await loadData();
    } catch (err) {
        alert(err.message);
    }
    }

  return (
    <div className="task-page" style={{ backgroundImage: `url(${BG})` }}>
      <div className="task-card">
        <div className="task-header">
          <h1>Task List</h1>

          <div className="task-header-actions">
            <button className="small-btn" onClick={() => setShowAddList(true)}>
                + List
            </button>

            {selectedListId !== "all" && (
                <button
                    className="small-btn danger"
                disabled={!canDeleteSelectedList}
                title={canDeleteSelectedList ? "Delete list" : "Default lists cannot be deleted"}
                    onClick={() => handleDeleteList(selectedListId)}
                >
                    <FaTrashAlt />
                </button>
            )}

            <select
                className="task-filter"
                value={selectedListId}
                onChange={(e) => setSelectedListId(e.target.value)}
            >
                <option value="all">All Lists</option>
                {lists.map((list) => (
                    <option key={list.id} value={list.id}>
                        {list.name}
                    </option>
                ))}
                </select>
            </div>
        </div>

        <div className="task-toolbar">
            <button
                className="small-btn"
                disabled={selectedListId === "all"}
                onClick={() => setShowAddTask(true)}
            >
                + Task
            </button>
        </div>

        {loading && <p className="info-text">Loading tasks...</p>}
        {error && <p className="error-text">{error}</p>}

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
                            <option value="incomplete">Incomplete</option>
                            <option value="in_progress">In-progress</option>
                            <option value="complete">Complete</option>
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
                            <option value="">Move</option>
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
                              <FaEdit />
                            </button>
                          )}
                          <button
                            className="small-btn danger"
                            onClick={() => handleDelete(task)}
                          >
                            <FaTrashAlt />
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

      {showAddList && (
        <div className="modal-overlay">
            <div className="modal-card">
                <h2>Add List</h2>
            <form className="task-form">
            <input
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="List name"
            />

            <div className="modal-actions">
                <button className="small-btn" onClick={handleCreateList}>
                Create
                </button>
                <button
                className="small-btn danger"
                onClick={() => setShowAddList(false)}
                >
                Cancel
                </button>
            </div>
            </form>
            </div>
        </div>
      )}
      {showAddTask && (
        <div className="modal-overlay">
            <div className="modal-card">
            <h2>Add Task</h2>
        <form className="task-form">
            <input
                placeholder="Title"
                value={newTask.title}
                onChange={(e) =>
                setNewTask((prev) => ({ ...prev, title: e.target.value }))
                }
            />

            <textarea
                placeholder="Description"
                value={newTask.description}
                onChange={(e) =>
                setNewTask((prev) => ({ ...prev, description: e.target.value }))
                }
            />

            <input
                type="datetime-local"
                value={newTask.due_date}
                onChange={(e) =>
                setNewTask((prev) => ({ ...prev, due_date: e.target.value }))
                }
            />

            <select
                value={newTask.priority}
                onChange={(e) =>
                setNewTask((prev) => ({ ...prev, priority: e.target.value }))
                }
            >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
            </select>

            <div className="modal-actions">
                <button className="small-btn" onClick={handleCreateTask}>
                Create
                </button>
                <button
                className="small-btn danger"
                onClick={() => setShowAddTask(false)}
                >
                Cancel
                </button>
            </div>
            </form>
            </div>
        </div>
      )}

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
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
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
                <option value="incomplete">Incomplete</option>
                <option value="in_progress">In-progress</option>
                <option value="complete">Complete</option>
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

      {showDeleteTaskModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2 className="task-delete-title">Delete Task?</h2>
            <p className="task-delete-text">
              Are you sure you want to delete "{taskToDelete?.title || "Untitled"}"?
              <br />
              This action cannot be undone.
            </p>

            <div className="task-delete-actions">
              <button
                type="button"
                className="task-delete-confirm"
                onClick={confirmDeleteTask}
              >
                Delete
              </button>
              <button
                type="button"
                className="task-delete-cancel"
                onClick={cancelDeleteTask}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteListModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2 className="task-delete-title">Delete List?</h2>
            <p className="task-delete-text">
              Are you sure you want to delete "{listToDelete?.name || "this list"}"?
              <br />
              This action cannot be undone.
            </p>

            <div className="task-delete-actions">
              <button
                type="button"
                className="task-delete-confirm"
                onClick={confirmDeleteList}
              >
                Delete
              </button>
              <button
                type="button"
                className="task-delete-cancel"
                onClick={cancelDeleteList}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}