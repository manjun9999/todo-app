// Prints a friendly greeting to the browser console.
function helloWorld() {
  console.log("Hello, World!");
  return "Hello, World!";
}
helloWorld();

const STORAGE_KEY = "todo.tasks";
const input = document.getElementById("new-task");
const dueInput = document.getElementById("new-due");
const addBtn = document.getElementById("add-btn");
const list = document.getElementById("task-list");
const count = document.getElementById("count");
const clearDone = document.getElementById("clear-done");
const themeToggle = document.getElementById("theme-toggle");
const filters = document.getElementById("filters");
const sortSelect = document.getElementById("sort-select");
const search = document.getElementById("search");
const helpBtn = document.getElementById("help-btn");
const helpOverlay = document.getElementById("help-overlay");
const helpClose = document.getElementById("help-close");
const tagFilter = document.getElementById("tag-filter");

const THEME_KEY = "todo.theme";
const SORT_KEY = "todo.sort";
let currentFilter = "all";
let searchQuery = "";
let activeTag = null;

// Extracts #tags from raw input, returning the cleaned text and a deduped,
// lowercased tag list. Example: "Buy milk #home #shop" -> {text:"Buy milk", tags:["home","shop"]}.
function parseTags(raw) {
  const tags = [];
  const text = raw
    .replace(/#([a-zA-Z0-9_-]+)/g, (_, t) => {
      const tag = t.toLowerCase();
      if (!tags.includes(tag)) tags.push(tag);
      return "";
    })
    .replace(/\s{2,}/g, " ")
    .trim();
  return { text, tags };
}
let sortMode = localStorage.getItem(SORT_KEY) || "manual";
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

// Local calendar date as "YYYY-MM-DD" (avoids UTC off-by-one from toISOString).
function todayStr() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// Describes a due date relative to today: label to show, style class, and tooltip.
function describeDue(due) {
  if (!due) return { label: "📅", cls: "", title: "Set a due date" };
  const [y, m, d] = due.split("-").map(Number);
  const label = new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const today = todayStr();
  if (due < today) return { label, cls: "set overdue", title: `Overdue — due ${due}` };
  if (due === today) return { label: "Today", cls: "set today", title: `Due today (${due})` };
  return { label, cls: "set", title: `Due ${due}` };
}

function addTask(rawText, due) {
  const { text, tags } = parseTags(rawText);
  const trimmed = text.trim();
  if (!trimmed) return;
  tasks.push({ id: Date.now(), text: trimmed, done: false, due: due || null, tags });
  save();
  render();
}

function setDue(id, due) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  task.due = due || null;
  save();
  render();
}

// Total tracked time for a task in ms, including the current run if active.
function currentTotal(task) {
  const base = task.timeSpent || 0;
  return task.startedAt ? base + (Date.now() - task.startedAt) : base;
}

// Formats a duration in ms as M:SS, or H:MM:SS once it passes an hour.
function formatDuration(ms) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

// Starts or stops a task's timer. Only one timer runs at a time — starting
// one banks the elapsed time of any other running task first.
function toggleTimer(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  const now = Date.now();
  if (task.startedAt) {
    task.timeSpent = (task.timeSpent || 0) + (now - task.startedAt);
    task.startedAt = null;
  } else {
    tasks.forEach((t) => {
      if (t.startedAt) {
        t.timeSpent = (t.timeSpent || 0) + (now - t.startedAt);
        t.startedAt = null;
      }
    });
    task.startedAt = now;
  }
  save();
  render();
}

