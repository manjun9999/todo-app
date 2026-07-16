# 📝 Todo App

A simple, self-contained todo list that runs entirely in the browser — no build step, no dependencies, no server. Tasks are saved locally so they persist across page reloads.

**🔗 Live demo:** https://manjun9999.github.io/todo-app/

## Features

- ✅ **Add / complete / delete** tasks
- 📅 **Due dates** — optionally attach a due date when adding, then click a task's date pill to change or clear it. Pills are color-coded: overdue (red), due today (highlighted), upcoming (muted)
- ✏️ **Edit in place** — double-click a task or click the pencil (Enter to save, Escape to cancel)
- 🔀 **Drag to reorder** — grab the ⠿ handle and drop a task where you want it
- ↕️ **Sort** — switch between **My order** (manual drag order) and **Due date** (earliest first, undated tasks last)
- 🔍 **Search** — filter tasks by text as you type (case-insensitive), combined with the active tab filter
- 🗂️ **Filter tabs** — view **All**, **Active**, or **Done**, each with a live count badge
- ⌨️ **Keyboard shortcuts** — press <kbd>?</kbd> (or the ⌨ button) for the full list; quickly add, search, filter, and toggle themes without the mouse
- 🌙 **Dark mode** — toggle light/dark, or follow your operating system's preference automatically
- 💾 **Persistent** — tasks and theme choice are stored in the browser's `localStorage`
- 🧹 **Clear completed** — remove all finished tasks at once

## Getting started

No installation required. Just clone and open the app:

```bash
git clone https://github.com/manjun9999/todo-app.git
cd todo-app
```

Then open `index.html` in any modern web browser (double-click it, or drag it into a browser window).

> **Note:** keep the three files together — `index.html` links `styles.css` and `app.js` by relative path.

## Keyboard shortcuts

Press <kbd>?</kbd> in the app to see these at any time.

| Key | Action |
|-----|--------|
| <kbd>n</kbd> | Focus the new-task input |
| <kbd>/</kbd> | Focus search |
| <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> | Filter All / Active / Done |
| <kbd>d</kbd> | Toggle dark mode |
| <kbd>?</kbd> | Show / hide the shortcuts help |
| <kbd>Esc</kbd> | Close help · clear search |

Shortcuts are ignored while you're typing in a field or holding a modifier key.

## Project structure

```
todo-app/
├── index.html    # Markup — links the stylesheet and script
├── styles.css    # All styling, including light/dark theme variables
├── app.js        # All application logic
└── README.md
```

## How it works

- **State** lives in a `tasks` array (`{ id, text, done, due }`, where `due` is a `YYYY-MM-DD` string or `null`), persisted to `localStorage` under the `todo.tasks` key.
- **Due dates** use local calendar days and are compared against today to flag overdue, due-today, and upcoming tasks.
- **Rendering** is handled by a single `render()` function that redraws the list from state on every change.
- **Theme** preference is stored under `todo.theme`; when unset, the app respects the OS `prefers-color-scheme` setting.
- **Reordering** rearranges the `tasks` array via the native HTML5 drag-and-drop API and re-saves; drag-to-reorder is available only in "My order" sort mode.
- **Sorting** is display-only (it never mutates stored order); the chosen mode is saved under `todo.sort`.

## Tech stack

Plain **HTML5**, **CSS3** (custom properties, flexbox), and **vanilla JavaScript (ES6+)**. No frameworks, no libraries, no build tooling.

## Browser support

Works in any current version of Chrome, Edge, Firefox, and Safari.
