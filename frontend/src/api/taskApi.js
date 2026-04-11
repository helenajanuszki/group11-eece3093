import apiCall from "./client";

export async function getOwnLists() {
  return await apiCall("/lists", { method: "GET" });
}

export async function getAssignedLists() {
  return await apiCall("/lists/assigned", { method: "GET" });
}

export async function getListDetails(listId) {
  return await apiCall(`/lists/${listId}`, { method: "GET" });
}

export async function updateTask(listId, taskId, payload) {
  return await apiCall(`/lists/${listId}/tasks/${taskId}`, {
    method: "PUT",
    body: payload,
  });
}

export async function deleteTask(listId, taskId) {
  return await apiCall(`/lists/${listId}/tasks/${taskId}`, {
    method: "DELETE",
  });
}

export async function createTaskInList(listId, payload) {
  return await apiCall(`/lists/${listId}/tasks`, {
    method: "POST",
    body: payload,
  });
}

export async function assignTaskToStudents(payload) {
  return await apiCall("/tasks", {
    method: "POST",
    body: payload,
  });
}