// Drives the per-second live update of a running timer (and the Timing total).
let tickHandle = null;
function ensureTicking() {
  const anyRunning = tasks.some((t) => t.startedAt);
  if (anyRunning && !tickHandle) {
    tickHandle = setInterval(tick, 1000);
  } else if (!anyRunning && tickHandle) {
    clearInterval(tickHandle);
    tickHandle = null;
  }
}
function tick() {
  const running = tasks.find((t) => t.startedAt);
  if (!running) {
    ensureTicking();
    return;
  }
  const btn = list.querySelector(".timer.running");
  if (btn) btn.textContent = `⏸ ${formatDuration(currentTotal(running))}`;
  if (currentFilter === "timing") {
    const total = tasks.reduce((sum, t) => sum + currentTotal(t), 0);
    count.textContent = `Total tracked: ${formatDuration(total)}`;
  }
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

function editTask(id, rawText) {
  const { text, tags } = parseTags(rawText);
  const trimmed = text.trim();
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  if (trimmed) {
    task.text = trimmed;
    task.tags = tags;
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
  const tagSuffix = (task.tags || []).map((t) => ` #${t}`).join("");
  editInput.value = task.text + tagSuffix;

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

// Swaps a task's due-date pill for a date picker to set, change, or clear it.
function startDueEdit(li, pill, task) {
  li.draggable = false;
  const picker = document.createElement("input");
  picker.type = "date";
  picker.className = "due-input";
  picker.value = task.due || "";

  let finished = false;
  const commit = () => {
    if (finished) return;
    finished = true;
    setDue(task.id, picker.value);
  };

  picker.addEventListener("change", commit);
  picker.addEventListener("blur", commit);
  picker.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      finished = true;
      render();
    }
  });

  li.replaceChild(picker, pill);
  picker.focus();
  if (picker.showPicker) {
    try { picker.showPicker(); } catch {}
  }
}

function render() {
  list.innerHTML = "";

  const query = searchQuery.trim().toLowerCase();
  const visible = tasks.filter((task) => {
    const tags = task.tags || [];
    if (activeTag && !tags.includes(activeTag)) return false;
    if (query) {
      const inText = task.text.toLowerCase().includes(query);
      const inTags = tags.some((t) => t.includes(query.replace(/^#/, "")));
      if (!inText && !inTags) return false;
    }
    if (currentFilter === "active") return !task.done;
    if (currentFilter === "done") return task.done;
    if (currentFilter === "timing") return currentTotal(task) > 0;
    return true;
  });

  // Show/clear the active-tag filter indicator above the list.
  tagFilter.innerHTML = "";
  if (activeTag) {
    tagFilter.hidden = false;
    const label = document.createElement("span");
    label.textContent = "Filtered by tag:";
    const chip = document.createElement("button");
    chip.className = "tag active";
    chip.textContent = `#${activeTag} ✕`;
    chip.title = "Clear tag filter";
    chip.addEventListener("click", () => {
      activeTag = null;
      render();
    });
    tagFilter.append(label, chip);
  } else {
    tagFilter.hidden = true;
  }

  // The Timing view always orders by most time tracked first.
  if (currentFilter === "timing") {
    visible.sort((a, b) => currentTotal(b) - currentTotal(a));
  } else if (sortMode === "due") {
    visible.sort((a, b) => {
      if (a.due && b.due) return a.due < b.due ? -1 : a.due > b.due ? 1 : 0;
      if (a.due) return -1;
      if (b.due) return 1;
      return 0;
    });
  }

  if (visible.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent =
      tasks.length === 0
        ? "No tasks yet — add one above!"
        : query
        ? `No tasks match “${searchQuery.trim()}”.`
        : activeTag
        ? `No tasks tagged #${activeTag}.`
        : currentFilter === "active"
        ? "No active tasks. 🎉"
        : currentFilter === "done"
        ? "No completed tasks yet."
        : currentFilter === "timing"
        ? "No time tracked yet — press ▶ on a task."
        : "No tasks to show.";
    list.appendChild(empty);
  }

  visible.forEach((task) => {
    const li = document.createElement("li");
    if (task.done) li.classList.add("done");
    const canDrag = sortMode === "manual" && currentFilter !== "timing";
    li.draggable = canDrag;

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
    if (canDrag) {
      grip.title = "Drag to reorder";
    } else {
      grip.title = 'Switch Sort to "My order" to drag';
      grip.style.opacity = "0.35";
      grip.style.cursor = "default";
    }

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.addEventListener("change", () => toggleTask(task.id));

    const span = document.createElement("span");
    span.className = "task-text";
    span.textContent = task.text;
    span.title = "Double-click to edit";
    span.addEventListener("dblclick", () => startEdit(li, span, task));

    const total = currentTotal(task);
    const running = !!task.startedAt;
    const timer = document.createElement("button");
    timer.className = "timer" + (running ? " running" : "");
    timer.textContent = running
      ? `⏸ ${formatDuration(total)}`
      : total > 0
      ? `▶ ${formatDuration(total)}`
      : "▶";
    timer.title = running ? "Stop timer" : "Start timer";
    timer.addEventListener("click", () => toggleTimer(task.id));

    const dueInfo = describeDue(task.due);
    const due = document.createElement("button");
    due.className = `due ${dueInfo.cls}`.trim();
    due.textContent = dueInfo.label;
    due.title = dueInfo.title;
    due.addEventListener("click", () => startDueEdit(li, due, task));

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

    li.append(grip, checkbox, span);

    (task.tags || []).forEach((tag) => {
      const chip = document.createElement("button");
      chip.className = "tag" + (tag === activeTag ? " active" : "");
      chip.textContent = `#${tag}`;
      chip.title = `Filter by #${tag}`;
      chip.addEventListener("click", () => {
        activeTag = activeTag === tag ? null : tag;
        render();
      });
      li.append(chip);
    });

    li.append(timer, due, edit, del);
    list.appendChild(li);
  });

  const doneCount = tasks.filter((t) => t.done).length;
  const remaining = tasks.length - doneCount;
  const timedCount = tasks.filter((t) => currentTotal(t) > 0).length;

  if (currentFilter === "timing") {
    const total = tasks.reduce((sum, t) => sum + currentTotal(t), 0);
    count.textContent = `Total tracked: ${formatDuration(total)}`;
  } else {
    count.textContent = `${remaining} item${remaining === 1 ? "" : "s"} left`;
  }

  filters.querySelector('[data-count="all"]').textContent = tasks.length;
  filters.querySelector('[data-count="active"]').textContent = remaining;
  filters.querySelector('[data-count="done"]').textContent = doneCount;
  filters.querySelector('[data-count="timing"]').textContent = timedCount;

  ensureTicking();
}

function selectFilter(name) {
  currentFilter = name;
  filters.querySelectorAll(".filter-btn").forEach((b) =>
    b.classList.toggle("active", b.dataset.filter === name)
  );
  render();
}

filters.addEventListener("click", (e) => {
  const btn = e.target.closest(".filter-btn");
  if (!btn) return;
  selectFilter(btn.dataset.filter);
});

sortSelect.value = sortMode;
sortSelect.addEventListener("change", () => {
  sortMode = sortSelect.value;
  localStorage.setItem(SORT_KEY, sortMode);
  render();
});

search.addEventListener("input", () => {
  searchQuery = search.value;
  render();
});

function submitNewTask() {
  addTask(input.value, dueInput.value);
  input.value = "";
  dueInput.value = "";
  input.focus();
}

addBtn.addEventListener("click", submitNewTask);

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") submitNewTask();
});

clearDone.addEventListener("click", () => {
  tasks = tasks.filter((t) => !t.done);
  save();
  render();
});

// --- Keyboard shortcuts ---

function openHelp() {
  helpOverlay.hidden = false;
}
function closeHelp() {
  helpOverlay.hidden = true;
}
function toggleHelp() {
  helpOverlay.hidden = !helpOverlay.hidden;
}

// True when focus is in a field, so typing there isn't hijacked by shortcuts.
function isTyping() {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable
  );
}

