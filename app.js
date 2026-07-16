// Prints a friendly greeting to the browser console.
function helloWorld() {
  console.log("Hello, World!");
  return "Hello, World!";
}
helloWorld();

const STORAGE_KEY = "todo.tasks";
const input = document.getElementById("new-task");
const addBtn = document.getElementById("add-btn");
const list = document.getElementById("task-list");
const count = document.getElementById("count");
const clearDone = document.getElementById("clear-done");
const themeToggle = document.getElementById("theme-toggle");
const filters = document.getElementById("filters");

const THEME_KEY = "todo.theme";
let currentFilter = "all";
let draggedId = null;

// Moves the dragged task to the position of the task it was dropped on.
function reorderTasks(fromId, toId) {
  if (fromId === toId) return;
  const from = tasks.findIndex((t) => t.id === fromId);
  if (from === -1) return;
  const [moved] = tasks.splice(from, 1);
  const to = tasks.findIndex((t) => t.id === toId);
  tasks.splice(to === -1 ? tasks.length : to, 0, moved);
  save();
  render();
}

// Applies a theme ("dark"/"light"), or falls back to the OS preference
// when no explicit choice has been saved.
function applyTheme(theme) {
  if (theme === "dark" || theme === "light") {
    document.documentElement.setAttribute("data-theme", theme);
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  const isDark =
    theme === "dark" ||
    (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches);
  themeToggle.textContent = isDark ? "☀️" : "🌙";
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark" ||
    (!document.documentElement.getAttribute("data-theme") &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  const next = isDark ? "light" : "dark";
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
}

applyTheme(localStorage.getItem(THEME_KEY));
themeToggle.addEventListener("click", toggleTheme);

let tasks = load();

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function addTask(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  tasks.push({ id: Date.now(), text: trimmed, done: false });
  save();
  render();
}

function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (task) task.done = !task.done;
  save();
  render();
}

function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  save();
  render();
}

function editTask(id, newText) {
  const trimmed = newText.trim();
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  if (trimmed) {
    task.text = trimmed;
    save();
  }
  render();
}

// Swaps a task's text span for an inline input so it can be edited.
function startEdit(li, span, task) {
  li.draggable = false;
  const editInput = document.createElement("input");
  editInput.type = "text";
  editInput.className = "edit-input";
  editInput.value = task.text;

  let finished = false;
  const commit = () => {
    if (finished) return;
    finished = true;
    editTask(task.id, editInput.value);
  };
  const cancel = () => {
    if (finished) return;
    finished = true;
    render();
  };

  editInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") commit();
    else if (e.key === "Escape") cancel();
  });
  editInput.addEventListener("blur", commit);

  li.replaceChild(editInput, span);
  editInput.focus();
  editInput.select();
}

function render() {
  list.innerHTML = "";

  const visible = tasks.filter((task) => {
    if (currentFilter === "active") return !task.done;
    if (currentFilter === "done") return task.done;
    return true;
  });

  if (visible.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent =
      tasks.length === 0
        ? "No tasks yet — add one above!"
        : currentFilter === "active"
        ? "No active tasks. 🎉"
        : currentFilter === "done"
        ? "No completed tasks yet."
        : "No tasks to show.";
    list.appendChild(empty);
  }

  visible.forEach((task) => {
    const li = document.createElement("li");
    if (task.done) li.classList.add("done");
    li.draggable = true;

    li.addEventListener("dragstart", (e) => {
      draggedId = task.id;
      li.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(task.id));
    });
    li.addEventListener("dragend", () => {
      draggedId = null;
      li.classList.remove("dragging");
      list.querySelectorAll(".drag-over").forEach((el) =>
        el.classList.remove("drag-over")
      );
    });
    li.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (draggedId !== null && draggedId !== task.id) {
        li.classList.add("drag-over");
      }
    });
    li.addEventListener("dragleave", () => li.classList.remove("drag-over"));
    li.addEventListener("drop", (e) => {
      e.preventDefault();
      li.classList.remove("drag-over");
      if (draggedId !== null) reorderTasks(draggedId, task.id);
    });

    const grip = document.createElement("span");
    grip.className = "grip";
    grip.textContent = "⠿";
    grip.title = "Drag to reorder";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.addEventListener("change", () => toggleTask(task.id));

    const span = document.createElement("span");
    span.className = "task-text";
    span.textContent = task.text;
    span.title = "Double-click to edit";
    span.addEventListener("dblclick", () => startEdit(li, span, task));

    const edit = document.createElement("button");
    edit.className = "edit-btn";
    edit.textContent = "✎";
    edit.title = "Edit";
    edit.addEventListener("click", () => startEdit(li, span, task));

    const del = document.createElement("button");
    del.className = "delete-btn";
    del.textContent = "×";
    del.title = "Delete";
    del.addEventListener("click", () => deleteTask(task.id));

    li.append(grip, checkbox, span, edit, del);
    list.appendChild(li);
  });

  const doneCount = tasks.filter((t) => t.done).length;
  const remaining = tasks.length - doneCount;
  count.textContent = `${remaining} item${remaining === 1 ? "" : "s"} left`;

  filters.querySelector('[data-count="all"]').textContent = tasks.length;
  filters.querySelector('[data-count="active"]').textContent = remaining;
  filters.querySelector('[data-count="done"]').textContent = doneCount;
}

filters.addEventListener("click", (e) => {
  const btn = e.target.closest(".filter-btn");
  if (!btn) return;
  currentFilter = btn.dataset.filter;
  filters.querySelectorAll(".filter-btn").forEach((b) =>
    b.classList.toggle("active", b === btn)
  );
  render();
});

addBtn.addEventListener("click", () => {
  addTask(input.value);
  input.value = "";
  input.focus();
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    addTask(input.value);
    input.value = "";
  }
});

clearDone.addEventListener("click", () => {
  tasks = tasks.filter((t) => !t.done);
  save();
  render();
});

render();
