/**
 * CloudTasks – AWS Serverless To-Do App
 * Frontend application logic
 */

const API_BASE_URL =
  "https://zvzesiqv22.execute-api.eu-north-1.amazonaws.com/Prod";

// ── DOM references ──────────────────────────────────────────────────────────
const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const addBtn = document.getElementById("add-btn");
const todoList = document.getElementById("todo-list");
const loadingEl = document.getElementById("loading");
const emptyState = document.getElementById("empty-state");
const errorBanner = document.getElementById("error-banner");
const errorMessage = document.getElementById("error-message");

// ── State ────────────────────────────────────────────────────────────────────
let isLoading = false;

// ── Error handling ───────────────────────────────────────────────────────────
function showError(message) {
  errorMessage.textContent = message;
  errorBanner.hidden = false;
}

function dismissError() {
  errorBanner.hidden = true;
  errorMessage.textContent = "";
}

// ── Loading state helpers ────────────────────────────────────────────────────
function setListLoading(loading) {
  isLoading = loading;
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
}

// ── Date formatting ──────────────────────────────────────────────────────────
function formatDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year:
      date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

// ── Render ───────────────────────────────────────────────────────────────────
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
    li.className = "todo-item";
    li.dataset.id = todo.id;

    // Sanitise text content via textContent (no XSS risk)
    const titleSpan = document.createElement("span");
    titleSpan.className = "todo-title";
    titleSpan.textContent = todo.title;

    const metaSpan = document.createElement("span");
    metaSpan.className = "todo-meta";
    metaSpan.textContent = formatDate(todo.createdAt);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.setAttribute("aria-label", `Delete task: ${todo.title}`);
    deleteBtn.textContent = "✕";
    deleteBtn.addEventListener("click", () => deleteTodo(todo.id, li));

    li.appendChild(titleSpan);
    li.appendChild(metaSpan);
    li.appendChild(deleteBtn);
    todoList.appendChild(li);
  });
}

// ── API calls ────────────────────────────────────────────────────────────────

/**
 * Fetch all todos from the API and render them.
 */
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

    const todos = await response.json();
    renderTodos(todos);
  } catch (err) {
    if (err.name === "TypeError") {
      // Network failure or API unreachable
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

/**
 * Create a new todo item via the API.
 */
async function addTodo() {
  const title = todoInput.value.trim();

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
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(body || `Server error: ${response.status}`);
    }

    todoInput.value = "";
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

/**
 * Delete a todo item by id.
 * @param {string} id  - The Cosmos DB document id.
 * @param {HTMLElement} listItem - The <li> element to animate out.
 */
async function deleteTodo(id, listItem) {
  if (!id) return;

  dismissError();

  // Optimistic UI: dim the item immediately
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

    // Remove the item from the DOM without a full reload for smoother UX
    listItem.remove();

    // Show empty state if that was the last item
    if (todoList.children.length === 0) {
      todoList.hidden = true;
      emptyState.hidden = false;
    }
  } catch (err) {
    // Roll back optimistic update
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

// ── Event listeners ──────────────────────────────────────────────────────────
todoForm.addEventListener("submit", (e) => {
  e.preventDefault();
  addTodo();
});

// ── Boot ─────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", loadTodos);