helpBtn.addEventListener("click", toggleHelp);
helpClose.addEventListener("click", closeHelp);
helpOverlay.addEventListener("click", (e) => {
  if (e.target === helpOverlay) closeHelp();
});

document.addEventListener("keydown", (e) => {
  // Escape works everywhere: close help, or clear/blur the search box.
  if (e.key === "Escape") {
    if (!helpOverlay.hidden) {
      closeHelp();
    } else if (document.activeElement === search) {
      if (search.value) {
        search.value = "";
        searchQuery = "";
        render();
      }
      search.blur();
    }
    return;
  }

  // "?" toggles the help panel (Shift + / on most layouts).
  if (e.key === "?" && !isTyping()) {
    e.preventDefault();
    toggleHelp();
    return;
  }

  // Ignore the rest while help is open, while typing, or with modifier keys.
  if (!helpOverlay.hidden || isTyping() || e.ctrlKey || e.metaKey || e.altKey) return;

  switch (e.key) {
    case "n":
      e.preventDefault();
      input.focus();
      break;
    case "/":
      e.preventDefault();
      search.focus();
      break;
    case "1":
      selectFilter("all");
      break;
    case "2":
      selectFilter("active");
      break;
    case "3":
      selectFilter("done");
      break;
    case "4":
      selectFilter("timing");
      break;
    case "d":
      toggleTheme();
      break;
  }
});

render();
