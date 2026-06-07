/**
 * CloudTasks – AWS Serverless To-Do App
 * Frontend application logic — upgraded version
 */

const API_BASE_URL =
  "https://zvzesiqv22.execute-api.eu-north-1.amazonaws.com/Prod";

// ── DOM references ────────────────────────────────────────────────────────────
const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoCategory = document.getElementById("todo-category");
const todoPriority = document.getElementById("todo-priority");
const todoDue = document.getElementById("todo-due");
const addBtn = document.getElementById("add-btn");
const todoList = document.getElementById("todo-list");
const loadingEl = document.getElementById("loading");
const emptyState = document.getElementById("empty-state");
const errorBanner = document.getElementById("error-banner");
const errorMessage = document.getElementById("error-message");

const statTotal = document.getElementById("stat-total");
const statCompleted = document.getElementById("stat-completed");
const statPending = document.getElementById("stat-pending");
const statHigh = document.getElementById("stat-high");

const filterTabs = document.querySelectorAll(".filter-tab");
const filterPriorityEl = document.getElementById("filter-priority");
const filterCategoryEl = document.getElementById("filter-category");

// ── State ──────────────────────────────────────────────────────────────────────
let allTodos = [];
let currentFilter = "all"; // all | active | completed
let currentPriority = "all"; // all | High | Medium | Low
let currentCategory = "all"; // all | Work | School | Personal | Other

// ── Header date ───────────────────────────────────────────────────────────────
(function setHeaderDate() {
  const el = document.getElementById("header-date");
  if (!el) return;
  el.textContent = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
})();

// ── Error helpers ─────────────────────────────────────────────────────────────
function showError(message) {
  errorMessage.textContent = message;
  errorBanner.hidden = false;
}

function dismissError() {
  errorBanner.hidden = true;
  errorMessage.textContent = "";
}

// Expose for inline onclick in HTML
window.dismissError = dismissError;

// ── Loading helpers ───────────────────────────────────────────────────────────
function setListLoading(loading) {
  loadingEl.hidden = !loading;
  if (loading) {
    todoList.hidden = true;
    emptyState.hidden = true;
  }
}

function setAddLoading(loading) {
  addBtn.disabled = loading;
  addBtn.classList.toggle("is-loading", loading);
  todoInput.disabled = loading;
  todoCategory.disabled = loading;
  todoPriority.disabled = loading;
  todoDue.disabled = loading;
}

// ── Date helpers ──────────────────────────────────────────────────────────────
/**
 * Format a date string for display.
 * @param {string|null} dateStr - ISO date string or YYYY-MM-DD.
 * @returns {{ text: string, overdue: boolean }}
 */
function formatDueDate(dateStr) {
  if (!dateStr) return { text: "", overdue: false };
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return { text: "", overdue: false };

  // Compare calendar dates (no time component)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(date);
  due.setHours(0, 0, 0, 0);
  const overdue = due < today;

  const text = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year:
      date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });

  return { text: overdue ? `Overdue · ${text}` : text, overdue };
}

// ── Stats ─────────────────────────────────────────────────────────────────────
function updateStats(todos) {
  const total = todos.length;
  const completed = todos.filter((t) => t.completed).length;
  const pending = total - completed;
  const high = todos.filter((t) => t.priority === "High").length;

  statTotal.textContent = total;
  statCompleted.textContent = completed;
  statPending.textContent = pending;
  statHigh.textContent = high;
}

// ── Filters ───────────────────────────────────────────────────────────────────
function applyFilters(todos) {
  return todos.filter((t) => {
    // Status filter
    if (currentFilter === "active" && t.completed) return false;
    if (currentFilter === "completed" && !t.completed) return false;
    // Priority filter
    if (currentPriority !== "all" && t.priority !== currentPriority)
      return false;
    // Category filter
    if (currentCategory !== "all" && t.category !== currentCategory)
      return false;
    return true;
  });
}

