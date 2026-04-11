import apiCall from "./client";

export async function getOwnLists() {
  const res = await apiCall("/lists", {
    method: "GET",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.ERROR || "Failed to load own lists");
  }

  return data;
}

export async function getAssignedLists() {
  const res = await apiCall("/lists/assigned", {
    method: "GET",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.ERROR || "Failed to load assigned lists");
  }

  return data;
}

export async function getListDetails(listId) {
  const res = await apiCall(`/lists/${listId}`, {
    method: "GET",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.ERROR || "Failed to load list details");
  }

  return data;
}

export async function updateTask(listId, taskId, updates) {
  const res = await apiCall(`/lists/${listId}/tasks/${taskId}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.ERROR || "Failed to update task");
  }

  return data;
}

export async function deleteTask(listId, taskId) {
  const res = await apiCall(`/lists/${listId}/tasks/${taskId}`, {
    method: "DELETE",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.ERROR || "Failed to delete task");
  }

  return data;
}