// ── Render ────────────────────────────────────────────────────────────────────
function priorityBadgeClass(priority) {
  switch ((priority || "").toLowerCase()) {
    case "high":
      return "badge-priority-high";
    case "low":
      return "badge-priority-low";
    default:
      return "badge-priority-medium";
  }
}

function categoryBadgeClass(category) {
  switch ((category || "").toLowerCase()) {
    case "work":
      return "badge-cat-work";
    case "school":
      return "badge-cat-school";
    case "personal":
      return "badge-cat-personal";
    default:
      return "badge-cat-other";
  }
}

function renderTodos(todos) {
  todoList.innerHTML = "";

  if (!todos || todos.length === 0) {
    todoList.hidden = true;
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;
  todoList.hidden = false;

  todos.forEach((todo) => {
    const li = document.createElement("li");
    li.className = `todo-item${todo.completed ? " completed" : ""}`;
    li.dataset.id = todo.id;

    // ── Checkbox ──────────────────────────────────────────────
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "todo-checkbox";
    checkbox.checked = !!todo.completed;
    checkbox.setAttribute(
      "aria-label",
      `Mark "${todo.title}" as ${todo.completed ? "incomplete" : "complete"}`,
    );
    checkbox.addEventListener("change", () => {
      toggleComplete(todo.id, checkbox.checked, li);
    });

    // ── Title ─────────────────────────────────────────────────
    const titleSpan = document.createElement("span");
    titleSpan.className = "todo-title";
    titleSpan.textContent = todo.title;

    // ── Badges ────────────────────────────────────────────────
    const badgesDiv = document.createElement("div");
    badgesDiv.className = "todo-badges";

    const catBadge = document.createElement("span");
    catBadge.className = `badge ${categoryBadgeClass(todo.category || "Other")}`;
    catBadge.textContent = todo.category || "Other";

    const priLabel = todo.priority || "Medium";
    const priBadge = document.createElement("span");
    priBadge.className = `badge ${priorityBadgeClass(priLabel)}`;
    priBadge.textContent = priLabel;

    badgesDiv.appendChild(catBadge);
    badgesDiv.appendChild(priBadge);

    // ── Due date ──────────────────────────────────────────────
    const dueSpan = document.createElement("span");
    dueSpan.className = "todo-due";
    if (todo.dueDate) {
      const { text, overdue } = formatDueDate(todo.dueDate);
      dueSpan.textContent = text;
      if (overdue) dueSpan.classList.add("overdue");
    }

    // ── Delete button ─────────────────────────────────────────
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.setAttribute("aria-label", `Delete task: ${todo.title}`);
    deleteBtn.innerHTML = "✕";
    deleteBtn.addEventListener("click", () => deleteTodo(todo.id, li));

    // ── Assemble ──────────────────────────────────────────────
    li.appendChild(checkbox);
    li.appendChild(titleSpan);
    li.appendChild(badgesDiv);
    if (todo.dueDate) li.appendChild(dueSpan);
    li.appendChild(deleteBtn);

    todoList.appendChild(li);
  });
}

// ── API: Load todos ───────────────────────────────────────────────────────────
async function loadTodos() {
  dismissError();
  setListLoading(true);

  try {
    const response = await fetch(`${API_BASE_URL}/todos`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(body || `Server error: ${response.status}`);
    }

    allTodos = await response.json();
    updateStats(allTodos);
    renderTodos(applyFilters(allTodos));
  } catch (err) {
    if (err.name === "TypeError") {
      showError(
        "Could not connect to the API. Please check your network or deployment configuration.",
      );
    } else {
      showError(`Failed to load tasks: ${err.message}`);
    }
    todoList.hidden = true;
    emptyState.hidden = true;
  } finally {
    setListLoading(false);
  }
}

// ── API: Add todo ─────────────────────────────────────────────────────────────
async function addTodo() {
  const title = todoInput.value.trim();
  const category = todoCategory.value;
  const priority = todoPriority.value;
  const dueDate = todoDue.value || null;

  if (!title) {
    todoInput.focus();
    showError("Please enter a task title before adding.");
    return;
  }

  dismissError();
  setAddLoading(true);

  try {
    const response = await fetch(`${API_BASE_URL}/todos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ title, category, priority, dueDate }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(body || `Server error: ${response.status}`);
    }

    // Reset form fields
    todoInput.value = "";
    todoDue.value = "";
    todoCategory.value = "School";
    todoPriority.value = "Medium";

    await loadTodos();
  } catch (err) {
    if (err.name === "TypeError") {
      showError(
        "Could not connect to the API. Please check your network or deployment configuration.",
      );
    } else {
      showError(`Failed to add task: ${err.message}`);
    }
  } finally {
    setAddLoading(false);
    todoInput.focus();
  }
}

// ── API: Delete todo ──────────────────────────────────────────────────────────
async function deleteTodo(id, listItem) {
  if (!id) return;
  dismissError();

  listItem.classList.add("is-deleting");

  try {
    const response = await fetch(
      `${API_BASE_URL}/todos?id=${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: { Accept: "application/json" },
      },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(body || `Server error: ${response.status}`);
    }

    // Remove from local cache and re-render
    allTodos = allTodos.filter((t) => t.id !== id);
    updateStats(allTodos);
    listItem.remove();

    if (todoList.children.length === 0) {
      todoList.hidden = true;
      emptyState.hidden = false;
    }
  } catch (err) {
    listItem.classList.remove("is-deleting");
    if (err.name === "TypeError") {
      showError(
        "Could not connect to the API. Please check your network or deployment configuration.",
      );
    } else {
      showError(`Failed to delete task: ${err.message}`);
    }
  }
}

// ── API: Toggle complete ──────────────────────────────────────────────────────
async function toggleComplete(id, completed, listItem) {
  if (!id) return;

  // Optimistic update
  listItem.classList.toggle("completed", completed);
  const titleEl = listItem.querySelector(".todo-title");
  if (titleEl) {
    titleEl.style.textDecoration = completed ? "line-through" : "";
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/todos/complete?id=${encodeURIComponent(id)}&completed=${completed}`,
      {
        method: "PATCH",
        headers: { Accept: "application/json" },
      },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(body || `Server error: ${response.status}`);
    }

    // Sync local cache
    const todo = allTodos.find((t) => t.id === id);
    if (todo) todo.completed = completed;
    updateStats(allTodos);

    // If filter hides this item now, re-render after a brief delay
    if (currentFilter !== "all") {
      setTimeout(() => renderTodos(applyFilters(allTodos)), 400);
    }
  } catch (err) {
    // Roll back optimistic update
    listItem.classList.toggle("completed", !completed);
    if (titleEl) {
      titleEl.style.textDecoration = !completed ? "line-through" : "";
    }

    const todo = allTodos.find((t) => t.id === id);
    if (todo) todo.completed = !completed; // undo cache change

    if (err.name === "TypeError") {
      showError(
        "Could not connect to the API. Please check your network or deployment configuration.",
      );
    } else {
      showError(`Failed to update task: ${err.message}`);
    }
  }
}

// ── Filter event listeners ────────────────────────────────────────────────────
filterTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    filterTabs.forEach((t) => {
      t.classList.remove("active");
      t.setAttribute("aria-selected", "false");
    });
    tab.classList.add("active");
    tab.setAttribute("aria-selected", "true");
    currentFilter = tab.dataset.filter;
    renderTodos(applyFilters(allTodos));
  });
});

filterPriorityEl.addEventListener("change", () => {
  currentPriority = filterPriorityEl.value;
  renderTodos(applyFilters(allTodos));
});

filterCategoryEl.addEventListener("change", () => {
  currentCategory = filterCategoryEl.value;
  renderTodos(applyFilters(allTodos));
});

// ── Form submit ───────────────────────────────────────────────────────────────
todoForm.addEventListener("submit", (e) => {
  e.preventDefault();
  addTodo();
});

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", loadTodos);
